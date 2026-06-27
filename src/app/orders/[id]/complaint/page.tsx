'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { type ComplaintCategory } from '@/lib/types'
import { toast } from 'sonner'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'

const CATEGORIES: { value: ComplaintCategory; label: string }[] = [
  { value: 'food_quality', label: 'Food Quality Issue' },
  { value: 'missing_items', label: 'Missing Item(s)' },
  { value: 'wrong_items', label: 'Wrong Item(s) Delivered' },
  { value: 'late_delivery', label: 'Order Delivered Late' },
  { value: 'payment_issue', label: 'Payment / Billing Issue' },
  { value: 'rider_behavior', label: 'Rider Behavior' },
  { value: 'other', label: 'Other' },
]

export default function ComplaintPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [category, setCategory] = useState<ComplaintCategory | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) {
      toast.error('Please select a category')
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error } = await supabase.from('complaints').insert({
      order_id: id,
      customer_id: user.id,
      category,
      description: description.trim(),
    })

    if (error) {
      toast.error('Failed to submit. Please try again.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="min-h-[100dvh] phone-screen flex flex-col items-center justify-center bg-[#f7f8fa] px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <h2 className="text-base font-extrabold text-gray-900 mb-1">Complaint Submitted</h2>
        <p className="text-xs text-gray-400 font-medium mb-6">
          We&apos;ve received your report and will get back to you shortly.
        </p>
        <button
          onClick={() => router.push(`/orders/${id}`)}
          className="h-12 px-8 bg-[#b51c00] text-white font-semibold rounded-xl"
        >
          Back to Order
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] phone-screen flex flex-col bg-[#f7f8fa]">
      <header className="bg-white sticky top-0 z-40 px-4 h-14 flex items-center gap-3 border-b border-gray-100">
        <button onClick={() => router.back()} className="p-1 -ml-1">
          <ChevronLeft className="size-5 text-gray-800" />
        </button>
        <h1 className="text-base font-extrabold text-[#b51c00]">Report an Issue</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <div>
          <p className="text-xs font-bold text-gray-700 mb-3">What went wrong?</p>
          <div className="space-y-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                  category === c.value
                    ? 'border-[#b51c00] bg-[#fff5f3] text-[#b51c00]'
                    : 'border-gray-100 bg-white text-gray-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-gray-700 mb-2">Tell us more (optional)</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe what happened..."
            className="w-full p-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-[#b51c00] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !category}
          className="w-full h-12 bg-[#b51c00] text-white font-bold rounded-xl disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Submit Complaint'}
        </button>
      </form>
    </div>
  )
}
