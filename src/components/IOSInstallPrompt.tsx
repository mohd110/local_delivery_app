'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIOS = /iphone|ipad|ipod/i.test(ua)
  const isSafari = /safari/i.test(ua) && !/crios|fxios|opios|edgios/i.test(ua)
  return isIOS && isSafari
}

function isInstalled() {
  if (typeof window === 'undefined') return true
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

const STORAGE_KEY = 'ios-install-shown-count'

function getShownCount() {
  try { return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10) } catch { return 0 }
}
function incrementShownCount() {
  try { localStorage.setItem(STORAGE_KEY, String(getShownCount() + 1)) } catch {}
}

interface Props {
  /** 'menu' = first reminder (after menu loads), 'order' = second reminder (on order tracking) */
  variant: 'menu' | 'order'
  /** delay in ms before showing */
  delay?: number
}

export default function IOSInstallPrompt({ variant, delay = 3000 }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isIosSafari()) return
    if (isInstalled()) return

    const count = getShownCount()
    // menu variant shows on first visit (count === 0)
    // order variant shows on second chance (count === 1)
    if (variant === 'menu' && count !== 0) return
    if (variant === 'order' && count !== 1) return

    const t = setTimeout(() => {
      setShow(true)
      incrementShownCount()
    }, delay)
    return () => clearTimeout(t)
  }, [variant, delay])

  if (!show) return null

  const isOrder = variant === 'order'

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center px-4 pb-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1B4332] px-5 pt-5 pb-4 relative">
          <button
            onClick={() => setShow(false)}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="size-4 text-white" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Wali Baba Foods" className="w-14 h-14 object-contain mb-3" />
          <h2 className="text-white font-extrabold text-base leading-tight">
            {isOrder ? 'Never miss an update!' : 'Add to Home Screen'}
          </h2>
          <p className="text-white/70 text-xs mt-1">
            {isOrder
              ? 'Add Wali Baba to your home screen to get live order notifications even when the app is closed.'
              : 'Get the full app experience — faster, full screen, and ready to notify you.'}
          </p>
        </div>

        {/* Steps */}
        <div className="px-5 py-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-base font-bold text-[#1B4332]">1</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800">Tap the Share button</p>
              <p className="text-[10px] text-gray-400 mt-0.5">The <span className="font-bold">⎙</span> icon at the bottom of Safari</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-500 fill-none stroke-current stroke-2">
                <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-base font-bold text-[#1B4332]">2</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800">Tap "Add to Home Screen"</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Scroll down in the share sheet to find it</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">➕</div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#E8F5E9] flex items-center justify-center flex-shrink-0 text-base font-bold text-[#1B4332]">3</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-800">Tap "Add" to confirm</p>
              <p className="text-[10px] text-gray-400 mt-0.5">The app icon appears on your home screen</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">✅</div>
          </div>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-2">
          <button
            onClick={() => setShow(false)}
            className="w-full h-11 bg-[#1B4332] text-white font-bold rounded-2xl text-sm"
          >
            Got it!
          </button>
          {isOrder && (
            <button
              onClick={() => {
                // mark as fully dismissed so it never shows again
                try { localStorage.setItem(STORAGE_KEY, '2') } catch {}
                setShow(false)
              }}
              className="w-full h-9 text-gray-400 font-medium text-xs"
            >
              Don't show again
            </button>
          )}
        </div>

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
