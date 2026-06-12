'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Navigation, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

export default function LocationPage() {
  const [locating, setLocating] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  function handleAllowLocation() {
    setLocating(true)
    setError('')
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.')
      setLocating(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        // Location granted — proceed to menu
        router.push('/menu')
      },
      () => {
        setError('Location access denied. Please enter your address manually.')
        setLocating(false)
      }
    )
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (address.trim().length < 5) {
      setError('Please enter a valid address.')
      return
    }
    router.push('/menu')
  }

  return (
    <div className="min-h-[100dvh] phone-screen flex flex-col bg-[#f9f6f4] relative">

      {/* ── Floating Back Button ── */}
      <div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white text-[#c0392b] flex items-center justify-center shadow-md border border-gray-100/80 hover:bg-gray-50 active:scale-[0.95] transition-all cursor-pointer"
          aria-label="Go back"
        >
          <ChevronLeft className="size-6 text-[#c0392b]" />
        </button>
      </div>

      {/* ── Hero Image ── */}
      <div className="relative w-full aspect-square max-h-[52vw] sm:max-h-[260px] overflow-hidden rounded-b-3xl bg-[#1a1a1a]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/location-hero.png"
          alt="Find your location"
          className="w-full h-full object-cover"
        />
        {/* Subtle vignette at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f9f6f4] to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-10">

        {/* Heading */}
        <div className="text-center mb-3">
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
            Find the Nearest{' '}
            <span className="text-[#c0392b]">Wali Baba<br />Foods</span>
          </h1>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed px-4">
            To show nearest outlets and accurate delivery fees, we need to know where to find you.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-2 mb-1 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl px-4 py-3 text-center">
            {error}
          </div>
        )}

        <div className="flex-1" />

        {/* ── Actions ── */}
        <div className="space-y-3">

          {/* Allow Location CTA */}
          <button
            onClick={handleAllowLocation}
            disabled={locating}
            className="w-full h-14 bg-[#c0392b] hover:bg-[#a93226] text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-[#c0392b]/25 cursor-pointer"
          >
            {locating ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                <span>Locating you…</span>
              </>
            ) : (
              <>
                <Navigation className="size-5 fill-white" />
                <span>Allow Location</span>
              </>
            )}
          </button>

          {/* Manual address toggle */}
          {!showManual ? (
            <button
              onClick={() => setShowManual(true)}
              className="w-full h-12 text-[#c0392b] font-bold text-sm flex items-center justify-center gap-1.5 rounded-2xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              Enter Address Manually
              <ChevronRight className="size-4" />
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="relative flex items-center">
                <MapPin className="absolute left-4 size-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Talaq Mahal, Kanpur 208001"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  autoFocus
                  className="w-full h-13 pl-11 pr-4 bg-white border border-gray-200 focus:border-[#c0392b] rounded-xl text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
              >
                Confirm Address
                <ChevronRight className="size-4" />
              </button>
            </form>
          )}

          {/* Privacy note */}
          <p className="text-center text-[11px] text-gray-400 leading-relaxed px-6 pt-1">
            Your location is used only for delivery accuracy and is never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  )
}
