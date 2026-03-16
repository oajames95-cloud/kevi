'use client'

import { Rep } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface RepSelectorProps {
  reps: Rep[]
  value: string
  onChange: (value: string) => void
}

export function RepSelector({ reps, value, onChange }: RepSelectorProps) {
  const selectedRep = reps.find((r) => r.id === value)
  const initials = selectedRep?.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue>
          {selectedRep ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span>{selectedRep.name}</span>
            </div>
          ) : (
            'Select rep'
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {reps.map((rep) => {
          const repInitials = rep.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
          return (
            <SelectItem key={rep.id} value={rep.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {repInitials}
                  </AvatarFallback>
                </Avatar>
                <span>{rep.name}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
