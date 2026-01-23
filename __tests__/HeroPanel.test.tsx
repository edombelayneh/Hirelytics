// __tests__/HeroPanel.test.tsx
// Unit tests for the HeroPanel component
// Purpose: make sure the dashboard renders correctly, uses data helpers properly,
// and safely handles edge cases like empty or extreme data.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type React from 'react'

import HeroPanel from '../app/components/HeroPanel'
import type { JobApplication } from '../app/data/mockData'

/* ---------------------------------------------
   MOCK: data helpers (hoisted)
   These are the functions HeroPanel relies on
   to calculate stats and chart data.
--------------------------------------------- */
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

/* ---------------------------------------------
   MOCK: recharts
   These components normally render SVGs.
   We replace them with simple divs so:
   - tests don’t break in jsdom
   - no React warnings about invalid DOM props
--------------------------------------------- */
type ChildrenProps = {
  children?: React.ReactNode
}

type CellProps = {
  fill?: string
}

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: ChildrenProps) => (
    <div data-testid='responsive-container'>{children}</div>
  ),
  BarChart: ({ children }: ChildrenProps) => <div data-testid='bar-chart'>{children}</div>,
  Bar: () => <div data-testid='bar' />,
  XAxis: () => <div data-testid='x-axis' />,
  YAxis: () => <div data-testid='y-axis' />,
  CartesianGrid: () => <div data-testid='cartesian-grid' />,
  Tooltip: () => <div data-testid='tooltip' />,
  PieChart: ({ children }: ChildrenProps) => <div data-testid='pie-chart'>{children}</div>,
  Pie: ({ children }: ChildrenProps) => <div data-testid='pie'>{children}</div>,
  Cell: ({ fill }: CellProps) => (
    <div
      data-testid='cell'
      data-fill={fill ?? ''}
    />
  ),
}))

/* ---------------------------------------------
   MOCK: chart config
   Just providing predictable colors + styles
--------------------------------------------- */
vi.mock('../app/utils/chartConfig', () => ({
  CHART_COLORS: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
  chartStyles: { fontSize: 12, fill: '#666' },
}))

/* ---------------------------------------------
   MOCK: UI components
   We don’t test shadcn/ui here, only that
   HeroPanel uses them correctly.
--------------------------------------------- */
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

/* ---------------------------------------------
   TEST SUITE: HeroPanel
--------------------------------------------- */
describe('HeroPanel', () => {
  // Minimal application data used across tests
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

  // Default stats returned by helper mocks
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

  // Reset mocks before every test so nothing leaks
  beforeEach(() => {
    vi.clearAllMocks()
    helpers.getDashboardStatsFromList.mockReturnValue(standardStats)
    helpers.getApplicationsByMonthFromList.mockReturnValue(standardMonthlyData)
    helpers.getStatusDistributionFromList.mockReturnValue(standardStatusData)
  })

  afterEach(() => {
    cleanup()
  })

  // Verifies that the three main dashboard sections render
  it('renders main section titles', () => {
    render(<HeroPanel applications={mockApplications} />)

    expect(screen.getByText('Job Search Overview')).toBeTruthy()
    expect(screen.getByText('Applications Timeline')).toBeTruthy()
    expect(screen.getByText('Application Status')).toBeTruthy()
  })

  // Confirms descriptive text is shown for each section
  it('renders section descriptions', () => {
    render(<HeroPanel applications={mockApplications} />)

    expect(screen.getByText('Your application performance metrics')).toBeTruthy()
    expect(screen.getByText('Monthly application activity')).toBeTruthy()
    expect(screen.getByText('Current status distribution')).toBeTruthy()
  })

  // Makes sure the numeric stats are displayed correctly
  it('renders stat numbers correctly', () => {
    render(<HeroPanel applications={mockApplications} />)

    expect(screen.getByText('75%')).toBeTruthy()
    expect(screen.getByText('25%')).toBeTruthy()
    expect(screen.getByText('3')).toBeTruthy()
    expect(screen.getByText('1')).toBeTruthy()
  })

  // Ensures HeroPanel actually uses the helper functions
  it('calls helper functions with correct applications', () => {
    render(<HeroPanel applications={mockApplications} />)

    expect(helpers.getDashboardStatsFromList).toHaveBeenCalledWith(mockApplications)
    expect(helpers.getApplicationsByMonthFromList).toHaveBeenCalledWith(mockApplications)
    expect(helpers.getStatusDistributionFromList).toHaveBeenCalledWith(mockApplications)
  })

  // Confirms progress bars receive the correct values
  it('renders progress bars with correct stat values', () => {
    render(<HeroPanel applications={mockApplications} />)

    const bars = screen.getAllByTestId('progress')
    expect(bars[0].getAttribute('data-value')).toBe('75')
    expect(bars[1].getAttribute('data-value')).toBe('25')
  })

  // Checks that both chart sections render containers
  it('renders chart containers', () => {
    render(<HeroPanel applications={mockApplications} />)

    const containers = screen.getAllByTestId('responsive-container')
    expect(containers.length).toBe(2)
  })

  // Verifies the component doesn’t crash when there’s no data
  it('handles empty applications array safely', () => {
    helpers.getDashboardStatsFromList.mockReturnValue({
      responseRate: 0,
      successRate: 0,
      interviews: 0,
      offers: 0,
    })
    helpers.getApplicationsByMonthFromList.mockReturnValue([])
    helpers.getStatusDistributionFromList.mockReturnValue([])

    render(<HeroPanel applications={[]} />)

    expect(screen.getByText('Job Search Overview')).toBeTruthy()
    expect(screen.getAllByText('0%').length).toBe(2)

    const bars = screen.getAllByTestId('progress')
    expect(bars[0].getAttribute('data-value')).toBe('0')
    expect(bars[1].getAttribute('data-value')).toBe('0')
  })

  // Tests extreme values to ensure nothing breaks visually
  it('handles extreme stat values correctly', () => {
    helpers.getDashboardStatsFromList.mockReturnValue({
      responseRate: 100,
      successRate: 100,
      interviews: 999,
      offers: 999,
    })

    render(<HeroPanel applications={mockApplications} />)

    const bars = screen.getAllByTestId('progress')
    expect(bars[0].getAttribute('data-value')).toBe('100')
    expect(bars[1].getAttribute('data-value')).toBe('100')

    expect(screen.getAllByText('100%').length).toBe(2)
    expect(screen.getAllByText('999').length).toBeGreaterThanOrEqual(2)
  })

  // Snapshot to catch unexpected layout or markup changes
  it('matches snapshot with normal data', () => {
    const { container } = render(<HeroPanel applications={mockApplications} />)
    expect(container.firstChild).toMatchSnapshot()
  })

  // Snapshot for empty-state layout
  it('matches snapshot with empty data', () => {
    helpers.getDashboardStatsFromList.mockReturnValue({
      responseRate: 0,
      successRate: 0,
      interviews: 0,
      offers: 0,
    })
    helpers.getApplicationsByMonthFromList.mockReturnValue([])
    helpers.getStatusDistributionFromList.mockReturnValue([])

    const { container } = render(<HeroPanel applications={[]} />)
    expect(container.firstChild).toMatchSnapshot()
  })
})
