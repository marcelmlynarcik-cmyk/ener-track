'use client'

import React, { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getElectricityConsumptionChartData } from '@/app/electricity/actions'

interface ConsumptionChartProps {
  meterId: string;
}

interface ConsumptionData {
  date: string;
  consumption: number;
  cumulativeConsumption: number;
}

export function ConsumptionChart({ meterId }: ConsumptionChartProps) {
  const [data, setData] = useState<ConsumptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchConsumptionData() {
      try {
        setLoading(true)
        const consumption = await getElectricityConsumptionChartData(meterId)
        setData(consumption)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (meterId) {
      fetchConsumptionData()
    }
  }, [meterId])

  if (loading) {
    return <div className="text-center py-4">Načítavam dáta o spotrebe...</div>
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Chyba pri načítaní dát: {error}</div>
  }

  if (data.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">Nedostatok dát na zobrazenie grafu spotreby (potrebné aspoň 2 odpočty).</div>
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="consumption" stroke="#8884d8" activeDot={{ r: 8 }} name="Denná spotreba (kWh)" />
          <Line type="monotone" dataKey="cumulativeConsumption" stroke="#82ca9d" name="Kumulatívna spotreba (kWh)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
