import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, TrendingUp, Target, Users, ArrowRight } from 'lucide-react'

const dashboardCards = [
  {
    title: 'Productivity',
    description: 'Track time spent across tools and activities',
    icon: Activity,
    href: '/dashboard/productivity/team',
    color: 'bg-emerald-500',
  },
  {
    title: 'Performance',
    description: 'Monitor meetings, deals, and pipeline metrics',
    icon: TrendingUp,
    href: '/dashboard/performance/team',
    color: 'bg-blue-500',
  },
  {
    title: 'Conversion',
    description: 'Analyze activity-to-outcome efficiency',
    icon: Target,
    href: '/dashboard/conversion/team',
    color: 'bg-amber-500',
  },
  {
    title: 'Team',
    description: 'Manage reps and view extension status',
    icon: Users,
    href: '/dashboard/team',
    color: 'bg-emerald-600',
  },
]

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground mt-1">
          Here{"'"}s an overview of your sales intelligence dashboard
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {dashboardCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="group transition-all hover:shadow-md hover:border-primary/50">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </CardHeader>
              <CardContent>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-serif font-semibold mb-4">Getting Started</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Install Extension</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Have your reps install the Kevi.io Chrome extension to start tracking activity automatically.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Connect CRM</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Link your HubSpot or Salesforce account to sync meetings, deals, and pipeline data.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. View Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Explore the dashboards to see productivity trends, performance metrics, and coaching opportunities.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
