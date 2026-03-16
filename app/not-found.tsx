import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Gradient fog background - layered glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/30 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[15%] w-[500px] h-[400px] bg-green-600/20 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[5%] w-[350px] h-[350px] bg-teal-500/15 rounded-full blur-[90px]" />
      </div>
      <div className="text-center relative z-10">
        <p className="font-bold text-7xl bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent mb-4">404</p>
        <p className="font-semibold text-white text-xl mb-2">Page not found</p>
        <p className="text-white/50 text-sm mb-8">
          This page doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link
          href="/dashboard"
          className="bg-white hover:bg-white/90 text-black rounded-lg px-6 py-2.5 text-sm font-semibold inline-block transition-all"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
