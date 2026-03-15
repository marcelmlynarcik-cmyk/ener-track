'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PriceEvolutionData {
  date: string;
  price_per_kg: number;
}

export function PelletPriceEvolutionChart({
  data,
}: {
  data: PriceEvolutionData[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Legend />
        <Line type="monotone" dataKey="price_per_kg" name="Cena/kg (Kč)" stroke="#64748b" />
      </LineChart>
    </ResponsiveContainer>
  );
}
