'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { useLocationStore } from '@/store/location'
import { createClient } from '@/lib/supabase/client'
import { haversineKm, deliveryFeeFromKm } from '@/lib/distance'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { ChevronLeft, MapPin, Copy, CheckCircle2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCartStore()
  const submittingRef = useRef(false)

  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [deliveryFee, setDeliveryFee] = useState(66)
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [outsideZone, setOutsideZone] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    pincode: '',
    utr: '',
  })

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const total = outsideZone ? 0 : subtotal + deliveryFee

  useEffect(() => {
    const supabase = createClient()
    // Read saved GPS at effect time — already hydrated from localStorage
    const savedCoords = useLocationStore.getState().coords

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setForm((prev) => ({
              ...prev,
              name: data.full_name ?? '',
              phone: data.phone ?? '',
            }))
          }
        })
    })

    supabase
      .from('restaurants')
      .select('id, delivery_fee, upi_id, latitude, longitude')
      .single()
      .then(({ data }) => {
        if (!data) return
        setRestaurantId(data.id)
        setUpiId(data.upi_id ?? '')

        if (
          savedCoords &&
          data.latitude != null &&
          data.longitude != null
        ) {
          const straightKm = haversineKm(
            data.latitude,
            data.longitude,
            savedCoords.lat,
            savedCoords.lng
          )
          const roadKm = straightKm * 1.3
          const fee = deliveryFeeFromKm(roadKm)

          if (fee === null) {
            setOutsideZone(true)
            setDeliveryFee(0)
          } else {
            setDeliveryFee(fee)
            setDistanceKm(roadKm)
          }
        } else {
          // No GPS saved or restaurant coords not set — use fixed fee
          setDeliveryFee(data.delivery_fee ?? 66)
        }
      })
  }, [router])

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  function copyUpiId() {
    if (!upiId) return
    navigator.clipboard.writeText(upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-[100dvh] phone-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-5 text-center">
        <div className="w-12 h-12 border-4 border-[#b51c00] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-base font-extrabold text-gray-900">Placing your order...</p>
        <p className="text-xs text-gray-400 mt-1 font-semibold">Please do not close or refresh this page</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[100dvh] phone-screen flex flex-col items-center justify-center bg-[#f8f9fa] px-5">
        <span className="text-5xl mb-4">🛒</span>
        <p className="text-[#586062] mb-6">Your cart is empty</p>
        <Link
          href="/menu"
          className="h-12 px-8 bg-[#b51c00] text-white font-semibold rounded-lg flex items-center"
        >
          Browse Menu
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submittingRef.current || outsideZone) return
    submittingRef.current = true
    setLoading(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Please sign in first')
      router.push('/login')
      submittingRef.current = false
      setLoading(false)
      return
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: user.id,
        restaurant_id: restaurantId,
        status: 'pending',
        payment_status: 'pending_verification',
        utr_number: form.utr.trim(),
        order_type: 'delivery',
        delivery_address: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          landmark: form.landmark,
          pincode: form.pincode,
        },
        delivery_fee: deliveryFee,
        total,
      })
      .select()
      .single()

    if (orderError || !order) {
      toast.error('Failed to place order. Please try again.')
      submittingRef.current = false
      setLoading(false)
      return
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id.slice(0, 36),
      quantity: item.quantity,
      price_at_order: item.product.price,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)

    if (itemsError) {
      toast.error('Failed to save order items.')
      submittingRef.current = false
      setLoading(false)
      return
    }

    clearCart()
    router.push(`/orders/${order.id}`)
  }

  return (
    <div className="min-h-[100dvh] phone-screen flex flex-col bg-[#f8f9fa]">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 px-4 h-14 flex items-center gap-3 border-b border-[#e1e3e4]">
        <button onClick={() => router.back()} className="p-1 -ml-1">
          <ChevronLeft className="size-5 text-[#191c1d]" />
        </button>
        <h1 className="text-base font-bold text-[#b51c00]">Checkout</h1>
      </header>

      <form
        id="checkout-form"
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-36"
      >
        {/* Outside delivery zone error */}
        {outsideZone && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Outside delivery zone</p>
              <p className="text-xs text-red-600 mt-0.5">
                Sorry, we currently deliver within 10 km. Your saved location is beyond our range.{' '}
                <Link href="/location" className="underline font-semibold">
                  Update location
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Delivery Address */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 8px rgba(45,52,54,0.06)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-[#ffdad3] flex items-center justify-center flex-shrink-0">
              <MapPin className="size-3.5 text-[#b51c00]" />
            </div>
            <h2 className="text-sm font-bold text-[#191c1d]">Delivery Address</h2>
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Full Name"
              value={form.name}
              onChange={field('name')}
              required
              className="h-11 rounded-lg bg-[#f3f4f5] border-none text-sm focus-visible:ring-1 focus-visible:ring-[#b51c00]"
            />
            <Input
              placeholder="Phone Number"
              type="tel"
              value={form.phone}
              onChange={field('phone')}
              required
              className="h-11 rounded-lg bg-[#f3f4f5] border-none text-sm focus-visible:ring-1 focus-visible:ring-[#b51c00]"
            />
            <Input
              placeholder="Street address, area"
              value={form.address}
              onChange={field('address')}
              required
              className="h-11 rounded-lg bg-[#f3f4f5] border-none text-sm focus-visible:ring-1 focus-visible:ring-[#b51c00]"
            />
            <Input
              placeholder="Landmark (optional)"
              value={form.landmark}
              onChange={field('landmark')}
              className="h-11 rounded-lg bg-[#f3f4f5] border-none text-sm focus-visible:ring-1 focus-visible:ring-[#b51c00]"
            />
            <Input
              placeholder="Pincode"
              value={form.pincode}
              onChange={field('pincode')}
              required
              inputMode="numeric"
              maxLength={6}
              className="h-11 rounded-lg bg-[#f3f4f5] border-none text-sm focus-visible:ring-1 focus-visible:ring-[#b51c00]"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 8px rgba(45,52,54,0.06)' }}>
          <h2 className="text-sm font-bold text-[#191c1d] mb-3">Order Summary</h2>
          {items.map((item) => (
            <div key={item.product.id} className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#f3f4f5] overflow-hidden flex-shrink-0">
                {item.product.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.product.photo_url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-lg">🍽️</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#191c1d] truncate">{item.product.name}</p>
                <p className="text-xs text-[#586062]">x{item.quantity}</p>
              </div>
              <span className="text-sm font-bold text-[#191c1d]">
                ₹{item.product.price * item.quantity}
              </span>
            </div>
          ))}
          <div className="border-t border-[#e1e3e4] pt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-[#586062]">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-xs text-[#586062]">
              <span>
                Delivery Fee
                {distanceKm != null && (
                  <span className="ml-1 text-[#b51c00] font-semibold">
                    (~{distanceKm.toFixed(1)} km)
                  </span>
                )}
                {distanceKm == null && !outsideZone && (
                  <span className="ml-1 text-[#9ea3a5]">(fixed rate)</span>
                )}
              </span>
              <span className={outsideZone ? 'text-red-500 font-semibold' : ''}>
                {outsideZone ? 'N/A' : `₹${deliveryFee}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#191c1d] pt-1">
              <span>Total</span>
              <span className="text-[#b51c00]">{outsideZone ? '—' : `₹${total}`}</span>
            </div>
          </div>
        </div>

        {/* UPI Payment — hidden when outside zone */}
        {!outsideZone && (
          <div className="bg-white rounded-xl p-4" style={{ boxShadow: '0 2px 8px rgba(45,52,54,0.06)' }}>
            <h2 className="text-sm font-bold text-[#191c1d] mb-3">Pay via UPI</h2>

            {/* UPI ID box */}
            <div className="bg-[#f3f4f5] rounded-xl px-4 py-3 flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-semibold text-[#586062] uppercase tracking-wide mb-0.5">
                  UPI ID
                </p>
                <p className="text-[15px] font-bold text-[#191c1d] font-mono">
                  {upiId || '—'}
                </p>
              </div>
              {upiId && (
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#b51c00] active:opacity-60 transition-opacity"
                >
                  {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>

            <p className="text-xs text-[#586062] mb-3 leading-relaxed">
              Open <strong className="text-[#191c1d]">GPay</strong> or{' '}
              <strong className="text-[#191c1d]">PhonePe</strong> → send{' '}
              <strong className="text-[#191c1d]">₹{total}</strong> to the UPI ID above → open
              transaction history → copy the{' '}
              <strong className="text-[#191c1d]">UTR / Transaction ID</strong>
            </p>

            <Input
              placeholder="Enter UTR / Transaction ID"
              value={form.utr}
              onChange={field('utr')}
              required
              inputMode="numeric"
              className="h-11 rounded-lg bg-[#f3f4f5] border-none text-sm focus-visible:ring-1 focus-visible:ring-[#b51c00] font-mono tracking-wider"
            />
            <p className="text-[10px] text-[#586062] mt-2 leading-snug">
              Your order will be confirmed once we verify the payment — usually within 2 minutes.
            </p>
          </div>
        )}
      </form>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 px-4 pt-3 pb-5 bg-white border-t border-[#e1e3e4]">
        {outsideZone ? (
          <Link
            href="/location"
            className="w-full h-14 bg-[#191c1d] text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            Update Delivery Location
          </Link>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs text-[#586062]">Total Payment</span>
              <span className="text-base font-bold text-[#b51c00]">₹{total}</span>
            </div>
            <button
              type="submit"
              form="checkout-form"
              className="w-full h-14 bg-[#b51c00] text-white font-bold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              I&apos;ve Paid — Place Order
            </button>
          </>
        )}
      </div>
    </div>
  )
}
