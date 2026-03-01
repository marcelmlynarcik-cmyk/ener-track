'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface StockLevelData {
  date: string;
  stock_level: number;
}

export function PelletStockLevelChart({
  data,
}: {
  data: StockLevelData[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Area type="monotone" dataKey="stock_level" stroke="#64748b" fill="#64748b" name="Zásoby (kg)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
