'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type OrderStatus, type PaymentStatus, type Complaint } from '@/lib/types'
import { toast } from 'sonner'
import BottomNav from '@/components/BottomNav'
import LiveMap from '@/components/LiveMap'
import {
  ChevronLeft,
  HelpCircle,
  Check,
  ChefHat,
  Package,
  Bike,
  Compass,
  Phone,
  MessageSquare,
  Star,
  Clock,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react'

const CANCEL_WINDOW_MS = 5 * 60 * 1000

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

type CancelReason =
  | 'item_not_available'
  | 'too_busy'
  | 'customer_unreachable'
  | 'payment_issue'
  | 'customer_requested'
  | 'other'
  | null

const CANCEL_REASON_LABELS: Record<NonNullable<CancelReason>, { label: string; desc: string; emoji: string }> = {
  item_not_available: {
    emoji: '🥡',
    label: 'Item Not Available',
    desc: 'One or more items you ordered were out of stock at the time.',
  },
  too_busy: {
    emoji: '⏳',
    label: 'Restaurant Too Busy',
    desc: "We were at full capacity and couldn't take on new orders right now.",
  },
  customer_unreachable: {
    emoji: '📵',
    label: 'Could Not Reach You',
    desc: 'We tried to contact you but were unable to reach you.',
  },
  payment_issue: {
    emoji: '💳',
    label: 'Payment Issue',
    desc: 'There was a problem verifying your payment. Please try again.',
  },
  customer_requested: {
    emoji: '👋',
    label: 'Cancelled by You',
    desc: 'You cancelled this order within the 5-minute window.',
  },
  other: {
    emoji: '📋',
    label: 'Other Reason',
    desc: 'We were unable to fulfill your order. We apologise for the inconvenience.',
  },
}

interface OrderItem {
  id: string
  quantity: number
  price_at_order: number
  products: { name: string } | null
}

interface OrderData {
  id: string
  order_number: string | null
  status: OrderStatus
  payment_status: PaymentStatus
  utr_number: string | null
  total: number
  delivery_fee: number
  cancel_reason: CancelReason
  delivery_address: {
    name: string
    phone: string
    address: string
    landmark?: string
    pincode: string
  }
  delivery_latitude: number | null
  delivery_longitude: number | null
  created_at: string
  rider_id: string | null
  order_items: OrderItem[]
  restaurants: { latitude: number | null; longitude: number | null } | null
}

// ── Stepper steps ────────────────────────────────────────────
// 5 steps: Order Sent → Accepted → Preparing → Ready → Out for Delivery → Arrived
const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
]

// Map DB status + payment_status → visual stepper step (0-based, 5 steps)
function currentStep(order: OrderData): number {
  if (order.status === 'pending' && order.payment_status === 'pending_verification') return 0
  if (order.status === 'pending') return 0
  if (order.status === 'accepted') return 1   // ← Now its own step
  if (order.status === 'preparing') return 2
  if (order.status === 'ready') return 3
  if (order.status === 'out_for_delivery') return 4
  if (order.status === 'delivered') return 5
  return 0
}

export default function OrderStatusPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<OrderData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [cancelling, setCancelling] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  const fetchOrder = useCallback(async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select(
        `id, order_number, status, payment_status, utr_number, total, delivery_fee,
         cancel_reason, delivery_address, delivery_latitude, delivery_longitude,
         created_at, rider_id,
         restaurants(latitude, longitude),
         order_items(id, quantity, price_at_order, products(name))`
      )
      .eq('id', id)
      .single()

    if (error) console.error('fetchOrder failed:', error)
    if (error || !data) { setNotFound(true); return }
    setOrder(data as unknown as OrderData)
  }, [id])

  const fetchComplaints = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
    setComplaints(data ?? [])
  }, [id])

  useEffect(() => {
    fetchOrder()
    fetchComplaints()
    const supabase = createClient()

    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        () => fetchOrder()
      )
      .subscribe()

    const timer = setInterval(fetchOrder, 30_000)
    const clock = setInterval(() => setNow(Date.now()), 1000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(timer)
      clearInterval(clock)
    }
  }, [id, fetchOrder, fetchComplaints])

  async function handleCancel() {
    if (!order) return
    if (!confirm('Cancel this order? This cannot be undone.')) return
    setCancelling(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancel_reason: 'customer_requested' })
      .eq('id', order.id)

    if (error) {
      toast.error('Could not cancel — the 5-minute window may have just expired.')
    } else {
      toast.success('Order cancelled')
      fetchOrder()
    }
    setCancelling(false)
  }

  if (notFound) {
    return (
      <div className="min-h-[100dvh] phone-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-5 text-center">
        <span className="text-5xl mb-3">📍</span>
        <h2 className="text-sm font-extrabold text-gray-900 mb-1">Order Not Found</h2>
        <p className="text-xs text-gray-400 mb-6 font-medium">
          This order might not exist or belongs to another user.
        </p>
        <button
          onClick={() => router.push('/menu')}
          className="px-6 py-2.5 bg-[#b51c00] text-white font-bold rounded-xl"
        >
          Go to Menu
        </button>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-[100dvh] phone-screen flex flex-col items-center justify-center bg-[#f7f8fa]">
        <div className="w-10 h-10 border-4 border-[#b51c00] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 mt-3 font-semibold">Loading tracking info...</p>
      </div>
    )
  }

  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'
  const msSinceCreated = now - new Date(order.created_at).getTime()
  const canCancel = !isCancelled && !isDelivered && msSinceCreated < CANCEL_WINDOW_MS
  const cancelRemainingMs = CANCEL_WINDOW_MS - msSinceCreated
  const step = currentStep(order)
  const statusIdx = STATUS_ORDER.indexOf(order.status)
  const showRider = statusIdx >= 4 // out_for_delivery or delivered

  // Determine if this was a restaurant-initiated cancellation
  const isRestaurantCancelled =
    isCancelled &&
    order.cancel_reason !== 'customer_requested' &&
    order.cancel_reason !== null

  const cancelReasonInfo = order.cancel_reason
    ? CANCEL_REASON_LABELS[order.cancel_reason]
    : null

  const restaurantCoords =
    order.restaurants?.latitude != null && order.restaurants?.longitude != null
      ? { lat: order.restaurants.latitude, lng: order.restaurants.longitude }
      : null
  const customerCoords =
    order.delivery_latitude != null && order.delivery_longitude != null
      ? { lat: order.delivery_latitude, lng: order.delivery_longitude }
      : null
  const hasMapData = !isCancelled && (restaurantCoords || customerCoords)

  const createdDate = new Date(order.created_at)
  const etaDate = new Date(createdDate.getTime() + 30 * 60 * 1000)
  const etaStr = etaDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const createdStr = createdDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  // ── Status message (top of ETA card) ─────────────────────
  const statusMessage = isCancelled
    ? isRestaurantCancelled
      ? 'We are sorry, due to some issues we couldn\'t fulfill your order.'
      : 'You cancelled this order.'
    : isDelivered
    ? 'Your order has arrived. Enjoy your meal!'
    : order.status === 'out_for_delivery'
    ? 'Rider is on the way to you!'
    : order.status === 'ready'
    ? 'Food is packed and ready for pickup'
    : order.status === 'accepted'
    ? 'Great news! Your order has been accepted 🎉'
    : order.status === 'preparing'
    ? 'Your biryani is being prepared with love!'
    : order.payment_status === 'pending_verification'
    ? 'Verifying your UPI payment...'
    : 'We have received your order'

  // ── Stepper steps (now 6 steps) ──────────────────────────
  const steps = [
    {
      label: 'Order Sent',
      desc:
        step > 0
          ? `${createdStr} · We've received your order`
          : "We've received your order",
      icon: Check,
      color: '#b51c00',
    },
    {
      label: 'Order Accepted',
      desc: 'Restaurant has confirmed and accepted your order',
      icon: ThumbsUp,
      color: '#7c3aed',
    },
    {
      label: 'Preparing your food',
      desc:
        order.payment_status === 'pending_verification' && step <= 0
          ? 'Waiting for payment verification'
          : 'The chef is adding the final touches to your Biryani',
      icon: ChefHat,
      color: '#f59e0b',
    },
    {
      label: 'Ready for Pickup',
      desc: 'Food is packed and waiting for the rider',
      icon: Package,
      color: '#16a34a',
    },
    {
      label: 'Out for Delivery',
      desc: 'Rider will pick up soon',
      icon: Bike,
      color: '#2563eb',
    },
    {
      label: 'Arrived at Home',
      desc: `Expected by ${etaStr}`,
      icon: Compass,
      color: '#15803d',
    },
  ]

  const itemsCount = order.order_items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <div className="min-h-[100dvh] phone-screen flex flex-col bg-[#f7f8fa] text-gray-900">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 px-4 h-14 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ChevronLeft className="size-6 text-[#b51c00]" />
          </button>
          <h1 className="text-base font-extrabold text-[#b51c00]">Track Order</h1>
        </div>
        <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <HelpCircle className="size-5 text-gray-500" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">

        {/* ── Live Map ── */}
        {hasMapData ? (
          <div className="relative w-full h-52 overflow-hidden flex-shrink-0">
            <LiveMap
              orderId={order.id}
              restaurantCoords={restaurantCoords}
              customerCoords={customerCoords}
            />
          </div>
        ) : (
          <div className="w-full h-24 bg-gray-800 flex items-center justify-center flex-shrink-0">
            <p className="text-white/50 text-xs font-semibold">
              {isCancelled ? 'Order cancelled' : 'Location not available for this order'}
            </p>
          </div>
        )}

        <div className="px-4 py-4 space-y-4">

          {/* ── ETA Card ── */}
          <div
            className="bg-white rounded-3xl p-5 text-center"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            {!isDelivered && !isCancelled && (
              <>
                <p className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">
                  Estimated Arrival
                </p>
                <h2 className="text-3xl font-black text-[#b51c00] mt-1.5 tracking-tight">{etaStr}</h2>
              </>
            )}
            {isCancelled && (
              <p className="text-sm font-bold text-red-500">❌ Order Cancelled</p>
            )}
            <p className="text-xs text-gray-500 font-bold mt-2">{statusMessage}</p>
            {order.payment_status === 'pending_verification' && !isCancelled && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-left">
                <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                  <Clock className="size-3" /> Verifying UPI payment
                </p>
                <p className="text-[10px] text-amber-600 mt-0.5 font-mono">
                  UTR: {order.utr_number}
                </p>
              </div>
            )}
          </div>

          {/* ── Cancel Reason Card (visible only when cancelled) ── */}
          {isCancelled && cancelReasonInfo && (
            <div
              className={`rounded-3xl p-4 ${
                isRestaurantCancelled
                  ? 'bg-red-50 border border-red-100'
                  : 'bg-gray-50 border border-gray-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg ${
                  isRestaurantCancelled ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  {cancelReasonInfo.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[10px] font-extrabold uppercase tracking-wider mb-0.5 ${
                    isRestaurantCancelled ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    Reason for Cancellation
                  </p>
                  <p className="text-xs font-bold text-gray-900">{cancelReasonInfo.label}</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">
                    {cancelReasonInfo.desc}
                  </p>
                  {isRestaurantCancelled && (
                    <p className="text-[10px] text-red-400 font-semibold mt-2">
                      If you were charged, your refund will be processed within 3–5 business days.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fallback: no cancel_reason stored yet (old orders) */}
          {isCancelled && !cancelReasonInfo && isRestaurantCancelled && (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="size-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Order could not be fulfilled</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-1 leading-relaxed">
                    We apologise for any inconvenience. If you were charged, your refund will be processed within 3–5 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Cancel Order (5-minute window) ── */}
          {canCancel && (
            <div
              className="bg-white rounded-3xl p-4 flex items-center justify-between gap-3"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">Need to cancel?</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                  You can cancel within {formatCountdown(cancelRemainingMs)} of placing this order
                </p>
              </div>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="h-9 px-4 rounded-xl border-2 border-red-500 text-red-500 text-xs font-bold disabled:opacity-50 flex-shrink-0"
              >
                {cancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            </div>
          )}

          {/* ── Rider Card ── */}
          {showRider ? (
            <div
              className="bg-white rounded-3xl p-4 flex items-center justify-between"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
                    className="w-full h-full object-cover"
                    alt="Rider"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Arjun Sharma</h4>
                  <p className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    4.9 · Valued Rider
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-[#b51c00] text-white flex items-center justify-center shadow-md">
                  <Phone className="size-4 fill-white text-white" />
                </button>
                <button className="w-9 h-9 rounded-full bg-white text-gray-500 border border-gray-200 flex items-center justify-center shadow-sm">
                  <MessageSquare className="size-4" />
                </button>
              </div>
            </div>
          ) : (
            !isCancelled && (
              // Placeholder rider card when rider not yet assigned
              <div
                className="bg-white rounded-3xl p-4 flex items-center gap-3"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
                  🛵
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Rider will be assigned soon</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    You&apos;ll see their details here once assigned
                  </p>
                </div>
              </div>
            )
          )}

          {/* ── Delivery Status Stepper ── */}
          <div
            className="bg-white rounded-3xl p-5"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <h3 className="text-sm font-extrabold text-gray-900 mb-5 px-0.5">Delivery Status</h3>

            {isCancelled ? (
              <div className="py-2 space-y-3">
                <div className="flex items-center gap-3 text-red-500">
                  <div className="w-9 h-9 rounded-full bg-red-50 border-2 border-red-400 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">✕</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-red-500">Order Cancelled</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                      {isRestaurantCancelled
                        ? 'The restaurant was unable to fulfil this order.'
                        : 'You cancelled this order.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative space-y-6 pl-8">
                {steps.map((s, i) => {
                  const done = i <= step
                  const Icon = s.icon
                  return (
                    <div key={i} className="relative flex items-start">
                      {/* Connector line */}
                      {i < steps.length - 1 && (
                        <div
                          className="absolute left-[-21px] top-9 w-0.5 h-7 -z-10 transition-colors"
                          style={{ backgroundColor: i < step ? steps[i + 1].color : '#f3f4f6' }}
                        />
                      )}
                      {/* Step icon */}
                      <div
                        className={`absolute -left-[38px] top-0 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                          done ? 'text-white shadow-md' : 'bg-white border-gray-200 text-gray-300'
                        }`}
                        style={
                          done
                            ? {
                                backgroundColor: s.color,
                                borderColor: s.color,
                                boxShadow: `0 2px 8px ${s.color}40`,
                              }
                            : undefined
                        }
                      >
                        <Icon className="size-4" strokeWidth={done ? 2.5 : 2} />
                      </div>
                      {/* Step text */}
                      <div className="pl-3.5 min-w-0">
                        <h4
                          className={`text-xs font-bold transition-colors ${
                            done ? 'text-gray-900' : 'text-gray-400'
                          }`}
                        >
                          {s.label}
                        </h4>
                        <p
                          className={`text-[10px] leading-relaxed mt-0.5 transition-colors ${
                            done ? 'text-gray-500' : 'text-gray-300'
                          }`}
                        >
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Report an Issue ── */}
          <div
            className="bg-white rounded-3xl p-4"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900">Need help with this order?</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                  Report a missing item, quality issue, or anything else
                </p>
              </div>
              <button
                onClick={() => router.push(`/orders/${id}/complaint`)}
                className="h-9 px-4 rounded-xl bg-[#191c1d] text-white text-xs font-bold flex-shrink-0"
              >
                Report Issue
              </button>
            </div>

            {complaints.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                {complaints.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-600 capitalize">
                      {c.category.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : c.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.status === 'in_progress' ? 'In Progress' : c.status === 'resolved' ? 'Resolved' : 'Open'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Order Receipt Badge ── */}
          <div className="bg-gray-100 rounded-3xl p-4 flex items-center justify-between border border-gray-200/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-lg flex-shrink-0">
                📄
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-gray-900">
                  Order {order.order_number ?? `#${id.slice(0, 8).toUpperCase()}`}
                </h4>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                  {itemsCount} {itemsCount === 1 ? 'item' : 'items'} · ₹{order.total}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push('/menu')}
              className="text-xs font-extrabold text-[#b51c00] flex-shrink-0"
            >
              Order Again
            </button>
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  )
}
