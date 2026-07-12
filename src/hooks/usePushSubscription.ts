'use client'

import { useEffect, useState } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout: ${label} (${ms}ms)`)), ms)
    ),
  ])
}

export async function subscribeAfterPermission(): Promise<string> {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers not supported')
  if (!('PushManager' in window)) throw new Error('Push not supported')

  await withTimeout(navigator.serviceWorker.register('/sw.js'), 5000, 'SW register')
  const reg = await withTimeout(navigator.serviceWorker.ready, 8000, 'SW ready')

  let subscription = await reg.pushManager.getSubscription()
  if (!subscription) {
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!key) throw new Error('VAPID key missing')
    subscription = await withTimeout(
      reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) }),
      8000,
      'pushManager.subscribe'
    )
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`DB save failed (${res.status}): ${body}`)
  }
  return 'ok'
}

export function usePushPermissionState(): 'prompt' | 'granted' | 'unsupported' {
  const [state, setState] = useState<'prompt' | 'granted' | 'unsupported'>('unsupported')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported')
      return
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {})

    const fallback = setTimeout(() => setState('prompt'), 4000)

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => { clearTimeout(fallback); setState(sub ? 'granted' : 'prompt') })
      .catch(() => { clearTimeout(fallback); setState('prompt') })

    return () => clearTimeout(fallback)
  }, [])

  return state
}

export async function requestPushPermission(): Promise<{ ok: boolean; error?: string }> {
  try {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return { ok: false, error: 'Permission denied' }
    }
    await subscribeAfterPermission()
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[Push] subscribe failed:', msg)
    return { ok: false, error: msg }
  }
}

export function usePushSubscription() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])
}
