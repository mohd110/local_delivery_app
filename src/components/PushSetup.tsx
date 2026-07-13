'use client'

import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { toast } from 'sonner'
import { usePushSubscription, usePushPermissionState, requestPushPermission } from '@/hooks/usePushSubscription'

export default function PushSetup() {
  usePushSubscription()
  const permState = usePushPermissionState()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleEnable() {
    setLoading(true)
    const result = await requestPushPermission()
    setLoading(false)
    if (result.ok) {
      setDismissed(true)
      toast.success('Notifications enabled!')
    } else {
      toast.error(result.error ?? 'Could not enable notifications')
    }
  }

  if (permState !== 'prompt' || dismissed) return null

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      <div className="bg-gray-900 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 max-w-sm w-full pointer-events-auto">
        <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
          <Bell className="size-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold">Enable order notifications</p>
          <p className="text-[10px] text-gray-400 font-medium">Get notified when your order is ready</p>
        </div>
        <button
          onClick={handleEnable}
          disabled={loading}
          className="text-xs font-bold text-orange-400 hover:text-orange-300 flex-shrink-0 disabled:opacity-50"
        >
          {loading ? '…' : 'Allow'}
        </button>
        <button onClick={() => setDismissed(true)} className="flex-shrink-0">
          <X className="size-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}
