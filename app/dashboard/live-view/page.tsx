'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Activity, AlertTriangle, Clock, Users, Zap, Monitor, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RepWithStatus, LiveViewData } from '@/lib/types'
import { formatDuration } from '@/lib/kevi-utils'

const REFRESH_INTERVAL = 15000 // 15 seconds

export default function LiveViewPage() {
  const [data, setData] = useState<LiveViewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

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
              Last updated: {lastRefresh.toLocaleTimeString()}
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
                      <div className="text-sm text-muted-foreground">
                        {rep.last_seen_at 
                          ? `Last seen ${new Date(rep.last_seen_at).toLocaleString()}`
                          : 'Never connected'
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
      </div>
    </TooltipProvider>
  )
}
