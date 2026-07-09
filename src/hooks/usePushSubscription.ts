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

// Returns: 'prompt' = show banner, 'granted' = already enabled, 'denied'/'unsupported' = hide
export function usePushPermissionState(): 'prompt' | 'granted' | 'denied' | 'unsupported' {
  const [state, setState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('unsupported')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported')
      return
    }
    setState(Notification.permission === 'default' ? 'prompt' : Notification.permission as 'granted' | 'denied')
  }, [])

  return state
}

export async function requestPushPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false
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
