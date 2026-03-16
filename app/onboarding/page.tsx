'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Building2, User, ArrowRight, Check } from 'lucide-react'
import { MarketingNav } from '@/components/marketing-nav'

type Step = 'company' | 'profile' | 'complete'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('company')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [companySlug, setCompanySlug] = useState('')
  const [name, setName] = useState('')
  const [extensionToken, setExtensionToken] = useState('')

  const handleCancel = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      setError('Company name is required')
      return
    }
    const slug = companySlug.trim() || companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setCompanySlug(slug)
    setError('')
    setStep('profile')
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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in')
        setLoading(false)
        return
      }

      const response = await fetch('/api/onboarding/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: companyName.trim(),
          company_slug: companySlug,
          admin_name: name.trim(),
          admin_email: user.email,
          supabase_user_id: user.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to complete setup')
        setLoading(false)
        return
      }

      setExtensionToken(result.extension_token)
      setStep('complete')
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(extensionToken)
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gradient fog background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-600/25 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[300px] bg-green-700/15 rounded-full blur-[80px]" />
        <div className="absolute top-[40%] right-[-5%] w-[300px] h-[300px] bg-teal-600/15 rounded-full blur-[80px]" />
      </div>
      <MarketingNav cancelLabel="Cancel setup" onCancel={handleCancel} />
      <main className="flex items-center justify-center p-4 pt-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-3 h-3 rounded-full transition-colors ${step === 'company' ? 'bg-emerald-500' : 'bg-white/20'}`} />
            <div className={`w-8 h-0.5 transition-colors ${step !== 'company' ? 'bg-emerald-500' : 'bg-white/20'}`} />
            <div className={`w-3 h-3 rounded-full transition-colors ${step === 'profile' || step === 'complete' ? 'bg-emerald-500' : 'bg-white/20'}`} />
            <div className={`w-8 h-0.5 transition-colors ${step === 'complete' ? 'bg-emerald-500' : 'bg-white/20'}`} />
            <div className={`w-3 h-3 rounded-full transition-colors ${step === 'complete' ? 'bg-emerald-500' : 'bg-white/20'}`} />
          </div>

          {step === 'company' && (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">Create Your Company</h1>
                <p className="text-white/60">Set up your organisation to start tracking sales productivity</p>
              </div>
              <form onSubmit={handleCompanySubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="company-name" className="text-white/80">Company Name</FieldLabel>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      autoFocus
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="company-slug" className="text-white/80">Company Slug (optional)</FieldLabel>
                    <Input
                      id="company-slug"
                      value={companySlug}
                      onChange={(e) => setCompanySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="acme-corp"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                    <p className="text-xs text-white/40 mt-1">Used in invite links. Auto-generated if left blank.</p>
                  </Field>
                </FieldGroup>

                {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

                <Button type="submit" className="w-full mt-6 bg-white hover:bg-white/90 text-black border-0 font-semibold">
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          {step === 'profile' && (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <User className="h-6 w-6 text-green-400" />
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">Your Profile</h1>
                <p className="text-white/60">Tell us a bit about yourself</p>
              </div>
              <form onSubmit={handleProfileSubmit}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name" className="text-white/80">Your Name</FieldLabel>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Smith"
                      autoFocus
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                    />
                  </Field>
                </FieldGroup>

                {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

                <div className="flex gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setStep('company')} className="flex-1 border-white/20 text-white hover:bg-white/10">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 bg-white hover:bg-white/90 text-black border-0 font-semibold" disabled={loading}>
                    {loading && <Spinner className="mr-2" />}
                    Complete Setup
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === 'complete' && (
            <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                  <Check className="h-6 w-6 text-emerald-400" />
                </div>
                <h1 className="text-2xl font-semibold text-white mb-2">You&apos;re All Set!</h1>
                <p className="text-white/60">Your account is ready. Here&apos;s your extension token to get started.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-6">
                <p className="text-xs text-white/40 mb-2">Extension Token</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm font-mono text-white break-all">{extensionToken}</code>
                  <Button size="sm" variant="outline" onClick={copyToken} className="border-white/20 text-white hover:bg-white/10">Copy</Button>
                </div>
              </div>
              <p className="text-sm text-white/50 text-center mb-6">
                Install the KEVI Chrome extension and paste this token to start tracking your activity.
              </p>
              <Button className="w-full bg-white hover:bg-white/90 text-black border-0 font-semibold" onClick={() => router.push('/dashboard')}>
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-white/40 mt-6">
            Setting up <span className="font-medium text-white/60">{companyName || 'your company'}</span>
          </p>
        </div>
      </main>
    </div>
  )
}
