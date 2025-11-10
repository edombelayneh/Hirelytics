'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Briefcase, Calendar, TrendingUp, Target, Users, CheckCircle } from 'lucide-react'
import { getDashboardStatsFromList, JobApplication } from '../data/mockData'

interface SummaryCardsProps {
  applications: JobApplication[]
}

export const SummaryCards = memo(function SummaryCards({ applications }: SummaryCardsProps) {
  const stats = getDashboardStatsFromList(applications)

  const cards = [
    {
      title: 'Total Applications',
      value: stats.total,
      icon: Briefcase,
      change: '+2 this week',
      changeType: 'positive' as const,
    },
    {
      title: 'Active Applications',
      value: stats.applied,
      icon: Calendar,
      change: `${stats.applied} pending`,
      changeType: 'neutral' as const,
    },
    {
      title: 'Interviews',
      value: stats.interviews,
      icon: Users,
      change: '+1 this week',
      changeType: 'positive' as const,
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      change: 'Above average',
      changeType: 'positive' as const,
    },
    {
      title: 'Success Rate',
      value: `${stats.successRate}%`,
      icon: Target,
      change: `${stats.offers} offers`,
      changeType: 'positive' as const,
    },
    {
      title: 'Offers Received',
      value: stats.offers,
      icon: CheckCircle,
      change: '1 pending decision',
      changeType: 'neutral' as const,
    },
  ]

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{card.title}</CardTitle>
              <Icon className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{card.value}</div>
              <Badge
  variant={
    card.changeType === 'positive'
      ? 'default'
      : 'secondary'
  }
  className="text-xs mt-1"
>
  {card.change}
</Badge>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
})
