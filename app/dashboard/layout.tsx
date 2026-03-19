import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { FrostOverlay } from '@/components/dashboard/frost-overlay'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get the user's rep and company info
  const { data: rep } = await supabase
    .from('reps')
    .select('*, companies(*)')
    .eq('email', user.email)
    .single()

  return (
    <SidebarProvider>
      <DashboardSidebar user={user} rep={rep} />
      <FrostOverlay />
      <SidebarInset>
        <DashboardHeader user={user} />
        <div className="flex-1 overflow-auto relative">
          {/* Subtle ambient glow for dashboard */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-[-5%] right-[10%] w-[400px] h-[300px] bg-emerald-600/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] bg-teal-600/8 rounded-full blur-[80px]" />
          </div>
          <div className="relative z-10">
            <Suspense fallback={<div className="p-8">Loading...</div>}>
              {children}
            </Suspense>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
