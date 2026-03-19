'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { KeviLogo } from '@/components/kevi-logo'
import { Button } from '@/components/ui/button'
import { Menu, X, ChevronDown, BarChart3, Zap, TrendingUp, Users, Brain, HelpCircle, Layers, Activity, Clock, Wand2, Radio } from 'lucide-react'

interface MarketingNavProps {
  cancelLabel?: string
  onCancel?: () => void
}

const PRODUCTS = [
  {
    icon: Activity,
    label: 'Activity Tracking',
    description: 'See exactly how reps spend every minute',
  },
  {
    icon: Zap,
    label: 'Efficiency Monitoring',
    description: 'Identify manual vs automated workflows',
  },
  {
    icon: TrendingUp,
    label: 'Performance Analysis',
    description: 'Score and trend rep productivity over time',
  },
  {
    icon: Wand2,
    label: 'Clicker Detection',
    description: 'Detect automation tools and bot-like behaviour',
  },
  {
    icon: Layers,
    label: 'Productivity Views',
    description: 'Deep-dive dashboards for managers and coaches',
  },
  {
    icon: Radio,
    label: 'Live View',
    description: 'Real-time command centre for your sales floor',
  },
]

const SOLUTIONS = [
  {
    icon: TrendingUp,
    title: 'Improve Workforce Productivity',
    description: 'Identify where time is lost and redirect it to revenue-generating activity',
  },
  {
    icon: HelpCircle,
    title: 'Identify Performance Patterns',
    description: 'Understand what top performers do differently and replicate it',
  },
  {
    icon: Brain,
    title: 'Hire Intelligently',
    description: 'Use activity benchmarks to set realistic expectations for new hires',
  },
  {
    icon: Users,
    title: 'Coaching and Performance',
    description: 'Surface coaching opportunities before they become performance problems',
  },
  {
    icon: BarChart3,
    title: 'HR Assistance',
    description: 'Give HR objective activity data to support performance conversations',
  },
]

export function MarketingNav({ cancelLabel, onCancel }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setActiveDropdown(null)
  }, [pathname])

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'white',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.06)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center h-[68px] gap-12">
            <Link href="/" className="shrink-0">
              <KeviLogo className="text-lg text-black" />
            </Link>

            {!cancelLabel && (
              <nav className="hidden lg:flex items-center gap-1 flex-1">
                {/* Products Dropdown */}
                <div
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown('products')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors flex items-center gap-1 group-hover:bg-gray-100">
                    Products
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                  </button>

                  {/* Products Dropdown Panel */}
                  <div className="absolute left-0 top-full hidden group-hover:block pt-2">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-8 w-[960px]">
                      <div className="grid grid-cols-2 gap-12">
                        {/* Features Column */}
                        <div className="space-y-4">
                          {PRODUCTS.map((product) => {
                            const Icon = product.icon
                            return (
                              <div key={product.label} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <Icon className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{product.label}</p>
                                  <p className="text-xs text-gray-600">{product.description}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Visual mockup column */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                          <div className="space-y-3">
                            <div className="h-2 bg-gray-300 rounded w-24" />
                            <div className="grid grid-cols-3 gap-2">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded p-2 border border-gray-200">
                                  <div className="h-1 bg-emerald-400 rounded w-full mb-1" />
                                  <div className="h-1 bg-gray-300 rounded w-2/3" />
                                </div>
                              ))}
                            </div>
                            <div className="bg-white rounded p-3 border border-gray-200 text-xs text-gray-600">
                              <p className="font-semibold text-gray-900 mb-1">Rep Profile Preview</p>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span>Active Time:</span>
                                  <span className="text-emerald-600 font-semibold">6h 24m</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Score:</span>
                                  <span className="text-emerald-600 font-semibold">82/100</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Solutions Dropdown */}
                <div
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown('solutions')}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 transition-colors flex items-center gap-1 group-hover:bg-gray-100">
                    Solutions
                    <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                  </button>

                  {/* Solutions Dropdown Panel */}
                  <div className="absolute left-0 top-full hidden group-hover:block pt-2">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 w-[480px]">
                      <div className="space-y-3">
                        {SOLUTIONS.map((solution) => {
                          const Icon = solution.icon
                          return (
                            <div key={solution.title} className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <Icon className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{solution.title}</p>
                                <p className="text-xs text-gray-600">{solution.description}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </nav>
            )}

            {cancelLabel && <div className="flex-1" />}

            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {cancelLabel && onCancel ? (
                <Button
                  variant="ghost"
                  className="rounded-lg text-sm font-medium px-5 text-gray-700 hover:text-black hover:bg-gray-100"
                  onClick={onCancel}
                >
                  {cancelLabel}
                </Button>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" className="rounded-lg text-sm font-medium px-5 text-gray-700 hover:text-black hover:bg-gray-100">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up">
                    <Button className="rounded-lg text-sm font-semibold px-6 bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                      Get started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {!cancelLabel && (
              <button
                className="lg:hidden ml-auto flex items-center justify-center w-10 h-10 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}

            {cancelLabel && onCancel && (
              <button
                className="lg:hidden ml-auto text-sm font-medium text-gray-700 hover:text-black transition-colors"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
            )}
          </div>
        </div>

        {!cancelLabel && mobileOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white px-6 py-4 flex flex-col gap-4">
            {/* Products Mobile */}
            <div>
              <button
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
                onClick={() => setActiveDropdown(activeDropdown === 'products' ? null : 'products')}
              >
                Products
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'products' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'products' && (
                <div className="mt-2 ml-2 space-y-2 border-l-2 border-gray-200 pl-4">
                  {PRODUCTS.map((product) => {
                    const Icon = product.icon
                    return (
                      <div key={product.label} className="flex gap-2 p-2 text-sm">
                        <Icon className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{product.label}</p>
                          <p className="text-xs text-gray-600">{product.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Solutions Mobile */}
            <div>
              <button
                className="w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-2"
                onClick={() => setActiveDropdown(activeDropdown === 'solutions' ? null : 'solutions')}
              >
                Solutions
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === 'solutions' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'solutions' && (
                <div className="mt-2 ml-2 space-y-2 border-l-2 border-gray-200 pl-4">
                  {SOLUTIONS.map((solution) => {
                    const Icon = solution.icon
                    return (
                      <div key={solution.title} className="flex gap-2 p-2 text-sm">
                        <Icon className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900">{solution.title}</p>
                          <p className="text-xs text-gray-600">{solution.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full rounded-lg border-gray-300 text-gray-900 hover:bg-gray-50">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/sign-up" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      <div className="h-[68px]" aria-hidden="true" />
    </>
  )
}
