import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'
import { KeviLogo } from '@/components/kevi-logo'

export default function SignUpSuccessPage() {
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

        <div className="p-8 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/10 shadow-xl shadow-emerald-900/10 text-center">
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
            <Mail className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Check your email</h1>
          <p className="text-white/60 mb-6">
            We sent you a confirmation link to verify your email address
          </p>
          <p className="text-sm text-white/40 mb-8">
            Click the link in the email to complete your account setup and start tracking your sales team performance.
          </p>
          <Button asChild variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
            <Link href="/auth/login">Back to sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
