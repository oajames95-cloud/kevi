'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fmtTime, formatTimeAgo } from '@/lib/kevi-utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertCircle, TrendingUp, TrendingDown, Radio } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const COLORS_MULTI = ['#10B981', '#14B8A6', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899']

export default function TeamPage() {
  const [period, setPeriod] = useState('1d')
  const { data, isLoading } = useSWR(`/api/dashboard/team?period=${period}`, fetcher)

  const reps = data?.reps || []
  const teamTotals = data?.teamTotals || {}

  if (!reps.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-emerald-500/30 rounded-full blur-[130px]" />
          <div className="absolute bottom-[-10%] left-[15%] w-[500px] h-[400px] bg-green-600/20 rounded-full blur-[100px]" />
          <div className="absolute top-[25%] right-[-5%] w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[100px]" />
        </div>
        <Card className="relative z-10 max-w-md">
          <CardHeader>
            <CardTitle>No team members yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add your team in Settings to start tracking. Once reps install the extension, their cards appear here.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto relative">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-emerald-500/25 rounded-full blur-[150px]" />
        <div className="absolute bottom-[5%] right-[10%] w-[500px] h-[400px] bg-teal-600/15 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[5%] w-[400px] h-[400px] bg-green-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 p-8">
        {/* Header with period selector */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Team Command Centre</h1>
            <p className="text-sm text-white/60 mt-1">
              {reps.length} rep{reps.length !== 1 ? 's' : ''} · {teamTotals.onlineCount || 0} online now
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rep cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {reps.map((rep, idx) => {
            const scoreColor =
              rep.todayScore >= 75
                ? 'text-emerald-400'
                : rep.todayScore >= 50
                  ? 'text-orange-400'
                  : 'text-red-400'
            const scoreBg =
              rep.todayScore >= 75
                ? 'bg-emerald-500/10'
                : rep.todayScore >= 50
                  ? 'bg-orange-500/10'
                  : 'bg-red-500/10'

            return (
              <Link key={rep.id} href={`/dashboard/rep/${rep.id}`}>
                <Card className="card-hover cursor-pointer h-full bg-white/[0.04] backdrop-blur-sm border border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.06] transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            rep.status === 'online'
                              ? 'bg-emerald-500'
                              : rep.status === 'passive'
                                ? 'bg-yellow-500'
                                : 'bg-gray-500'
                          }`}
                        />
                        <div>
                          <CardTitle className="text-base">{rep.name}</CardTitle>
                          <p className="text-xs text-white/60">{rep.email}</p>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${scoreColor} ${scoreBg} px-3 py-1 rounded`}>
                        {rep.todayScore}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Activity bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-white/60">{fmtTime(rep.totalActiveSecs)} active</p>
                        <p className="text-xs text-white/60">Target: 6h</p>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bar-green"
                          style={{ width: `${Math.min((rep.totalActiveSecs / 21600) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Category tags */}
                    <div className="flex flex-wrap gap-1">
                      {rep.byCategory.slice(0, 4).map((cat) => (
                        <Badge key={cat.category} variant="outline" className="text-xs">
                          {cat.category} {Math.floor(cat.seconds / 60)}m
                        </Badge>
                      ))}
                    </div>

                    {/* Delta and flags */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1 text-xs">
                        {rep.deltaVsYesterday > 0 ? (
                          <TrendingUp className="h-3 w-3 text-emerald-400" />
                        ) : rep.deltaVsYesterday < 0 ? (
                          <TrendingDown className="h-3 w-3 text-red-400" />
                        ) : null}
                        <span className={rep.deltaVsYesterday >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {rep.deltaVsYesterday > 0 ? '+' : ''}{rep.deltaVsYesterday} vs yesterday
                        </span>
                      </div>
                      {/* Flags badge - placeholder for now */}
                      <div className="text-xs text-white/60">
                        {rep.status === 'online' && (
                          <Radio className="h-3 w-3 inline text-emerald-400" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Team leaderboard table */}
        <Card className="mb-8 bg-white/[0.04] backdrop-blur-sm border border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-emerald-400" />
              Team Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead>Rep</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Active Today</TableHead>
                    <TableHead className="text-right">Longest Block</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reps.map((rep) => {
                    const scoreColor =
                      rep.todayScore >= 75
                        ? 'text-emerald-400'
                        : rep.todayScore >= 50
                          ? 'text-orange-400'
                          : 'text-red-400'
                    return (
                      <TableRow
                        key={rep.id}
                        className="border-white/10 hover:bg-white/[0.05] cursor-pointer transition-colors"
                        onClick={() => {}}
                      >
                        <TableCell>
                          <Link href={`/dashboard/rep/${rep.id}`} className="hover:underline">
                            {rep.name}
                          </Link>
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${scoreColor}`}>
                          {rep.todayScore}
                        </TableCell>
                        <TableCell className="text-right text-white/80">{fmtTime(rep.totalActiveSecs)}</TableCell>
                        <TableCell className="text-right text-white/80">{rep.longestBlockMinsToday}m</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              rep.status === 'online'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : rep.status === 'passive'
                                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                                  : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
                            }
                          >
                            {rep.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Team activity breakdown & heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activity breakdown */}
          <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
            <CardHeader>
              <CardTitle className="text-base">Team Activity Breakdown</CardTitle>
              <CardDescription>Time distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.entries(teamTotals.byCategory || {}).map(([k, v]) => ({
                      name: k,
                      value: Math.floor(v / 60),
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}m`}
                    outerRadius={80}
                    fill="#10B981"
                    dataKey="value"
                  >
                    {Object.entries(teamTotals.byCategory || {}).map((_, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS_MULTI[idx % COLORS_MULTI.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}m`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Team stats */}
          <div className="space-y-4">
            <Card className="bg-white/[0.04] backdrop-blur-sm border border-white/10">
              <CardHeader>
                <CardTitle className="text-base">Team Totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Total active time</span>
                  <span className="font-semibold text-emerald-400">{fmtTime(teamTotals.totalActiveSecs || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Keystrokes</span>
                  <span className="font-semibold text-white">{teamTotals.totalKeystrokes || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Reps online</span>
                  <span className="font-semibold text-emerald-400">{teamTotals.onlineCount || 0} / {reps.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
