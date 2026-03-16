'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CATEGORY_COLORS, CATEGORY_LABELS, ActivityCategory } from '@/lib/types'
import { formatDuration } from '@/lib/kevi-utils'
import { Activity, Clock, Users } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ProductivityTeamPage() {
  const [period, setPeriod] = useState('7d')
  
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/productivity?period=${period}&view=team`,
    fetcher
  )

  const reps = data?.reps || []
  const totalHours = reps.reduce((acc: number, rep: { total_active_hours: number }) => acc + rep.total_active_hours, 0)
  const avgHours = reps.length > 0 ? totalHours / reps.length : 0

  // Prepare chart data - top 10 reps
  const chartData = reps.slice(0, 10).map((rep: { name: string; total_active_hours: number }) => ({
    name: rep.name.split(' ')[0], // First name only for chart
    hours: Number(rep.total_active_hours.toFixed(1)),
  }))

  // Aggregate category breakdown across all reps
  const categoryTotals: Record<string, number> = {}
  reps.forEach((rep: { by_category: Record<string, number> }) => {
    Object.entries(rep.by_category || {}).forEach(([cat, seconds]) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (seconds as number)
    })
  })

  const categoryData = Object.entries(categoryTotals)
    .map(([category, seconds]) => ({
      category: CATEGORY_LABELS[category as ActivityCategory] || category,
      hours: Number((seconds / 3600).toFixed(1)),
      fill: CATEGORY_COLORS[category as ActivityCategory] || '#6B7280',
    }))
    .sort((a, b) => b.hours - a.hours)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Team Productivity</h1>
          <p className="text-muted-foreground">Monitor activity levels across your sales team</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="Total Active Hours"
          value={formatDuration(totalHours * 3600)}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          title="Average per Rep"
          value={formatDuration(avgHours * 3600)}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Active Reps"
          value={reps.filter((r: { total_active_hours: number }) => r.total_active_hours > 0).length}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Leaderboard</CardTitle>
            <CardDescription>Ranked by total active hours</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : reps.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No activity data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reps.slice(0, 8).map((rep: { id: string; name: string; total_active_hours: number; by_category: Record<string, number> }, index: number) => {
                  const initials = rep.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  const maxHours = reps[0]?.total_active_hours || 1
                  const percentage = (rep.total_active_hours / maxHours) * 100

                  return (
                    <div key={rep.id} className="flex items-center gap-3">
                      <span className="w-6 text-sm text-muted-foreground font-medium">
                        {index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{rep.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDuration(rep.total_active_hours * 3600)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Time by Category</CardTitle>
            <CardDescription>Team aggregate across all tools</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No activity data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(value) => `${value}h`} />
                  <YAxis dataKey="category" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number) => [`${value} hours`, 'Time']}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar dataKey="hours" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart Comparison */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Rep Comparison</CardTitle>
          <CardDescription>Active hours by team member</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No activity data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value}h`} />
                <Tooltip
                  formatter={(value: number) => [`${value} hours`, 'Active Time']}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
