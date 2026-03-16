'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PeriodSelector } from '@/components/dashboard/period-selector'
import { StatCard } from '@/components/dashboard/stat-card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/kevi-utils'
import { Calendar, DollarSign, TrendingUp, Target } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PerformanceTeamPage() {
  const [period, setPeriod] = useState('7d')
  
  const { data, error, isLoading } = useSWR(
    `/api/dashboard/performance?period=${period}&view=team`,
    fetcher
  )

  const reps = data?.reps || []
  const totals = data?.totals || { meetings_booked: 0, deals_created: 0, pipeline_value: 0 }

  // Prepare chart data
  const chartData = reps.slice(0, 10).map((rep: { name: string; pipeline_value: number }) => ({
    name: rep.name.split(' ')[0],
    value: rep.pipeline_value,
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Team Performance</h1>
          <p className="text-muted-foreground">Track deals, meetings, and pipeline metrics</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <StatCard
          title="Total Meetings"
          value={totals.meetings_booked}
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatCard
          title="Deals Created"
          value={totals.deals_created}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          title="Pipeline Value"
          value={formatCurrency(totals.pipeline_value)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatCard
          title="Avg Deal Size"
          value={totals.deals_created > 0 ? formatCurrency(totals.pipeline_value / totals.deals_created) : '$0'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Leaderboard</CardTitle>
            <CardDescription>Ranked by total pipeline value</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : reps.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No performance data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reps.slice(0, 8).map((rep: {
                  id: string
                  name: string
                  meetings_booked: number
                  deals_created: number
                  pipeline_value: number
                }, index: number) => {
                  const initials = rep.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                  const maxValue = reps[0]?.pipeline_value || 1
                  const percentage = maxValue > 0 ? (rep.pipeline_value / maxValue) * 100 : 0

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
                            {formatCurrency(rep.pipeline_value)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
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

        {/* Meetings & Deals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown</CardTitle>
            <CardDescription>Meetings and deals by rep</CardDescription>
          </CardHeader>
          <CardContent>
            {reps.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">No data yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-4 text-xs font-medium text-muted-foreground pb-2 border-b">
                  <div>Rep</div>
                  <div className="text-center">Meetings</div>
                  <div className="text-center">Deals</div>
                  <div className="text-right">Pipeline</div>
                </div>
                {reps.slice(0, 8).map((rep: {
                  id: string
                  name: string
                  meetings_booked: number
                  deals_created: number
                  pipeline_value: number
                }) => (
                  <div key={rep.id} className="grid grid-cols-4 py-2 text-sm">
                    <div className="font-medium truncate">{rep.name}</div>
                    <div className="text-center">{rep.meetings_booked}</div>
                    <div className="text-center">{rep.deals_created}</div>
                    <div className="text-right">{formatCurrency(rep.pipeline_value)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Comparison Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Pipeline by Rep</CardTitle>
          <CardDescription>Total pipeline value comparison</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-muted-foreground">No pipeline data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Pipeline']}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
