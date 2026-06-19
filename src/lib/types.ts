export type UserRole = 'customer' | 'restaurant' | 'rider'
export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending_verification' | 'verified' | 'failed'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  phone: string | null
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  photo_url: string | null
  is_available: boolean
}

export interface DeliveryAddress {
  name: string
  phone: string
  address: string
  landmark?: string
  pincode: string
}

export interface Address {
  id: string
  customer_id: string
  label: string
  address: string
  landmark: string | null
  pincode: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price_at_order: number
  products?: Pick<Product, 'name' | 'price'>
}

export interface Order {
  id: string
  customer_id: string
  restaurant_id: string | null
  rider_id: string | null
  status: OrderStatus
  payment_status: PaymentStatus
  utr_number: string | null
  order_type: 'delivery' | 'pickup'
  delivery_address: DeliveryAddress
  delivery_fee: number
  total: number
  created_at: string
  customer?: Pick<Profile, 'full_name' | 'phone'>
  rider?: Pick<Profile, 'full_name' | 'phone'>
  order_items?: OrderItem[]
}
