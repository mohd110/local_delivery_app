'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { type Complaint, type ComplaintCategory } from '@/lib/types'
import BottomNav from '@/components/BottomNav'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  food_quality: 'Food Quality Issue',
  missing_items: 'Missing Item(s)',
  wrong_items: 'Wrong Item(s) Delivered',
  late_delivery: 'Order Delivered Late',
  payment_issue: 'Payment / Billing Issue',
  rider_behavior: 'Rider Behavior',
  cancel_order: 'Cancel My Order',
  other: 'Other',
}

interface ComplaintWithOrder extends Complaint {
  orders: { order_number: string | null } | null
}

export default function ComplaintsPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<ComplaintWithOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('complaints')
        .select('*, orders(order_number)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })

      if (error) console.error('fetchComplaints failed:', error)
      setComplaints((data as ComplaintWithOrder[]) ?? [])
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-[100dvh] phone-screen flex items-center justify-center bg-[#f7f8fa]">
        <div className="w-10 h-10 border-4 border-[#b51c00] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] phone-screen flex flex-col bg-[#f7f8fa]">
      <header className="bg-white sticky top-0 z-40 px-4 h-14 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-1 -ml-1">
          <ChevronLeft className="size-5 text-gray-800" />
        </button>
        <h1 className="text-base font-extrabold text-[#b51c00]">My Complaints</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {complaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📋</span>
            <p className="font-bold text-[#191c1d] mb-1">No complaints filed</p>
            <p className="text-sm text-[#586062]">Issues you report on an order will show up here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Link
                key={c.id}
                href={`/orders/${c.order_id}`}
                className="block bg-white rounded-xl p-4 active:scale-[0.99] transition-transform"
                style={{ boxShadow: '0 2px 8px rgba(45,52,54,0.06)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{CATEGORY_LABELS[c.category]}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {c.orders?.order_number ?? `Order #${c.order_id.slice(0, 8).toUpperCase()}`}
                    </p>
                    {c.description && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{c.description}</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1.5">
                      {new Date(c.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : c.status === 'in_progress'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.status === 'in_progress' ? 'In Progress' : c.status === 'resolved' ? 'Resolved' : 'Open'}
                    </span>
                    <ChevronRight className="size-4 text-gray-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
