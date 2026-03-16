'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { KeviLogo } from '@/components/kevi-logo'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    const redirectUrl = `${siteUrl}/auth/callback`
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          company_name: companyName,
        },
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    router.push('/auth/sign-up-success')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Gradient fog background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-600/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[300px] bg-green-700/15 rounded-full blur-[80px]" />
        <div className="absolute top-[30%] right-[-5%] w-[300px] h-[300px] bg-teal-600/15 rounded-full blur-[80px]" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-8">
          <Link href="/">
            <KeviLogo className="text-2xl" />
          </Link>
        </div>

        <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Create an account</h1>
            <p className="text-white/60">Start tracking your sales team performance</p>
          </div>

          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name" className="text-white/80">Your name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="company" className="text-white/80">Company name</FieldLabel>
                <Input
                  id="company"
                  type="text"
                  placeholder="Acme Inc"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                />
                <FieldDescription className="text-white/40">
                  Your team members will join this company
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="email" className="text-white/80">Work email</FieldLabel>
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
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                />
                <FieldDescription className="text-white/40">
                  At least 8 characters
                </FieldDescription>
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
                Create account
              </Button>
            </FieldGroup>
          </form>

          <div className="mt-6 text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
