'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, OrderStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import OrderStatusBadge from './OrderStatusBadge'
import { toast } from 'sonner'
import { MapPin, Phone, Bike, CheckCircle2, XCircle } from 'lucide-react'

const ORDER_SELECT = `*, order_items(quantity, price_at_order, products(name)),
  customer:profiles!orders_customer_id_fkey(full_name, phone),
  rider:profiles!orders_rider_id_fkey(full_name, phone)`

const statusBg: Record<OrderStatus, string> = {
  pending:          'border-l-gray-300',
  accepted:         'border-l-blue-500',
  preparing:        'border-l-yellow-500',
  ready:            'border-l-green-500',
  out_for_delivery: 'border-l-orange-500',
  delivered:        'border-l-green-600',
  cancelled:        'border-l-red-400',
}

interface Props {
  initialOrders: Order[]
}

export default function DashboardClient({ initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function refetchOrder(id: string, onMissing?: () => void) {
      const { data } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).single()
      if (data) {
        setOrders((prev) =>
          prev.some((o) => o.id === id)
            ? prev.map((o) => (o.id === id ? (data as Order) : o))
            : (onMissing?.(), [data as Order, ...prev])
        )
      }
    }

    const channel = supabase
      .channel('restaurant-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => refetchOrder(payload.new.id as string, () => toast.success('New order received!'))
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => refetchOrder(payload.new.id as string)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function verifyAndAccept(orderId: string) {
    setUpdating(orderId)
    const supabase = createClient()
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'verified', status: 'accepted' })
      .eq('id', orderId)
    if (error) toast.error('Failed to verify payment')
    setUpdating(null)
  }

  async function advanceStatus(orderId: string, next: OrderStatus) {
    setUpdating(orderId)
    const supabase = createClient()
    const { error } = await supabase.from('orders').update({ status: next }).eq('id', orderId)
    if (error) toast.error('Failed to update order status')
    setUpdating(null)
  }

  async function cancelOrder(orderId: string) {
    if (!confirm('Cancel this order? This cannot be undone.')) return
    setUpdating(orderId)
    const supabase = createClient()
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    if (error) toast.error('Failed to cancel order')
    setUpdating(null)
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🍳</span>
        <p className="font-medium text-gray-900 mb-1">No orders yet</p>
        <p className="text-sm text-muted-foreground">Waiting for customers to place orders</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const borderClass = statusBg[order.status] ?? 'border-l-gray-300'
        const isBusy = updating === order.id
        const canCancel = ['pending', 'accepted', 'preparing'].includes(order.status)

        return (
          <div key={order.id} className={`bg-white rounded-2xl shadow-sm border-l-4 ${borderClass} overflow-hidden`}>
            {/* Header */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex justify-between items-start mb-1">
                <p className="font-mono font-semibold text-sm text-gray-900">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <span className="font-bold text-orange-600">₹{order.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString('en-IN')}
                </p>
                <OrderStatusBadge status={order.status} />
              </div>
            </div>

            {/* Items */}
            <div className="px-4 pb-3 space-y-0.5">
              {order.order_items?.map((item, i) => (
                <p key={i} className="text-sm text-gray-700">
                  {item.products?.name}{' '}
                  <span className="text-muted-foreground">× {item.quantity}</span>
                </p>
              ))}
            </div>

            {/* Customer info */}
            {(order.customer?.full_name || order.delivery_address?.address) && (
              <div className="px-4 pb-3 space-y-1">
                {order.customer?.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3" />
                    {order.customer.full_name} · {order.customer.phone}
                  </p>
                )}
                {order.delivery_address?.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3" />
                    {order.delivery_address.address}, {order.delivery_address.pincode}
                  </p>
                )}
              </div>
            )}

            {/* Payment pending — show UTR for manual verification */}
            {order.status === 'pending' && order.payment_status === 'pending_verification' && (
              <div className="px-4 pb-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <p className="text-[11px] font-bold text-amber-700">UTR / Transaction ID</p>
                  <p className="text-sm font-mono font-semibold text-amber-800">
                    {order.utr_number || '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Rider info once assigned */}
            {order.rider?.full_name && (
              <div className="px-4 pb-3">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Bike className="size-3" />
                  Rider: {order.rider.full_name} · {order.rider.phone}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="px-4 pb-4 space-y-2">
              {order.status === 'pending' && (
                <Button
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 rounded-xl font-semibold"
                  onClick={() => verifyAndAccept(order.id)}
                  disabled={isBusy}
                >
                  {isBusy ? 'Verifying…' : 'Verify Payment & Accept'}
                </Button>
              )}
              {order.status === 'accepted' && (
                <Button
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 rounded-xl font-semibold"
                  onClick={() => advanceStatus(order.id, 'preparing')}
                  disabled={isBusy}
                >
                  {isBusy ? 'Updating…' : 'Start Preparing'}
                </Button>
              )}
              {order.status === 'preparing' && (
                <Button
                  className="w-full h-11 bg-orange-600 hover:bg-orange-700 rounded-xl font-semibold"
                  onClick={() => advanceStatus(order.id, 'ready')}
                  disabled={isBusy}
                >
                  {isBusy ? 'Updating…' : 'Mark Ready'}
                </Button>
              )}
              {order.status === 'ready' && (
                <div className="h-11 flex items-center justify-center bg-green-50 rounded-xl gap-1.5">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">
                    {order.rider_id
                      ? 'Rider is on the way to pick up'
                      : 'Ready — waiting for a rider to accept'}
                  </span>
                </div>
              )}
              {order.status === 'out_for_delivery' && (
                <div className="h-11 flex items-center justify-center bg-orange-50 rounded-xl gap-1.5">
                  <Bike className="size-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-600">Out for delivery</span>
                </div>
              )}
              {order.status === 'delivered' && (
                <div className="h-11 flex items-center justify-center bg-green-50 rounded-xl gap-1.5">
                  <CheckCircle2 className="size-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">Delivered</span>
                </div>
              )}
              {order.status === 'cancelled' && (
                <div className="h-11 flex items-center justify-center bg-red-50 rounded-xl gap-1.5">
                  <XCircle className="size-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-500">Cancelled</span>
                </div>
              )}

              {canCancel && (
                <button
                  onClick={() => cancelOrder(order.id)}
                  disabled={isBusy}
                  className="w-full h-9 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
