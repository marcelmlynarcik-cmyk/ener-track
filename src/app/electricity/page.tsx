'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Pencil, 
  Zap, 
  Calendar, 
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  YAxis 
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { DeleteReadingButton } from './_components/delete-reading-button';
import { 
  getElectricityMeters, 
  getActiveMeterSummary, 
  getProcessedElectricityReadings 
} from './actions';

export default function ElectricityPage() {
  const [meters, setMeters] = useState<any[]>([]);
  const [activeSummary, setActiveSummary] = useState<any>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

  useEffect(() => {
    async function fetchData() {
      const allMeters = await getElectricityMeters();
      setMeters(allMeters);
      
      if (allMeters.length > 0) {
        const summary = await getActiveMeterSummary(allMeters[0].id);
        setActiveSummary(summary);
      }
      
      const allReadings = await getProcessedElectricityReadings();
      setReadings(allReadings);
      
      // Expand current year by default
      const currentYear = new Date().getFullYear();
      setExpandedYears({ [currentYear]: true });
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const toggleYear = (year: number) => {
    setExpandedYears(prev => ({
      ...prev,
      [year]: !prev[year]
    }));
  };

  const groupedReadings = readings.reduce((acc: any, reading) => {
    const year = new Date(reading.reading_date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(reading);
    return acc;
  }, {});

  const sortedYears = Object.keys(groupedReadings)
    .map(Number)
    .sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse space-y-8">
        <div className="h-8 w-48 bg-slate-200 rounded"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
        <div className="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Elektrina</h1>
          <p className="text-slate-500">Správa meračov a odpočtov</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/electricity/add-reading">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2.5 h-auto font-medium shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Nový odpočet
            </Button>
          </Link>
          <Link href="/electricity/add-meter">
            <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl px-5 py-2.5 h-auto font-medium shadow-xs">
              <Plus className="w-4 h-4 mr-2" />
              Nový merač
            </Button>
          </Link>
        </div>
      </div>

      {/* SECTION 1 – ACTIVE METER CARD */}
      {activeSummary && (
        <Card className="border-none shadow-sm overflow-hidden bg-white rounded-2xl">
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="col-span-2 p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">{activeSummary.meter.name}</h2>
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Aktívny
                  </Badge>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Posledný odpočet</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900 tracking-tight">
                      {activeSummary.latestReading?.value.toLocaleString()}
                    </span>
                    <span className="text-2xl font-medium text-slate-400">kWh</span>
                  </div>
                  
                  {activeSummary.comparison && (
                    <div className={`flex items-center gap-1.5 text-sm font-bold mt-2 ${activeSummary.comparison.value > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {activeSummary.comparison.value > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{Math.abs(activeSummary.comparison.percentage).toFixed(1)}% vs minulý rok</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Inštalovaný</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {format(new Date(activeSummary.meter.installation_date), 'dd.MM.yyyy')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Počiatočný stav</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {activeSummary.meter.initial_value} kWh
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Activity className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Priemerná mesačná</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      {activeSummary.avgMonthlyConsumption.toFixed(0)} kWh
                    </p>
                  </div>
                </div>
              </div>

              {/* Sparkline Area */}
              <div className="bg-slate-50/50 p-8 flex flex-col justify-center border-l border-slate-50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trend (posl. 6 odpočtov)</span>
                  </div>
                  <div className="h-[120px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={activeSummary.sparklineData}>
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#0f172a" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2 – READINGS HISTORY */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-900 px-1">História odpočtov</h3>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[180px] text-[10px] font-bold uppercase tracking-wider text-slate-400 py-4 px-6">Dátum</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-4 px-6 text-right">Stav (kWh)</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-4 px-6 text-right">Spotreba</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-4 px-6 text-right">Zmena vs rok</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-400 py-4 px-6 text-right">Akcie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedYears.map(year => (
                <React.Fragment key={year}>
                  <TableRow 
                    className="bg-slate-50/30 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => toggleYear(year)}
                  >
                    <TableCell colSpan={5} className="py-3 px-6 font-bold text-slate-900 text-sm">
                      <div className="flex items-center gap-2">
                        {expandedYears[year] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        Rok {year}
                        <Badge variant="outline" className="ml-2 font-normal text-[10px] border-slate-200 text-slate-500 rounded-md bg-white">
                          {groupedReadings[year].length} odpočtov
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {expandedYears[year] && groupedReadings[year].map((reading: any, idx: number) => (
                    <TableRow key={reading.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors odd:bg-white even:bg-slate-50/20">
                      <TableCell className="py-4 px-6 font-medium text-slate-600">
                        {format(new Date(reading.reading_date), 'dd. MMMM yyyy', { locale: sk })}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right font-bold text-slate-900">
                        {reading.value.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        {reading.difference > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs">
                            +{reading.difference.toLocaleString()} kWh
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        {reading.comparison ? (
                          <div className={`flex items-center justify-end gap-1.5 font-bold text-xs ${reading.comparison.icon === 'up' ? 'text-red-600' : 'text-emerald-600'}`}>
                            {reading.comparison.icon === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                            <span>{Math.abs(reading.comparison.percentage).toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/electricity/edit-reading/${reading.id}`}>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-slate-900">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <DeleteReadingButton readingId={reading.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

    </div>
  );
}
