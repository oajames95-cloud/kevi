'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { UserPlus, AlertCircle, Check, ArrowRight } from 'lucide-react'

interface InviteInfo {
  company_name: string
  role: string
  email: string | null
}

type Step = 'loading' | 'invalid' | 'auth' | 'profile' | 'complete'

export default function InviteAcceptPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [step, setStep] = useState<Step>('loading')
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Auth fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(true)

  // Profile fields
  const [name, setName] = useState('')

  // Result
  const [extensionToken, setExtensionToken] = useState('')

  useEffect(() => {
    validateInvite()
  }, [token])

  const validateInvite = async () => {
    try {
      const response = await fetch(`/api/invites/validate?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        setStep('invalid')
        setError(data.error || 'Invalid or expired invite')
        return
      }

      setInviteInfo(data)
      if (data.email) {
        setEmail(data.email)
      }

      // Check if user is already logged in
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if they already have a company
        const { data: existingRep } = await supabase
          .from('reps')
          .select('id')
          .eq('supabase_user_id', user.id)
          .single()

        if (existingRep) {
          setError('You already belong to a company')
          setStep('invalid')
          return
        }

        setEmail(user.email || '')
        setStep('profile')
      } else {
        setStep('auth')
      }
    } catch (err) {
      setStep('invalid')
      setError('Failed to validate invite')
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      if (isSignUp) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${siteUrl}/invite/${token}`,
          },
        })

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        // For sign up, they need to verify email first
        setError('Check your email to verify your account, then return to this page.')
        setLoading(false)
        return
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        setStep('profile')
      }
    } catch (err) {
      setError('Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Your name is required')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          name: name.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to accept invite')
        setLoading(false)
        return
      }

      setExtensionToken(result.extension_token)
      setStep('complete')
    } catch (err) {
      setError('Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(extensionToken)
  }

  if (step === 'loading') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center">
        <Spinner className="h-8 w-8" />
      </main>
    )
  }

  if (step === 'invalid') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-serif">Invalid Invite</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 'auth' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-serif">
                Join {inviteInfo?.company_name}
              </CardTitle>
              <CardDescription>
                You've been invited as a {inviteInfo?.role}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAuth}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={!!inviteInfo?.email}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isSignUp ? 'Create a password' : 'Enter password'}
                    />
                  </Field>
                </FieldGroup>

                {error && (
                  <p className="text-sm text-destructive mt-4">{error}</p>
                )}

                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? <Spinner className="mr-2" /> : null}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'profile' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-serif">Complete Your Profile</CardTitle>
              <CardDescription>
                Joining {inviteInfo?.company_name} as a {inviteInfo?.role}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Your Name</FieldLabel>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      autoFocus
                    />
                  </Field>
                </FieldGroup>

                {error && (
                  <p className="text-sm text-destructive mt-4">{error}</p>
                )}

                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? <Spinner className="mr-2" /> : null}
                  Join Team
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && (
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-serif">Welcome to {inviteInfo?.company_name}!</CardTitle>
              <CardDescription>
                Your account is ready. Here's your extension token.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-2">Extension Token</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono break-all">{extensionToken}</code>
                  <Button size="sm" variant="outline" onClick={copyToken}>
                    Copy
                  </Button>
                </div>
              </div>

              <Button className="w-full" onClick={() => router.push('/dashboard')}>
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
