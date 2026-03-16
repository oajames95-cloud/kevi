'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { KeviLogo } from '@/components/kevi-logo'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Pricing', href: '/#pricing' },
]

interface MarketingNavProps {
  cancelLabel?: string
  onCancel?: () => void
}

export function MarketingNav({ cancelLabel, onCancel }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(8, 12, 10, 0.75)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-[68px] gap-8">
            <Link href="/" className="shrink-0">
              <KeviLogo className="text-lg" />
            </Link>

            {!cancelLabel && (
              <nav className="hidden md:flex items-center gap-1 flex-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="px-4 py-2 rounded-full text-[15px] font-medium text-white/70 hover:text-white transition-colors duration-150"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            )}

            {cancelLabel && <div className="flex-1" />}

            <div className="hidden md:flex items-center gap-2 shrink-0">
              {cancelLabel && onCancel ? (
                <Button
                  variant="ghost"
                  className="rounded-full text-[15px] font-medium px-5 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={onCancel}
                >
                  {cancelLabel}
                </Button>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="rounded-full text-[15px] font-medium px-5 text-white/80 hover:text-white hover:bg-white/10">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button className="rounded-full text-[15px] font-semibold px-6 bg-white hover:bg-white/90 text-black border-0">
                      Get started free
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {!cancelLabel && (
              <button
                className="md:hidden ml-auto flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-white/10 transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}

            {cancelLabel && onCancel && (
              <button
                className="md:hidden ml-auto text-sm font-medium text-white/60 hover:text-white transition-colors"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
            )}
          </div>
        </div>

        {!cancelLabel && mobileOpen && (
          <div className="md:hidden border-t border-white/10 bg-[rgba(8,12,10,0.95)] backdrop-blur-xl px-6 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block px-4 py-3 rounded-xl text-[15px] font-medium text-white hover:bg-white/10 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-white/10 mt-2">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full rounded-full border-white/20 text-white hover:bg-white/10">Sign in</Button>
              </Link>
              <Link href="/auth/sign-up" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-full bg-white hover:bg-white/90 text-black">Get started free</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <div className="h-[68px]" aria-hidden="true" />
    </>
  )
}
