'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MonthlyConsumptionData {
  monthYear: string;
  quantity_kg: number;
}

export function MonthlyConsumptionChart({
  data,
}: {
  data: MonthlyConsumptionData[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
        <XAxis dataKey="monthYear" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Legend />
        <Bar dataKey="quantity_kg" name="Spotreba (kg)" fill="#64748b" />
      </BarChart>
    </ResponsiveContainer>
  );
}
