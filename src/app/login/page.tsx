'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSplash, setShowSplash] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()

  async function handleLogin(e?: React.SyntheticEvent) {
    e?.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles').select('role, full_name').eq('id', user.id).single()

    const name = profile?.full_name || user.user_metadata?.full_name || 'Foodie'
    setUserName(name)

    // Show splash screen transition
    setShowSplash(true)
    setLoading(false)

    setTimeout(() => {
      router.push(profile?.role === 'restaurant' ? '/restaurant/dashboard' : '/menu')
      router.refresh()
    }, 2000)
  }

  if (showSplash) {
    return (
      <div 
        className="min-h-[100dvh] phone-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(170deg, #ffffff 0%, #fff8f7 40%, #fff3f0 100%)' }}
      >
        {/* Floating food icons for premium touch */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
          <span className="absolute top-1/4 left-1/4 text-4xl opacity-15 animate-bounce" style={{ animationDelay: '0.2s' }}>🍛</span>
          <span className="absolute top-1/3 right-1/4 text-4xl opacity-15 animate-bounce" style={{ animationDelay: '0.5s' }}>🍗</span>
          <span className="absolute bottom-1/3 left-1/3 text-4xl opacity-15 animate-bounce" style={{ animationDelay: '0.8s' }}>🫓</span>
          <span className="absolute bottom-1/4 right-1/3 text-4xl opacity-15 animate-bounce" style={{ animationDelay: '1.1s' }}>🍧</span>
        </div>

        {/* Center Logo Container */}
        <div className="flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in-95 duration-500">
          <div 
            className="w-36 h-36 rounded-full bg-white flex items-center justify-center mb-6 shadow-xl shadow-red-100/50 border border-red-50/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Wali Baba Foods"
              className="w-24 h-24 object-contain animate-pulse"
            />
          </div>

          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Wali Baba Foods</h2>
          <p className="text-xs text-gray-400 mt-1 font-semibold italic text-center">
            The Royal Taste of Tradition
          </p>

          {/* Personalized Greeting */}
          <div className="mt-8 bg-red-50/80 px-4 py-2 rounded-2xl border border-red-100/30 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#c0392b] animate-ping" />
            <span className="text-[11px] font-extrabold text-[#c0392b]">
              Welcome back, {userName}!
            </span>
          </div>

          <p className="text-[10px] text-gray-400 mt-3 font-semibold">
            Preparing your royal kitchen dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-[100dvh] phone-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #fff5f5 0%, #fff9f0 50%, #ffffff 100%)' }}
    >
      {/* ── Brand Header ── */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6">
        {/* Logo */}
        <div className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Wali Baba Foods"
            className="w-28 h-28 object-contain drop-shadow-lg"
          />
        </div>

        <h1 className="text-2xl font-extrabold text-[#1a3d1a] tracking-tight">Wali Baba Foods</h1>
        <p className="text-sm text-gray-400 mt-1 text-center">Authentic flavors, delivered to your doorstep.</p>
      </div>

      {/* ── Form Card ── */}
      <div className="mx-5 flex-1">
        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] border border-gray-100 px-6 py-7">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Welcome Back</h2>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email Address</label>
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 h-12 focus-within:border-[#c0392b] transition-colors bg-white">
                <Mail className="size-4 text-gray-300 flex-shrink-0" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-300 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-500">Password</label>
                <button type="button" className="text-xs font-semibold text-[#c0392b] hover:underline">
                  Forgot Password?
                </button>
              </div>
              <div className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 h-12 focus-within:border-[#c0392b] transition-colors bg-white">
                <Lock className="size-4 text-gray-300 flex-shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-300 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-300 hover:text-gray-500 transition-colors ml-1"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Inline error */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Login CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#c0392b] hover:bg-[#a93226] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 mt-1 active:scale-[0.98] transition-all disabled:opacity-60 shadow-md shadow-[#c0392b]/25 cursor-pointer"
            >
              <span>{loading ? 'Signing in…' : 'Login'}</span>
              {!loading && <ArrowRight className="size-4" />}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] font-semibold text-gray-300 tracking-widest">OR LOGIN WITH</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="h-11 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors cursor-pointer"
            >
              <svg className="size-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              className="h-11 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-semibold text-gray-700 transition-colors cursor-pointer"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Apple
            </button>
          </div>
        </div>

        {/* Footer links */}
        <p className="mt-6 text-center text-sm text-gray-400">
          New to Wali Baba Foods?{' '}
          <Link href="/signup" className="text-[#c0392b] font-semibold hover:underline">
            Create an Account
          </Link>
        </p>

        <p className="mt-10 text-center text-[10px] text-gray-300 font-semibold tracking-widest uppercase">
          Wali Baba Foods © 2024 &bull; Premium Mughlai Cuisine
        </p>
      </div>

      {/* Restaurant owner link */}
      <div className="pb-8 text-center">
        <Link href="/restaurant/login" className="text-xs text-gray-400 hover:text-[#c0392b]">
          Restaurant owner? <span className="font-semibold text-[#c0392b]">Restaurant Login</span>
        </Link>
      </div>
    </div>
  )
}