import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Service role client bypasses RLS so we can read any customer's subscription
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { customerId, title, body, url, tag } = await req.json()
  if (!customerId || !title || !body) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('customer_id', customerId)
    .single()

  if (error || !data) return NextResponse.json({ ok: false, reason: 'no subscription', error: error?.message })

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
