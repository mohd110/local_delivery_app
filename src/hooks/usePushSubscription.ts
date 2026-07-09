'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

async function subscribeAfterPermission() {
  navigator.serviceWorker.register('/sw.js')
  const reg = await navigator.serviceWorker.ready
  const existing = await reg.pushManager.getSubscription()
  if (existing) return

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
}

// Returns: 'prompt' = show banner, 'granted' = already subscribed, 'unsupported' = hide
export function usePushPermissionState(): 'prompt' | 'granted' | 'unsupported' {
  const [state, setState] = useState<'prompt' | 'granted' | 'unsupported'>('unsupported')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    // Register SW first so ready resolves
    navigator.serviceWorker.register('/sw.js').catch(() => {})

    // Fallback: show banner after 4s if ready never resolves
    const fallback = setTimeout(() => setState('prompt'), 4000)

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => { clearTimeout(fallback); setState(sub ? 'granted' : 'prompt') })
      .catch(() => { clearTimeout(fallback); setState('prompt') })

    return () => clearTimeout(fallback)
  }, [])

  return state
}

export async function requestPushPermission(): Promise<boolean> {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
  }
  await subscribeAfterPermission().catch(console.error)
  return true
}

export function usePushSubscription() {
  useEffect(() => {
    // Just register SW silently — permission is requested via banner click
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])
}
