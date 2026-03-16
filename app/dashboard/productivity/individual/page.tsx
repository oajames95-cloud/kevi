'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { RepSelector } from '@/components/dashboard/rep-selector'
import { StatCard } from '@/components/dashboard/stat-card'
import { CATEGORY_COLORS, CATEGORY_LABELS, ActivityCategory, Rep } from '@/lib/types'
import { formatDuration } from '@/lib/kevi-utils'
import { Activity, Keyboard, Clock } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductivityIndividualPage() {
  const [period, setPeriod] = useState('7d')
  const [selectedRepId, setSelectedRepId] = useState<string>('')

  // Get list of reps
  const { data: repsData } = useSWR('/api/reps', fetcher)
  const reps: Rep[] = repsData?.reps || []

  // Auto-select first rep if none selected
  if (!selectedRepId && reps.length > 0) {
    setSelectedRepId(reps[0].id)
  }

  // Get individual productivity data
  const { data, isLoading } = useSWR(
    selectedRepId ? `/api/dashboard/productivity?period=${period}&view=individual&rep_id=${selectedRepId}` : null,
    fetcher
  )

  const dailyBreakdown = data?.daily_breakdown || []
  const rep = data?.rep

  // Calculate totals
  const totalSeconds = dailyBreakdown.reduce((acc: number, day: { total_seconds: number }) => acc + day.total_seconds, 0)
  const avgDailySeconds = dailyBreakdown.length > 0 ? totalSeconds / dailyBreakdown.length : 0

  // Prepare area chart data
  const areaData = dailyBreakdown.map((day: { date: string; total_seconds: number }) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: Number((day.total_seconds / 3600).toFixed(1)),
  }))

  // Aggregate category data for pie chart
  const categoryTotals: Record<string, number> = {}
  dailyBreakdown.forEach((day: { by_category: Record<string, number> }) => {
    Object.entries(day.by_category || {}).forEach(([cat, seconds]) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (seconds as number)
    })
  })

  const pieData = Object.entries(categoryTotals)
    .map(([category, seconds]) => ({
      name: CATEGORY_LABELS[category as ActivityCategory] || category,
      value: Number((seconds / 3600).toFixed(1)),
      fill: CATEGORY_COLORS[category as ActivityCategory] || '#6B7280',
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)

  // Get top domains
  const domainTotals: Record<string, number> = {}
  dailyBreakdown.forEach((day: { by_domain: Record<string, number> }) => {
    Object.entries(day.by_domain || {}).forEach(([domain, seconds]) => {
      domainTotals[domain] = (domainTotals[domain] || 0) + (seconds as number)
    })
  })

  const topDomains = Object.entries(domainTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([domain, seconds]) => ({
      domain,
      hours: Number((seconds / 3600).toFixed(1)),
    }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Individual Productivity</h1>
          <p className="text-muted-foreground">Deep dive into rep activity patterns</p>
        </div>
        <div className="flex items-center gap-3">
          <RepSelector reps={reps} value={selectedRepId} onChange={setSelectedRepId} />
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      {!selectedRepId ? (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Select a rep to view their productivity</p>
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
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <StatCard
              title="Total Active Time"
              value={formatDuration(totalSeconds)}
              icon={<Clock className="h-4 w-4" />}
            />
            <StatCard
              title="Daily Average"
              value={formatDuration(avgDailySeconds)}
              icon={<Activity className="h-4 w-4" />}
            />
            <StatCard
              title="Top Category"
              value={pieData[0]?.name || 'N/A'}
              icon={<Keyboard className="h-4 w-4" />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Daily Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Daily Activity Trend</CardTitle>
                <CardDescription>Hours of active time per day</CardDescription>
              </CardHeader>
              <CardContent>
                {areaData.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No activity data for this period</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={areaData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" />
                      <YAxis tickFormatter={(value) => `${value}h`} />
                      <Tooltip
                        formatter={(value: number) => [`${value} hours`, 'Active Time']}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorHours)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Category Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Time by Category</CardTitle>
                <CardDescription>Distribution of activity types</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No category data</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`${value} hours`, 'Time']}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top Domains */}
            <Card>
              <CardHeader>
                <CardTitle>Top Domains</CardTitle>
                <CardDescription>Most visited sites by time</CardDescription>
              </CardHeader>
              <CardContent>
                {topDomains.length === 0 ? (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">No domain data</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topDomains.map((item, index) => {
                      const maxHours = topDomains[0]?.hours || 1
                      const percentage = (item.hours / maxHours) * 100

                      return (
                        <div key={item.domain}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {item.domain}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {item.hours}h
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
