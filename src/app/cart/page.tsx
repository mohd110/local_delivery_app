'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cart'
import { Minus, Plus, Trash2, MapPin, ArrowRight, ChevronLeft, Search, Tag, BadgeCheck } from 'lucide-react'
import Link from 'next/link'

export default function CartPage() {
  const router = useRouter()
  const { items, updateQuantity, removeItem } = useCartStore()
  const [address, setAddress] = useState('452 Sapphire Street, Downtown District, NY 10001')
  const [couponApplied, setCouponApplied] = useState(false)

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  const deliveryFee = items.length > 0 ? 30 : 0
  const taxes = Math.round(subtotal * 0.05)
  const discount = couponApplied ? 50 : 0
  const total = Math.max(0, subtotal + deliveryFee + taxes - discount)

  return (
    <div className="min-h-[100dvh] phone-screen flex flex-col bg-[#f7f8fa] text-gray-900 pb-safe">
      {/* Header */}
      <header className="bg-white sticky top-0 z-40 px-4 h-14 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 cursor-pointer">
            <ChevronLeft className="size-6 text-[#c0392b]" />
          </button>
          <h1 className="text-base font-extrabold text-[#c0392b]">Your Cart</h1>
        </div>
        <button className="p-1 cursor-pointer">
          <Search className="size-5 text-gray-700" />
        </button>
      </header>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-5 text-center">
          <span className="text-6xl mb-4">🛒</span>
          <p className="font-bold text-gray-900 mb-1">Your cart is empty</p>
          <p className="text-sm text-gray-500 mb-6">Add some delicious items to get started</p>
          <Link
            href="/menu"
            className="h-12 px-8 bg-[#c0392b] text-white font-semibold rounded-2xl flex items-center gap-2 hover:bg-[#a93226] transition-all"
          >
            Browse Menu <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Delivery address */}
            <div className="bg-white rounded-3xl p-4 flex items-center gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50/50">
              <div className="w-10 h-10 rounded-2xl bg-[#ffdad3] flex items-center justify-center flex-shrink-0">
                <MapPin className="size-5 text-[#c0392b]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-extrabold tracking-wider uppercase">Delivery to Home</p>
                <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{address}</p>
              </div>
              <button 
                onClick={() => {
                  const newAddress = prompt('Enter delivery address:', address)
                  if (newAddress) setAddress(newAddress)
                }}
                className="text-xs font-bold text-[#c0392b] hover:underline cursor-pointer flex-shrink-0"
              >
                Change
              </button>
            </div>

            {/* Promo Coupon Box */}
            <div className="bg-[#fff0de] border border-[#ffdcb4] rounded-3xl p-4 flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-[#ffd4a8] flex items-center justify-center text-[#9c5a1f] flex-shrink-0">
                  <Tag className="size-4.5" />
                </div>
                <span className="text-xs font-bold text-[#663c14] truncate">
                  {couponApplied ? 'Save ₹50 Coupon Applied' : 'Save ₹50 with this coupon'}
                </span>
              </div>
              <button
                onClick={() => setCouponApplied(!couponApplied)}
                className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  couponApplied
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-[#4a3b1e] hover:bg-[#382b14] text-white shadow-sm'
                }`}
              >
                {couponApplied ? 'Applied' : 'Apply'}
              </button>
            </div>

            {/* Review Items */}
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 mb-3 px-1">Review Items</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-white rounded-3xl p-4 flex gap-3 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50/50">
                    {/* Image */}
                    <div className="w-18 h-18 rounded-2xl bg-[#f3f4f5] overflow-hidden flex-shrink-0">
                      {item.product.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.photo_url} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-2xl">🍽️</div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-grow min-w-0 flex flex-col justify-between">
                      {/* Name and Price */}
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-sm font-bold text-gray-900 truncate leading-snug">{item.product.name}</p>
                        <span className="text-sm font-extrabold text-[#c0392b] flex-shrink-0">₹{item.product.price * item.quantity}</span>
                      </div>
                      
                      {/* Description */}
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 leading-normal">
                        {item.product.description || 'Authentic taste prepared fresh with finest ingredients.'}
                      </p>

                      {/* Controls */}
                      <div className="flex justify-between items-center mt-2.5">
                        <div className="flex items-center bg-[#f3f4f6] rounded-full px-2.5 py-1 gap-3">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="text-gray-500 hover:text-gray-700 p-0.5 cursor-pointer"
                          >
                            <Minus className="size-3.5" strokeWidth={3} />
                          </button>
                          <span className="text-xs font-extrabold text-gray-900 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="text-gray-500 hover:text-gray-700 p-0.5 cursor-pointer"
                          >
                            <Plus className="size-3.5" strokeWidth={3} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-gray-400 hover:text-[#c0392b] p-1.5 cursor-pointer"
                        >
                          <Trash2 className="size-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill summary */}
            <div className="bg-white rounded-3xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-gray-50/50">
              <h2 className="text-[10px] font-extrabold tracking-wider text-gray-400 mb-3.5 uppercase">BILL SUMMARY</h2>
              <div className="space-y-2.5">
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-800">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Delivery Fee</span>
                  <span className="text-gray-800">₹{deliveryFee}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-500">
                  <span>Taxes &amp; Charges</span>
                  <span className="text-gray-800">₹{taxes}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-xs font-semibold text-green-600">
                    <span>Coupon Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="h-px bg-gray-100 my-2" />
                <div className="flex justify-between font-bold text-sm text-gray-900">
                  <span>Total Amount</span>
                  <span className="text-[#c0392b] text-base">₹{total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout CTA Bottom Drawer */}
          <div className="bg-white border-t border-gray-100 px-5 pt-3.5 pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-center gap-1.5 mb-3.5 text-xs text-gray-500">
              <BadgeCheck className="size-4 text-[#8a7238]" />
              <span>Your order supports local farmers in the district</span>
            </div>
            <Link
              href="/checkout"
              className="w-full h-13 bg-[#c0392b] hover:bg-[#a93226] text-white font-extrabold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#c0392b]/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}