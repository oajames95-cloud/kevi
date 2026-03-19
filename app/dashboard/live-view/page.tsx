'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Activity, AlertTriangle, Clock, Users, Zap, Monitor, RefreshCw, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts'
import type { RepWithStatus, LiveViewData } from '@/lib/types'
import { formatDuration } from '@/lib/kevi-utils'

const REFRESH_INTERVAL = 15000 // 15 seconds auto-refresh

export default function LiveViewPage() {
  const [data, setData] = useState<LiveViewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch by only rendering dates after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/live-view')
      if (response.ok) {
        const json = await response.json()
        setData(json)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch live view data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchData])

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'online': return 'bg-emerald-500'
      case 'passive': return 'bg-amber-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'online': return <Badge className="bg-emerald-500 text-white">Online</Badge>
      case 'passive': return <Badge className="bg-amber-500 text-white">Passive</Badge>
      default: return <Badge variant="secondary">Offline</Badge>
    }
  }

  const hasAutomationFlags = (rep: RepWithStatus) => {
    if (!rep.status) return false
    return rep.status.untrusted_clicks_last_min > 0 ||
           rep.status.held_key_events_last_min > 3 ||
           rep.status.held_mouse_events_last_min > 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold">Live View</h1>
            <p className="text-muted-foreground">Real-time team activity command center</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Last updated: {mounted && lastRefresh ? lastRefresh.toLocaleTimeString() : '--:--:--'}
            </span>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Online
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{data?.summary.online || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                Passive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{data?.summary.passive || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-gray-400" />
                Offline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{data?.summary.offline || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Team Active Today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatDuration(data?.summary.total_active_seconds || 0)}
              </div>
            </CardContent>
          </Card>
          
          <Card className={data?.summary.flagged_count ? 'border-destructive' : ''}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Flagged
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${data?.summary.flagged_count ? 'text-destructive' : ''}`}>
                {data?.summary.flagged_count || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rep Grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Activity
            </CardTitle>
            <CardDescription>
              Live status of all team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.reps.map((rep) => (
                <Card 
                  key={rep.id} 
                  className={`relative ${hasAutomationFlags(rep) ? 'border-destructive bg-destructive/5' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${getStatusColor(rep.status?.status)}`} />
                        <div>
                          <div className="font-medium">{rep.name}</div>
                          <div className="text-xs text-muted-foreground">{rep.email}</div>
                        </div>
                      </div>
                      {getStatusBadge(rep.status?.status)}
                    </div>
                    
                    {rep.status && rep.status.status !== 'offline' && (
                      <div className="space-y-2">
                        {/* Current Activity */}
                        <div className="flex items-center gap-2 text-sm">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">
                            {rep.status.current_domain || 'Unknown'}
                          </span>
                          {rep.status.current_category && (
                            <Badge variant="outline" className="text-xs">
                              {rep.status.current_category}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Activity Metrics */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {rep.status.keystrokes_last_min}/min
                            </TooltipTrigger>
                            <TooltipContent>Keystrokes per minute</TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              {formatDuration(rep.status.today_active_seconds)}
                            </TooltipTrigger>
                            <TooltipContent>Active time today</TooltipContent>
                          </Tooltip>
                        </div>
                        
                        {/* Automation Flags */}
                        {hasAutomationFlags(rep) && (
                          <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-3 w-3" />
                            <span>
                              Automation signals detected
                              {rep.status.untrusted_clicks_last_min > 0 && ' (untrusted clicks)'}
                              {rep.status.held_key_events_last_min > 3 && ' (held keys)'}
                              {rep.status.held_mouse_events_last_min > 0 && ' (held mouse)'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(!rep.status || rep.status.status === 'offline') && (
                      <div className="text-sm text-muted-foreground" suppressHydrationWarning>
                        {mounted && rep.last_seen_at 
                          ? `Last seen ${new Date(rep.last_seen_at).toLocaleString()}`
                          : rep.last_seen_at ? 'Last seen recently' : 'Never connected'
                        }
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {(!data?.reps || data.reps.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No team members found</p>
                <p className="text-sm">Add reps in the Team Management section</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PANEL 1: Hourly activity today */}
        {data?.hourlyActivity && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity by hour — today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 h-16 items-end">
                {data.hourlyActivity.map((hour) => (
                  <Tooltip key={hour.hour}>
                    <TooltipTrigger className="flex-1">
                      <div
                        className={`w-full h-full rounded-t transition-all ${
                          hour.totalSeconds === 0
                            ? 'bg-white/5'
                            : 'bg-gradient-to-t from-emerald-500 to-emerald-400 hover:opacity-80'
                        }`}
                        style={{
                          opacity: Math.min(1, hour.totalSeconds / 7200),
                          minHeight: '4px',
                        }}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {`${hour.hour}:00 - ${hour.repCount} reps, ${Math.floor(hour.totalSeconds / 60)}m active`}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <div className="text-xs text-white/60 mt-2 text-center">
                Peak so far: {data.hourlyActivity.reduce((max, h) => h.totalSeconds > max.totalSeconds ? h : max).hour}:00
              </div>
            </CardContent>
          </Card>
        )}

        {/* PANEL 2: Today's leaderboard */}
        {data?.todayLeaderboard && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.todayLeaderboard.map((rep, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-bold text-white/60 w-6">{rep.rank}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{rep.name}</p>
                        <p className="text-xs text-white/60">{rep.topCategory}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-sm font-bold ${
                          rep.score >= 75 ? 'text-emerald-400' :
                          rep.score >= 50 ? 'text-orange-400' :
                          'text-red-400'
                        }`}>{rep.score}</p>
                      </div>
                      <Badge
                        className={
                          rep.status === 'online'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : rep.status === 'passive'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-white/10 text-white/60'
                        }
                      >
                        {rep.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PANEL 3: Team's most used tools today */}
        {data?.teamTopDomains && data.teamTopDomains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team's most used tools today</CardTitle>
              <CardDescription>Combined time across {data.summary.online + data.summary.passive} active reps</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.teamTopDomains.map((domain, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{domain.domain}</p>
                      <p className="text-xs text-white/60">{domain.repCount} reps</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                          style={{
                            width: `${(domain.totalSeconds / Math.max(...data.teamTopDomains.map(d => d.totalSeconds), 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-white/80 w-10 text-right">
                        {Math.floor(domain.totalSeconds / 60)}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PANEL 4: Team productivity trending */}
        {data?.teamScoreTrend && data.teamScoreTrend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team productivity — last 14 days</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.teamScoreTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 12 }} />
                  <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <ChartTooltip
                    contentStyle={{ backgroundColor: 'rgba(10,10,10,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                    formatter={(value) => [`Team avg: ${value}`, 'Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#10B981"
                    dot={{ fill: '#10B981', r: 3 }}
                    isAnimationActive={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-sm text-white/60 mt-4 text-center">
                {data.teamScoreTrend[data.teamScoreTrend.length - 1]?.avgScore > data.teamScoreTrend[0]?.avgScore
                  ? '↑ Team average improving'
                  : '↓ Team average declining'
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
