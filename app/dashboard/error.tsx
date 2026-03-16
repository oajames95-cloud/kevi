'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="bg-white border border-border rounded-lg p-12 text-center shadow-sm max-w-sm">
        <div className="text-3xl mb-4">⚠️</div>
        <p className="font-serif font-bold text-foreground text-lg mb-2">
          Something went wrong
        </p>
        <p className="text-muted-foreground text-sm mb-6">
          {error.message ?? 'An unexpected error occurred loading this page.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 py-2 text-sm font-semibold"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="border border-border rounded-lg px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
