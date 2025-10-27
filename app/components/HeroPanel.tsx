import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
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
  Cell
} from 'recharts';
import { getDashboardStats, getApplicationsByMonth, getStatusDistribution } from "../data/mockData";

export function HeroPanel() {
  const stats = getDashboardStats();
  const monthlyData = getApplicationsByMonth();
  const statusData = getStatusDistribution();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Stats Card */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Job Search Overview</CardTitle>
          <CardDescription>Your application performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Response Rate</span>
              <span className="text-sm text-muted-foreground">{stats.responseRate}%</span>
            </div>
            <Progress value={stats.responseRate} className="h-2" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Success Rate</span>
              <span className="text-sm text-muted-foreground">{stats.successRate}%</span>
            </div>
            <Progress value={stats.successRate} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.interviews}</div>
              <div className="text-xs text-muted-foreground">Active Interviews</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.offers}</div>
              <div className="text-xs text-muted-foreground">Job Offers</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Timeline */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Applications Timeline</CardTitle>
          <CardDescription>Monthly application activity</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip />
              <Bar 
                dataKey="applications" 
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
          <CardDescription>Current status distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} applications`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {statusData.map((entry, index) => (
              <div key={entry.status} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">
                  {entry.status} ({entry.count})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}