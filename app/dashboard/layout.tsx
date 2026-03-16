import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

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
      <SidebarInset>
        <DashboardHeader user={user} />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
