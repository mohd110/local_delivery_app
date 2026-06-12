'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/lib/types'
import Link from 'next/link'
import { ChevronLeft, Search, HelpCircle, Phone, MessageSquare, Star, Clock, Check, ChefHat, Bike, Compass } from 'lucide-react'
import BottomNav from '@/components/BottomNav'

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function fetchOrder() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_order, products(name))')
        .eq('id', id)
        .eq('customer_id', user.id)
        .single()

      if (data) {
        setOrder(data as Order)
      }
      setLoading(false)
    }

    fetchOrder()

    // Subscribe to real-time order updates
    const channel = supabase
      .channel(`order-tracking-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          setOrder((prev) => (prev ? { ...prev, ...(payload.new as Partial<Order>) } : null))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-[100dvh] phone-screen flex flex-col items-center justify-center bg-[#f7f8fa]">
        <div className="w-10 h-10 border-4 border-[#c0392b] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400 mt-3 font-semibold">Loading tracking info...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-[100dvh] phone-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-5 text-center">
        <span className="text-5xl mb-3">📍</span>
        <h2 className="text-sm font-extrabold text-gray-900 mb-1">Order Not Found</h2>
        <p className="text-xs text-gray-400 mb-6 font-medium">This order might not exist or belongs to another user.</p>
        <button onClick={() => router.push('/orders')} className="px-6 py-2.5 bg-[#c0392b] text-white font-bold rounded-xl cursor-pointer">
          Go to Orders
        </button>
      </div>
    )
  }

  // Calculate dynamic ETA (e.g. 30 minutes from created_at)
  const createdDate = new Date(order.created_at)
  const etaDate = new Date(createdDate.getTime() + 30 * 60 * 1000)
  const etaTimeStr = etaDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

  // Determine current active stepper status index
  const status = order.status as OrderStatus
  const currentStep = status === 'pending' ? 0
    : status === 'accepted' || status === 'preparing' ? 1
    : status === 'ready' || status === 'out_for_delivery' ? 2
    : status === 'delivered' ? 3
    : -1

  // Extract items summary
  const addressPayload = order.delivery_address as any
  const itemsCount = addressPayload?.items
    ? (addressPayload.items as any[]).reduce((sum, i) => sum + i.quantity, 0)
    : order.order_items?.reduce((sum, i) => sum + i.quantity, 0) || 0

  return (
    <div className="min-h-[100dvh] phone-screen flex flex-col bg-[#f7f8fa] text-gray-900 pb-safe">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 px-4 h-14 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 cursor-pointer">
            <ChevronLeft className="size-6 text-[#c0392b]" />
          </button>
          <h1 className="text-base font-extrabold text-[#c0392b]">Track Order</h1>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <Search className="size-5 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <HelpCircle className="size-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto pb-28">
        
        {/* ── 3D Isometric Map Panel ── */}
        <div className="relative w-full h-52 bg-gray-100 overflow-hidden shadow-inner flex-shrink-0">
          <img
            src="/delivery-map.png"
            alt="Delivery Map"
            className="w-full h-full object-cover"
          />
          {/* Distance overlay pill */}
          <div className="absolute bottom-4 left-4 bg-white/95 px-3 py-1.5 rounded-full shadow-md flex items-center gap-1 border border-gray-100/50">
            <span className="text-[10px] font-extrabold text-gray-800 flex items-center gap-1">
              📍 1.8 km away
            </span>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">

          {/* ── Estimated Arrival Card ── */}
          <div className="bg-white rounded-3xl p-5 text-center shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50/50">
            <p className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">Estimated Arrival</p>
            <h2 className="text-3xl font-black text-[#c0392b] mt-1.5 tracking-tight">{etaTimeStr}</h2>
            <p className="text-xs text-gray-500 font-bold mt-2">
              {status === 'pending' && 'We are confirming your order...'}
              {(status === 'accepted' || status === 'preparing') && 'Your meal is being prepared with love!'}
              {(status === 'ready' || status === 'out_for_delivery') && 'Your order is on its way to you!'}
              {status === 'delivered' && 'Your order has arrived. Enjoy your meal!'}
              {status === 'cancelled' && 'This order was cancelled.'}
            </p>
          </div>

          {/* ── Rider Information Card ── */}
          {status !== 'cancelled' && (
            <div className="bg-white rounded-3xl p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200/50">
                  <img
                    src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"
                    className="w-full h-full object-cover"
                    alt="Rider avatar"
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Arjun Sharma</h4>
                  <p className="text-[10px] text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    4.9 &bull; Valued Rider
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-[#c0392b] text-white flex items-center justify-center shadow-md hover:bg-[#a93226] cursor-pointer">
                  <Phone className="size-4 fill-white text-[#c0392b]" />
                </button>
                <button className="w-9 h-9 rounded-full bg-white text-gray-500 border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 cursor-pointer">
                  <MessageSquare className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Delivery Status Stepper ── */}
          <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-gray-50/50">
            <h3 className="text-sm font-extrabold text-gray-900 mb-5 px-0.5">Delivery Status</h3>
            
            {status === 'cancelled' ? (
              <div className="py-4 text-center text-red-500 font-bold text-xs">
                ❌ This order has been cancelled.
              </div>
            ) : (
              <div className="relative space-y-6 pl-8">
                {[
                  { label: 'Order Received', desc: 'We have confirmed your order and started preparing.' },
                  { label: 'Preparing your food', desc: 'Our chefs are cooking your fresh Mughlai delicacies.' },
                  { label: 'Out for Delivery', desc: 'Rider is on the way to pick up and deliver your meal.' },
                  { label: 'Arrived at Home', desc: `Expected arrival at ${etaTimeStr}` },
                ].map((step, i) => {
                  const done = i <= currentStep
                  
                  return (
                    <div key={i} className="relative flex items-start">
                      {/* Segment Connector Line */}
                      {i < 3 && (
                        <div className={`absolute left-[-21px] top-9 w-0.5 h-7 -z-10 ${
                          i < currentStep ? 'bg-[#c0392b]' : 'bg-gray-100'
                        }`} />
                      )}
                      
                      {/* Step Icon */}
                      <div className={`absolute -left-9.5 top-0 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        done 
                          ? 'bg-[#c0392b] border-[#c0392b] text-white shadow-md shadow-[#c0392b]/20 scale-100' 
                          : 'bg-white border-gray-200 text-gray-300 scale-95'
                      }`}>
                        {i === 0 && <Check className="size-4.5" strokeWidth={done ? 3 : 2} />}
                        {i === 1 && <ChefHat className="size-4.5" strokeWidth={2} />}
                        {i === 2 && <Bike className="size-4.5" strokeWidth={2} />}
                        {i === 3 && <Compass className="size-4.5" strokeWidth={2} />}
                      </div>
                      
                      {/* Step Details */}
                      <div className="pl-3.5 min-w-0">
                        <h4 className={`text-xs font-bold transition-colors ${done ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-[10px] leading-relaxed mt-0.5 transition-colors ${done ? 'text-gray-500' : 'text-gray-300'}`}>
                          {i === 0 && done
                            ? `${new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} &bull; We've confirmed your order`
                            : step.desc}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Order Receipt Badge Card ── */}
          <div className="bg-gray-100 rounded-3xl p-4 flex items-center justify-between border border-gray-200/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-lg flex-shrink-0">
                📄
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-gray-900">Order #{id.slice(0, 8).toUpperCase()}</h4>
                <p className="text-[10px] text-gray-500 font-bold mt-0.5">
                  {itemsCount} {itemsCount === 1 ? 'item' : 'items'} &bull; ₹{order.total}
                </p>
              </div>
            </div>
            <Link
              href={`/order-success/${order.id}`}
              className="text-xs font-extrabold text-[#c0392b] hover:underline cursor-pointer flex-shrink-0"
            >
              View Details
            </Link>
          </div>

        </div>
      </div>

      <BottomNav />
    </div>
  )
}
