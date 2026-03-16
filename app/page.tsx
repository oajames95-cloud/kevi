'use client'

import Link from 'next/link'
import { ArrowRight, BarChart3, Zap, TrendingUp, Users, Chrome } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarketingNav } from '@/components/marketing-nav'
import { KeviLogo } from '@/components/kevi-logo'

export default function Home() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <MarketingNav />
      <main className="relative">
        {/* Gradient fog/glow background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Top center emerald glow */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-600/25 rounded-full blur-[120px]" />
          {/* Left forest green accent */}
          <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-green-700/15 rounded-full blur-[100px]" />
          {/* Right bottle green accent */}
          <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-teal-600/15 rounded-full blur-[100px]" />
          {/* Bottom center glow */}
          <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-700/20 rounded-full blur-[120px]" />
        </div>

        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 flex justify-center">
              <KeviLogo className="text-4xl" />
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold text-white mb-6 text-balance leading-tight">
              Sales behaviour intelligence.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                Understand what your top performers actually do.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto text-pretty leading-relaxed">
              Track productivity, measure performance, and drive revenue growth. Get complete visibility into your team&apos;s sales activity.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/auth/sign-up">
                <Button size="lg" className="rounded-lg text-base px-8 py-6 bg-white hover:bg-white/90 text-black border-0 font-semibold shadow-lg shadow-white/20">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="rounded-lg text-base px-8 py-6 border-white/20 text-white hover:bg-white/10 font-medium">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
                Email is the{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-green-400 to-teal-400 bg-clip-text text-transparent">
                  biggest problem hiding in plain sight
                </span>
              </h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                We all spend hours on sales activity. But without visibility, coaching becomes guesswork.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Team Analytics</h3>
                <p className="text-white/60 leading-relaxed">
                  Monitor productivity and performance across your entire team in real-time. See who&apos;s thriving and who needs support.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center mb-6">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Activity Tracking</h3>
                <p className="text-white/60 leading-relaxed">
                  Automatic keystroke and focus tracking powered by our Chrome extension. No manual logging required.
                </p>
              </div>

              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Revenue Insights</h3>
                <p className="text-white/60 leading-relaxed">
                  Correlate activity with deals and pipeline to drive smarter coaching. Understand what actually drives results.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Features Section */}
        <section className="py-24 px-4 border-t border-white/10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
                Fly through your data{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  twice as fast
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white">Productivity Dashboard</h3>
                </div>
                <ul className="text-white/60 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Team leaderboards by focus time
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Domain activity breakdown
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Keystroke intensity analysis
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Performance Analytics</h3>
                </div>
                <ul className="text-white/60 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Deals created by activity level
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Conversion funnels
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Coaching flags for low performers
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-5 w-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">CRM Integration</h3>
                </div>
                <ul className="text-white/60 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    HubSpot &amp; Salesforce webhooks
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Deal value tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    Activity-to-revenue correlation
                  </li>
                </ul>
              </div>

              <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <Chrome className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Chrome Extension</h3>
                </div>
                <ul className="text-white/60 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Automatic keystroke tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Domain classification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Real-time sync
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="pricing" className="py-32 px-4 border-t border-white/10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 text-balance">
              Ready to transform your{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                sales team
              </span>
              ?
            </h2>
            <p className="text-xl text-white/60 mb-10 text-pretty">
              Join leading sales organisations using KEVI to drive accountability and revenue growth.
            </p>
            <Link href="/auth/sign-up">
              <Button size="lg" className="rounded-lg text-base px-8 py-6 bg-white hover:bg-white/90 text-black border-0 font-semibold shadow-lg shadow-white/20">
                <Chrome className="mr-2 h-5 w-5" /> Install KEVI Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
