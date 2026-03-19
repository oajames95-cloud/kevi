'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { KeviLogo } from '@/components/kevi-logo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Gradient fog background - layered glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/30 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[15%] w-[500px] h-[400px] bg-green-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-[25%] right-[-5%] w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[30%] right-[20%] w-[300px] h-[300px] bg-emerald-600/15 rounded-full blur-[80px]" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-8">
          <Link href="/">
            <KeviLogo className="text-2xl" />
          </Link>
        </div>

        <div className="p-8 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/10 shadow-xl shadow-emerald-900/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
            <p className="text-white/60">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email" className="text-white/80">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className="text-white/80">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                />
              </Field>

              {error && (
                <FieldError className="text-red-400">{error}</FieldError>
              )}

              <Button 
                type="submit" 
                className="w-full bg-white hover:bg-white/90 text-black border-0 font-semibold" 
                disabled={isLoading}
              >
                {isLoading ? <Spinner className="mr-2" /> : null}
                Sign in
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-6 text-center text-sm text-white/50">
            {"Don't have an account? "}
            <Link href="/auth/sign-up" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
