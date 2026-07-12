'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  // Safari on iOS — exclude Chrome/CriOS/FxiOS which can't install PWAs
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua)
  return isIOS && isSafari
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

export default function IOSInstallPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isIosSafari()) return
    if (isInStandaloneMode()) return
    if (localStorage.getItem('ios-install-dismissed')) return
    // Small delay so it doesn't fight with the push banner
    const t = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    localStorage.setItem('ios-install-dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1B4332] px-5 pt-5 pb-4 relative">
          <button onClick={dismiss} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <X className="size-4 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Wali Baba Foods" className="w-14 h-14 object-contain mb-3" />
          <h2 className="text-white font-extrabold text-base leading-tight">Add to Home Screen</h2>
          <p className="text-white/70 text-xs mt-1">Get the full app experience — faster, offline-ready, and full screen.</p>
        </div>

        {/* Steps */}
        <div className="px-5 py-4 space-y-4">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
              <span className="text-lg">1</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800">Tap the Share button</p>
              <p className="text-[10px] text-gray-400 mt-0.5">The <span className="font-bold">⎙</span> icon at the bottom of Safari</p>
            </div>
            {/* Share icon replica */}
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-500 fill-none stroke-current stroke-2">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
              <span className="text-lg">2</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800">Tap "Add to Home Screen"</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Scroll down in the share sheet to find it</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">➕</span>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0">
              <span className="text-lg">3</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800">Tap "Add" to confirm</p>
              <p className="text-[10px] text-gray-400 mt-0.5">The app icon will appear on your home screen</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✅</span>
            </div>
          </div>
        </div>

        {/* Arrow pointing down to Safari toolbar */}
        <div className="px-5 pb-5">
          <button
            onClick={dismiss}
            className="w-full h-11 bg-[#1B4332] text-white font-bold rounded-2xl text-sm"
          >
            Got it!
          </button>
        </div>

        {/* Arrow indicator pointing to bottom share button */}
        <div className="flex justify-center pb-2">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-1 h-4 bg-[#1B4332] rounded-full opacity-40" />
            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#1B4332] opacity-40" />
          </div>
        </div>
      </div>
    </div>
  )
}
