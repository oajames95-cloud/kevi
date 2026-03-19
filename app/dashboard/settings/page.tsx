'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import useSWR, { mutate } from 'swr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import type { Rep } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface SalarySaveState {
  [repId: string]: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: user, isLoading } = useSWR('/api/auth/user', fetcher)
  const { data: company } = useSWR('/api/company', fetcher)
  const { data: reps } = useSWR('/api/reps', fetcher)
  const { data: goals } = useSWR('/api/company/goals', fetcher)
  
  const [salaries, setSalaries] = useState<{ [repId: string]: number }>({})
  const [salarySaved, setSalarySaved] = useState<SalarySaveState>({})
  
  const [activeHours, setActiveHours] = useState('6')
  const [prospectingPct, setProspectingPct] = useState('35')
  const [minFocus, setMinFocus] = useState('30')
  const [keystrokeIntensity, setKeystrokeIntensity] = useState('600')
  const [workingDays, setWorkingDays] = useState('22')
  const [saving, setSaving] = useState(false)

  // Initialize salaries when reps load
  const handleSalaryChange = (repId: string, value: string) => {
    setSalaries(prev => ({
      ...prev,
      [repId]: parseInt(value) || 0,
    }))
    // Clear saved confirmation when user edits
    setSalarySaved(prev => ({
      ...prev,
      [repId]: false,
    }))
  }

  const handleSalarySave = useCallback(async (repId: string) => {
    try {
      const response = await fetch(`/api/reps/${repId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          annual_salary_gbp: salaries[repId] || 0,
        }),
      })
      
      if (response.ok) {
        setSalarySaved(prev => ({
          ...prev,
          [repId]: true,
        }))
        // Remove checkmark after 2 seconds
        setTimeout(() => {
          setSalarySaved(prev => ({
            ...prev,
            [repId]: false,
          }))
        }, 2000)
        mutate('/api/reps')
      } else {
        toast.error('Failed to save salary')
      }
    } catch (error) {
      toast.error('Error saving salary')
    }
  }, [salaries])

  const handleSaveGoals = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/company/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeHoursPerDay: parseInt(activeHours),
          prospectingPct: parseInt(prospectingPct),
          minFocusBlockMins: parseInt(minFocus),
          keystrokeIntensityPerHour: parseInt(keystrokeIntensity),
          workingDaysPerMonth: parseInt(workingDays),
        }),
      })
      
      if (response.ok) {
        toast.success('Goals saved successfully')
        mutate('/api/company/goals')
      } else {
        toast.error('Failed to save goals')
      }
    } catch (error) {
      toast.error('Error saving goals')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="flex-1 overflow-auto relative p-8">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-1/3 w-[600px] h-[500px] bg-teal-500/20 rounded-full blur-[130px]" />
        <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] bg-emerald-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        {/* Team Member Salaries */}
        {reps && reps.length > 0 && (
          <Card className="bg-white/[0.04] border-white/10 mb-8">
            <CardHeader>
              <CardTitle>Team Salaries</CardTitle>
              <CardDescription>Set annual salaries for ROI calculations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reps.map((rep: Rep) => (
                  <div key={rep.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{rep.name}</p>
                      <p className="text-xs text-white/60">{rep.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">£</span>
                      <Input
                        type="number"
                        value={salaries[rep.id] ?? rep.annual_salary_gbp ?? 0}
                        onChange={(e) => handleSalaryChange(rep.id, e.target.value)}
                        onBlur={() => handleSalarySave(rep.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSalarySave(rep.id)
                          }
                        }}
                        className="bg-white/5 border-white/10 text-white w-32"
                        placeholder="0"
                      />
                      {salarySaved[rep.id] && (
                        <Check className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Goals */}
        <Card className="bg-white/[0.04] border-white/10">
          <CardHeader>
            <CardTitle>Performance Goals</CardTitle>
            <CardDescription>Set targets for your team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="activeHours" className="text-white/80">
                Target active hours per day
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="activeHours"
                  type="number"
                  value={activeHours}
                  onChange={(e) => setActiveHours(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  min="1"
                  max="8"
                />
                <span className="text-white/60">hours</span>
              </div>
            </div>

            <div>
              <Label htmlFor="prospecting" className="text-white/80">
                Prospecting target percentage
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="prospecting"
                  type="number"
                  value={prospectingPct}
                  onChange={(e) => setProspectingPct(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  min="0"
                  max="100"
                />
                <span className="text-white/60">%</span>
              </div>
            </div>

            <div>
              <Label htmlFor="minFocus" className="text-white/80">
                Minimum focus block duration
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="minFocus"
                  type="number"
                  value={minFocus}
                  onChange={(e) => setMinFocus(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  min="10"
                  max="120"
                />
                <span className="text-white/60">minutes</span>
              </div>
            </div>

            <div>
              <Label htmlFor="keystrokeIntensity" className="text-white/80">
                Keystroke intensity target
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="keystrokeIntensity"
                  type="number"
                  value={keystrokeIntensity}
                  onChange={(e) => setKeystrokeIntensity(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  min="300"
                  max="1000"
                />
                <span className="text-white/60">keystrokes/hour</span>
              </div>
            </div>

            <div>
              <Label htmlFor="workingDays" className="text-white/80">
                Working days per month
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  id="workingDays"
                  type="number"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                  min="15"
                  max="30"
                />
                <span className="text-white/60">days</span>
              </div>
            </div>

            <Button onClick={handleSaveGoals} disabled={saving}>
              {saving ? 'Saving...' : 'Save Goals'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
