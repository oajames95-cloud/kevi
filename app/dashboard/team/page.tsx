'use client'

import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Rep } from '@/lib/types'
import { formatTimeAgo } from '@/lib/kevi-utils'
import { Users, Plus, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function TeamPage() {
  const { data, isLoading } = useSWR('/api/reps', fetcher)
  const reps: Rep[] = data?.reps || []

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRepName, setNewRepName] = useState('')
  const [newRepEmail, setNewRepEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddRep = async () => {
    if (!newRepName || !newRepEmail) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRepName, email: newRepEmail }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add rep')
      }

      mutate('/api/reps')
      setIsAddDialogOpen(false)
      setNewRepName('')
      setNewRepEmail('')
      toast.success('Rep added successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add rep')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeReps = reps.filter((r) => {
    if (!r.last_seen_at) return false
    const lastSeen = new Date(r.last_seen_at)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    return lastSeen > hourAgo
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage reps and monitor extension status</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rep
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Rep</DialogTitle>
              <DialogDescription>
                Add a new sales rep to your team. They can sign in to the Chrome extension with their email and password.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  placeholder="John Smith"
                  value={newRepName}
                  onChange={(e) => setNewRepName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={newRepEmail}
                  onChange={(e) => setNewRepEmail(e.target.value)}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRep} disabled={isSubmitting || !newRepName || !newRepEmail}>
                {isSubmitting && <Spinner className="mr-2" />}
                Add Rep
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reps</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeReps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Extension Setup</CardTitle>
            <XCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reps.filter((r) => r.last_seen_at).length} / {reps.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rep List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>All reps in your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : reps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-muted-foreground mb-2">No reps yet</p>
              <p className="text-sm text-muted-foreground">Add your first rep to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reps.map((rep) => {
                const initials = rep.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
                
                const isActive = rep.last_seen_at && 
                  new Date(rep.last_seen_at) > new Date(Date.now() - 60 * 60 * 1000)

                return (
                  <div
                    key={rep.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rep.name}</span>
                          {isActive ? (
                            <Badge variant="default" className="bg-emerald-500">Active</Badge>
                          ) : rep.last_seen_at ? (
                            <Badge variant="secondary">Inactive</Badge>
                          ) : (
                            <Badge variant="outline">Setup pending</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{rep.email}</p>
                        {rep.last_seen_at && (
                          <p className="text-xs text-muted-foreground">
                            Last seen: {formatTimeAgo(rep.last_seen_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extension Setup Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Extension Setup</CardTitle>
          <CardDescription>How to connect the Chrome extension</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Have the rep install the KEV.io Chrome extension from the Chrome Web Store</li>
            <li>Open the extension and sign in with their email and password</li>
            <li>The extension will automatically connect and start tracking activity</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
