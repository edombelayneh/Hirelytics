import { memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  getDashboardStatsFromList,
  getApplicationsByMonthFromList,
  getStatusDistributionFromList,
  JobApplication,
} from '../data/mockData'
import { CHART_COLORS, chartStyles } from '../utils/chartConfig'

interface HeroPanelProps {
  // Full applications list passed from parent
  applications: JobApplication[]
}
// Memoized to avoid unnecessary recalculations when props don’t change
const HeroPanel = memo(function HeroPanel({ applications }: HeroPanelProps) {
  const stats = getDashboardStatsFromList(applications) // Compute summary stats (response rate, success rate, etc.)
  const monthlyData = getApplicationsByMonthFromList(applications) // Compute monthly timeline data
  const statusData = getStatusDistributionFromList(applications) // Compute status distribution for pie chart

  return (
    // 3-column responsive dashboard layout
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
      {/* Main Stats Card */}
      <Card className='lg:col-span-1'>
        <CardHeader>
          <CardTitle>Job Search Overview</CardTitle>
          <CardDescription>Your application performance metrics</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Response Rate */}
          <div className='space-y-2'>
            {/* Label + percentage */}
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Response Rate</span>
              <span className='text-sm text-muted-foreground'>{stats.responseRate}%</span>
            </div>
            {/* Progress bar visual */}
            <Progress
              value={stats.responseRate}
              className='h-2'
            />
          </div>

          <div className='space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm font-medium'>Success Rate</span>
              <span className='text-sm text-muted-foreground'>{stats.successRate}%</span>
            </div>
            {/* Progress bar visual */}
            <Progress
              value={stats.successRate}
              className='h-2'
            />
          </div>
          {/* Interview + Offer counts */}
          <div className='grid grid-cols-2 gap-4 pt-4'>
            {/* Interviews count */}
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>{stats.interviews}</div>
              <div className='text-xs text-muted-foreground'>Active Interviews</div>
            </div>
            {/* Offers count */}
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>{stats.offers}</div>
              <div className='text-xs text-muted-foreground'>Job Offers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Timeline */}
      <Card className='lg:col-span-1'>
        {/* Timeline header */}
        <CardHeader>
          <CardTitle>Applications Timeline</CardTitle>
          <CardDescription>Monthly application activity</CardDescription>
        </CardHeader>
        {/* Bar chart container */}
        <CardContent>
          <ResponsiveContainer
            width='100%'
            height={200}
          >
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis
                dataKey='month'
                {...chartStyles}
              />
              <YAxis {...chartStyles} />
              <Tooltip />
              <Bar
                dataKey='applications'
                fill='hsl(var(--chart-1))'
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className='lg:col-span-1'>
        {/* Status header */}
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
          <CardDescription>Current status distribution</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pie chart container */}
          <ResponsiveContainer
            width='100%'
            height={200}
          >
            <PieChart>
              <Pie
                data={statusData}
                cx='50%'
                cy='50%'
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey='count'
              >
                {/* Color each slice using shared palette */}
                {statusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              {/* Tooltip formatting */}
              <Tooltip formatter={(value, name) => [`${value} applications`, name]} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend-style list under the chart */}
          <div className='grid grid-cols-2 gap-2 mt-4'>
            {statusData.map((entry, index) => (
              <div
                key={entry.status}
                className='flex items-center gap-2'
              >
                <div
                  className='w-3 h-3 rounded-full'
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                {/* Status label + count */}
                <span className='text-xs text-muted-foreground'>
                  {entry.status} ({entry.count})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

export default HeroPanel
