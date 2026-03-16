'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { RepSelector } from '@/components/dashboard/rep-selector'
import { StatCard } from '@/components/dashboard/stat-card'
import { Rep } from '@/lib/types'
import { formatCurrency } from '@/lib/kevi-utils'
import { Calendar, DollarSign, Target, TrendingUp } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PerformanceIndividualPage() {
  const [period, setPeriod] = useState('7d')
  const [selectedRepId, setSelectedRepId] = useState<string>('')

  // Get list of reps
  const { data: repsData } = useSWR('/api/reps', fetcher)
  const reps: Rep[] = repsData?.reps || []

  // Auto-select first rep if none selected
  if (!selectedRepId && reps.length > 0) {
    setSelectedRepId(reps[0].id)
  }

  // Get individual performance data
  const { data, isLoading } = useSWR(
    selectedRepId ? `/api/dashboard/performance?period=${period}&view=individual&rep_id=${selectedRepId}` : null,
    fetcher
  )

  const dailyBreakdown = data?.daily_breakdown || []
  const activityVsDeals = data?.activity_vs_deals || []

  // Calculate totals
  const totalMeetings = dailyBreakdown.reduce((acc: number, day: { meetings_booked: number }) => acc + day.meetings_booked, 0)
  const totalDeals = dailyBreakdown.reduce((acc: number, day: { deals_created: number }) => acc + day.deals_created, 0)
  const totalPipeline = dailyBreakdown.reduce((acc: number, day: { pipeline_value: number }) => acc + day.pipeline_value, 0)

  // Prepare chart data
  const trendData = dailyBreakdown.map((day: {
    date: string
    meetings_booked: number
    deals_created: number
    pipeline_value: number
  }) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    meetings: day.meetings_booked,
    deals: day.deals_created,
    pipeline: day.pipeline_value,
  }))

  // Scatter plot data for activity vs deals
  const scatterData = activityVsDeals.filter((d: { active_hours: number }) => d.active_hours > 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Individual Performance</h1>
          <p className="text-muted-foreground">Deep dive into rep deal activity and outcomes</p>
        </div>
        <div className="flex items-center gap-3">
          <RepSelector reps={reps} value={selectedRepId} onChange={setSelectedRepId} />
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {!selectedRepId ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Select a rep to view their performance</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <StatCard
              title="Meetings Booked"
              value={totalMeetings}
              icon={<Calendar className="h-4 w-4" />}
            />
            <StatCard
              title="Deals Created"
              value={totalDeals}
              icon={<Target className="h-4 w-4" />}
            />
            <StatCard
              title="Pipeline Added"
              value={formatCurrency(totalPipeline)}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <StatCard
              title="Avg Deal Size"
              value={totalDeals > 0 ? formatCurrency(totalPipeline / totalDeals) : '$0'}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>

          {/* Daily Trend */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Daily Performance Trend</CardTitle>
              <CardDescription>Meetings and deals over time</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">No performance data for this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="meetings"
                      name="Meetings"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorMeetings)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="deals"
                      name="Deals"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorDeals)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Activity vs Deals Scatter */}
          <Card>
            <CardHeader>
              <CardTitle>Activity vs Deals Correlation</CardTitle>
              <CardDescription>Each point represents a day: active hours vs deals created</CardDescription>
            </CardHeader>
            <CardContent>
              {scatterData.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">Not enough data for correlation analysis</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="active_hours"
                      name="Active Hours"
                      unit="h"
                      domain={[0, 'auto']}
                    />
                    <YAxis
                      type="number"
                      dataKey="deals_created"
                      name="Deals"
                      domain={[0, 'auto']}
                    />
                    <ZAxis range={[100, 100]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ borderRadius: '8px' }}
                      formatter={(value: number, name: string) => [
                        name === 'Active Hours' ? `${value.toFixed(1)}h` : value,
                        name,
                      ]}
                    />
                    <Scatter
                      name="Days"
                      data={scatterData}
                      fill="#10B981"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
