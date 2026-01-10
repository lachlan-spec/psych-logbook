import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp } from 'lucide-react';

const COLORS = {
  total: '#3b82f6',      // blue
  direct: '#2563eb',     // darker blue  
  supervision: '#14b8a6', // teal
  cpd: '#22c55e',        // green
  peer: '#a855f7',       // purple
};

export default function ProgressChart({ totals, targets }) {
  // Build chart data - only include categories with targets set
  const chartData = [];
  
  if (targets?.total > 0) {
    chartData.push({
      name: 'Total',
      current: totals?.all || 0,
      target: targets.total,
      percentage: ((totals?.all || 0) / targets.total * 100).toFixed(0),
      fill: COLORS.total
    });
  }
  
  if (targets?.practice > 0) {
    chartData.push({
      name: 'Direct Client',
      current: totals?.practice || 0,
      target: targets.practice,
      percentage: ((totals?.practice || 0) / targets.practice * 100).toFixed(0),
      fill: COLORS.direct
    });
  }
  
  if (targets?.supervision > 0) {
    chartData.push({
      name: 'Supervision',
      current: totals?.supervision || 0,
      target: targets.supervision,
      percentage: ((totals?.supervision || 0) / targets.supervision * 100).toFixed(0),
      fill: COLORS.supervision
    });
  }
  
  if (targets?.cpd > 0) {
    chartData.push({
      name: 'CPD',
      current: totals?.cpd || 0,
      target: targets.cpd,
      percentage: ((totals?.cpd || 0) / targets.cpd * 100).toFixed(0),
      fill: COLORS.cpd
    });
  }
  
  if (targets?.peer > 0) {
    chartData.push({
      name: 'Peer',
      current: totals?.peer || 0,
      target: targets.peer,
      percentage: ((totals?.peer || 0) / targets.peer * 100).toFixed(0),
      fill: COLORS.peer
    });
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Progress Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            Set targets in Logbook Settings to see progress chart
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-semibold text-slate-800">{data.name}</p>
          <p className="text-sm text-slate-600">
            Current: <span className="font-medium">{data.current.toFixed(1)}h</span>
          </p>
          <p className="text-sm text-slate-600">
            Target: <span className="font-medium">{data.target.toFixed(1)}h</span>
          </p>
          <p className="text-sm font-semibold text-blue-600">
            {data.percentage}% complete
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          Progress vs Targets
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="current" 
                name="Current Hours"
                radius={[0, 4, 4, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs text-slate-600">
                {item.name}: {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
