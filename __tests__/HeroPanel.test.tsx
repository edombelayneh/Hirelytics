// __tests__/HeroPanel.test.tsx
// Tests for: app/components/HeroPanel.tsx
// Goal: make sure HeroPanel renders correctly,
// uses helper data properly, and does not break
// with empty or extreme values.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type React from 'react'

import HeroPanel from '../app/components/HeroPanel'
import type { JobApplication } from '../app/data/mockData'

/* --------------------------------------------------
   MOCK: dashboard helper functions
   HeroPanel gets all numbers and chart data
   from these helpers. We mock them so we can
   control what they return in each test.
-------------------------------------------------- */
const helpers = vi.hoisted(() => ({
  getDashboardStatsFromList: vi.fn(),
  getApplicationsByMonthFromList: vi.fn(),
  getStatusDistributionFromList: vi.fn(),
}))

vi.mock('../app/data/mockData', () => ({
  getDashboardStatsFromList: helpers.getDashboardStatsFromList,
  getApplicationsByMonthFromList: helpers.getApplicationsByMonthFromList,
  getStatusDistributionFromList: helpers.getStatusDistributionFromList,
}))

/* --------------------------------------------------
   MOCK: recharts
   We do not need real charts in unit tests.
   We replace them with simple divs so:
   - no prop warnings
   - predictable DOM
-------------------------------------------------- */
type ChildrenOnlyProps = { children?: React.ReactNode }

vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: ChildrenOnlyProps) => (
      <div data-testid='responsive-container'>{children}</div>
    ),
    BarChart: ({ children }: ChildrenOnlyProps) => <div data-testid='bar-chart'>{children}</div>,
    CartesianGrid: () => <div data-testid='cartesian-grid' />,
    XAxis: () => <div data-testid='x-axis' />,
    YAxis: () => <div data-testid='y-axis' />,
    Tooltip: () => <div data-testid='tooltip' />,
    Bar: () => <div data-testid='bar' />,
    PieChart: ({ children }: ChildrenOnlyProps) => <div data-testid='pie-chart'>{children}</div>,
    Pie: ({ children }: ChildrenOnlyProps) => <div data-testid='pie'>{children}</div>,
    Cell: ({ fill }: { fill: string }) => (
      <div
        data-testid='cell'
        data-fill={fill}
      />
    ),
    Legend: ({ children }: ChildrenOnlyProps) => <div data-testid='legend'>{children}</div>,
  }
})

/* --------------------------------------------------
   MOCK: chart config
   Just basic values so the component doesn't crash.
-------------------------------------------------- */
vi.mock('../app/utils/chartConfig', () => ({
  CHART_COLORS: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
  chartStyles: { fontSize: 12, fill: '#666' },
}))

/* --------------------------------------------------
   MOCK: UI components (shadcn)
   We only care that they render.
   Replace them with simple wrappers.
-------------------------------------------------- */
type CardProps = {
  children: React.ReactNode
  className?: string
}

type ProgressProps = {
  value: number
  className?: string
}

vi.mock('../app/components/ui/card', () => ({
  Card: ({ children, className }: CardProps) => (
    <div
      data-testid='card'
      className={className}
    >
      {children}
    </div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-header'>{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-title'>{children}</div>
  ),
  CardDescription: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='card-description'>{children}</div>
  ),
  CardContent: ({ children, className }: CardProps) => (
    <div
      data-testid='card-content'
      className={className}
    >
      {children}
    </div>
  ),
}))

vi.mock('../app/components/ui/progress', () => ({
  Progress: ({ value, className }: ProgressProps) => (
    <div
      data-testid='progress'
      data-value={value}
      className={className}
    />
  ),
}))

/* --------------------------------------------------
   TESTS
-------------------------------------------------- */
describe('HeroPanel', () => {
  const mockApplications: JobApplication[] = [
    {
      id: '1',
      company: 'TechCorp',
      country: 'USA',
      city: 'NYC',
      jobLink: 'https://example.com',
      position: 'Engineer',
      applicationDate: '2026-01-01',
      status: 'Applied',
      contactPerson: 'John',
      notes: '',
      jobSource: 'LinkedIn',
      outcome: 'Pending',
    },
  ]

  const standardStats = {
    responseRate: 75,
    successRate: 25,
    interviews: 3,
    offers: 1,
  }

  const standardMonthlyData = [
    { month: 'Jan', applications: 5 },
    { month: 'Feb', applications: 3 },
  ]

  const standardStatusData = [
    { status: 'Applied', count: 5 },
    { status: 'Interview', count: 3 },
    { status: 'Offer', count: 1 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock returns
    helpers.getDashboardStatsFromList.mockReturnValue(standardStats)
    helpers.getApplicationsByMonthFromList.mockReturnValue(standardMonthlyData)
    helpers.getStatusDistributionFromList.mockReturnValue(standardStatusData)
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the main section titles', () => {
    render(<HeroPanel applications={mockApplications} />)

    expect(screen.getByText('Job Search Overview')).toBeTruthy()
    expect(screen.getByText('Applications Timeline')).toBeTruthy()
    expect(screen.getByText('Application Status')).toBeTruthy()
  })

  it('calls the helper functions with the applications prop', () => {
    render(<HeroPanel applications={mockApplications} />)

    expect(helpers.getDashboardStatsFromList).toHaveBeenCalledWith(mockApplications)
    expect(helpers.getApplicationsByMonthFromList).toHaveBeenCalledWith(mockApplications)
    expect(helpers.getStatusDistributionFromList).toHaveBeenCalledWith(mockApplications)
  })

  it('shows the correct rate values and counts', () => {
    render(<HeroPanel applications={mockApplications} />)

    expect(screen.getByText('75%')).toBeTruthy()
    expect(screen.getByText('25%')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
  })

  it('sets progress bars to the same percentage values', () => {
    render(<HeroPanel applications={mockApplications} />)

    const bars = screen.getAllByTestId('progress')
    expect(bars[0].getAttribute('data-value')).toBe('75')
    expect(bars[1].getAttribute('data-value')).toBe('25')
  })

  it('renders the chart containers', () => {
    render(<HeroPanel applications={mockApplications} />)

    expect(screen.getAllByTestId('responsive-container').length).toBe(2)
    expect(screen.getByTestId('bar-chart')).toBeTruthy()
    expect(screen.getByTestId('pie-chart')).toBeTruthy()
  })

  it('does not crash with empty applications', () => {
    helpers.getDashboardStatsFromList.mockReturnValue({
      responseRate: 0,
      successRate: 0,
      interviews: 0,
      offers: 0,
    })
    helpers.getApplicationsByMonthFromList.mockReturnValue([])
    helpers.getStatusDistributionFromList.mockReturnValue([])

    render(<HeroPanel applications={[]} />)

    expect(screen.getAllByText('0%').length).toBe(2)

    const bars = screen.getAllByTestId('progress')
    expect(bars[0].getAttribute('data-value')).toBe('0')
    expect(bars[1].getAttribute('data-value')).toBe('0')
  })

  it('handles extreme values correctly', () => {
    helpers.getDashboardStatsFromList.mockReturnValue({
      responseRate: 100,
      successRate: 100,
      interviews: 999,
      offers: 999,
    })

    render(<HeroPanel applications={mockApplications} />)

    expect(screen.getAllByText('100%').length).toBe(2)
    expect(screen.getAllByText('999').length).toBeGreaterThanOrEqual(2)

    const bars = screen.getAllByTestId('progress')
    expect(bars[0].getAttribute('data-value')).toBe('100')
    expect(bars[1].getAttribute('data-value')).toBe('100')
  })
})
