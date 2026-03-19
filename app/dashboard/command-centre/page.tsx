'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatTimeAgo, fmtTime, fmtCurrency } from '@/lib/kevi-utils'
import { Radio, Users, Activity, Zap } from 'lucide-react'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function CommandCentrePage() {
  const { data, isLoading } = useSWR('/api/dashboard/command-centre', fetcher, { refreshInterval: 15000 })
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  if (isLoading) return <div className="p-8">Loading...</div>

  const { teamData = [], teamTotals = {} } = data || {}

  return (
    <div className="min-h-screen bg-background p-8 relative overflow-hidden">
      {/* Ambient background glows - multiple layered effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top center emerald glow */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-emerald-500/20 rounded-full blur-[150px]" />
        {/* Left green accent */}
        <div className="absolute top-[20%] left-[-5%] w-[600px] h-[500px] bg-green-600/15 rounded-full blur-[120px]" />
        {/* Right teal accent */}
        <div className="absolute top-[40%] right-[-5%] w-[500px] h-[400px] bg-teal-500/15 rounded-full blur-[110px]" />
        {/* Mid orange accent - adds warmth */}
        <div className="absolute top-[50%] left-[35%] w-[400px] h-[300px] bg-orange-500/10 rounded-full blur-[100px]" />
        {/* Bottom emerald glow */}
        <div className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-600/20 rounded-full blur-[140px]" />
        {/* Bottom right subtle accent */}
        <div className="absolute bottom-[10%] right-[5%] w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Team Command Centre</h1>
          <p className="text-white/60">Real-time team activity and performance overview</p>
        </div>

        {/* Team Totals Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Online Now</p>
                  <p className="text-3xl font-bold text-emerald-400">{teamTotals.onlineCount}/{teamTotals.totalReps}</p>
                </div>
                <Radio className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Total Active</p>
                  <p className="text-3xl font-bold text-cyan-400">{fmtTime(teamTotals.totalActive)}</p>
                </div>
                <Activity className="h-8 w-8 text-cyan-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Meetings Booked</p>
                  <p className="text-3xl font-bold text-orange-400">{teamTotals.totalMeetings}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Deals Created</p>
                  <p className="text-3xl font-bold text-green-400">{teamTotals.totalDeals}</p>
                </div>
                <Zap className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Grid */}
        <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10 overflow-hidden">
          <CardHeader>
            <CardTitle>Team Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamData.map((rep, idx) => {
                const statusColor = rep.isOnline ? 'status-green' : 'status-red'
                const barColor = rep.isOnline ? 'bar-green' : 'bar-orange'
                const statusBadge = rep.isOnline ? 'Online' : 'Offline'

                return (
                  <Link key={rep.id} href={`/dashboard/rep-profile/${rep.id}`}>
                    <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 cursor-pointer">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-white">{rep.name}</h3>
                          <p className="text-xs text-white/40">{rep.email}</p>
                        </div>
                        <Badge className={statusColor}>{statusBadge}</Badge>
                      </div>

                      {/* Current Activity */}
                      {rep.currentDomain && (
                        <div className="mb-4 p-3 bg-white/[0.03] rounded-lg border border-white/5">
                          <p className="text-xs text-white/50 mb-1">Currently on</p>
                          <p className="font-mono text-sm text-white/80">{rep.currentDomain}</p>
                          <p className="text-xs text-white/40 mt-1">{rep.currentCategory}</p>
                        </div>
                      )}

                      {/* Activity Bars */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs text-white/60">Active Time</p>
                            <p className="text-xs font-mono text-white/80">{fmtTime(rep.todayActiveSecs)}</p>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor}`} style={{ width: `${Math.min((rep.todayActiveSecs / 28800) * 100, 100)}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs text-white/60">Keystrokes</p>
                            <p className="text-xs font-mono text-white/80">{rep.todayKeystrokes}</p>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor}`} style={{ width: `${Math.min((rep.todayKeystrokes / 5000) * 100, 100)}%` }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs text-white/60">Meetings</p>
                            <p className="text-xs font-mono text-white/80">{rep.todayMeetings}</p>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor}`} style={{ width: `${Math.min((rep.todayMeetings / 8) * 100, 100)}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Last Seen */}
                      <p className="text-xs text-white/40 mt-4 pt-3 border-t border-white/5">
                        {rep.lastSeen ? `Last seen ${formatTimeAgo(rep.lastSeen)}` : 'Never seen'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
