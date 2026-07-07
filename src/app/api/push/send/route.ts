import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(req: NextRequest) {
  const { customerId, title, body, url, tag } = await req.json()
  if (!customerId || !title || !body) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('customer_id', customerId)
    .single()

  if (error || !data) return NextResponse.json({ ok: false, reason: 'no subscription' })

  try {
    await webpush.sendNotification(
      data.subscription as webpush.PushSubscription,
      JSON.stringify({ title, body, url: url ?? '/', tag: tag ?? 'order-update' })
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false, reason: 'send failed' })
  }
}
