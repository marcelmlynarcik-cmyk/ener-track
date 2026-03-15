'use client';

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ConsumptionTemperatureData {
  date: string;
  consumption_kg: number;
  average_temperature_celsius: number | null;
}

export function ConsumptionTemperatureChart({
  data,
}: {
  data: ConsumptionTemperatureData[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" orientation="left" stroke="#64748b" tickLine={false} axisLine={false} />
        <YAxis yAxisId="right" orientation="right" stroke="#a3a3a3" tickLine={false} axisLine={false} />
        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
        <Legend />
        <Bar yAxisId="left" dataKey="consumption_kg" name="Spotreba (kg)" fill="#64748b" />
        <Line yAxisId="right" type="monotone" dataKey="average_temperature_celsius" name="Teplota (°C)" stroke="#a3a3a3" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
