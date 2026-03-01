'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Zap, Package, Tag } from 'lucide-react';
import { getYearlyElectricityConsumptionChartData } from '@/app/electricity/actions';
import { getYearlyPelletConsumptionChartData, getPelletPriceEvolutionChartData } from '@/app/pellets/actions';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Máj', 'Jún',
  'Júl', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
];

type ViewMode = 'monthly' | 'cumulative';

export default function StatisticsPage() {
  const [electricityData, setElectricityData] = useState<any>({});
  const [pelletData, setPelletData] = useState<any>({});
  const [priceData, setPriceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [elecMode, setElecMode] = useState<ViewMode>('monthly');
  const [pelletMode, setPelletMode] = useState<ViewMode>('monthly');

  const currentYear = new Date().getFullYear();
  const [yearA, setYearA] = useState(currentYear.toString());
  const [yearB, setYearB] = useState((currentYear - 1).toString());

  useEffect(() => {
    async function fetchData() {
      const [elec, pell, price] = await Promise.all([
        getYearlyElectricityConsumptionChartData(),
        getYearlyPelletConsumptionChartData(),
        getPelletPriceEvolutionChartData(),
      ]);
      setElectricityData(elec);
      setPelletData(pell);
      setPriceData(price);
      setLoading(false);
    }
    fetchData();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    Object.keys(electricityData).forEach(y => years.add(parseInt(y)));
    Object.keys(pelletData).forEach(y => years.add(parseInt(y)));
    priceData.forEach(p => {
      const year = parseInt(p.date.split('.')[2]);
      if (!isNaN(year)) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [electricityData, pelletData, priceData]);

  // Helper to process chart data based on mode (monthly/cumulative)
  const processData = (rawData: any, yA: string, yB: string, mode: ViewMode) => {
    let accA = 0;
    let accB = 0;
    return MONTHS.map((month, index) => {
      const valA = rawData[yA]?.[index] || 0;
      const valB = rawData[yB]?.[index] || 0;
      accA += valA;
      accB += valB;
      return {
        name: month,
        yearA: mode === 'monthly' ? valA : accA,
        yearB: mode === 'monthly' ? valB : accB,
        hasDataA: rawData[yA]?.[index] !== undefined,
        hasDataB: rawData[yB]?.[index] !== undefined,
      };
    });
  };

  const electricityChartData = useMemo(() => processData(electricityData, yearA, yearB, elecMode), [electricityData, yearA, yearB, elecMode]);
  const pelletChartData = useMemo(() => processData(pelletData, yearA, yearB, pelletMode), [pelletData, yearA, yearB, pelletMode]);

  const priceChartData = useMemo(() => {
    return priceData.map(p => ({
      date: p.date,
      price: p.price_per_kg,
      year: p.date.split('.')[2]
    })).filter(p => p.year === yearA || p.year === yearB);
  }, [priceData, yearA, yearB]);

  const priceDomain = useMemo(() => {
    if (!priceChartData.length) return [0, 10];
    const prices = priceChartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return [Math.max(0, min - 0.5), max + 0.5];
  }, [priceChartData]);

  // Comparison logic: Only compare overlapping months
  const getComparison = (data: any[]) => {
    // Find the last month index that has data for Year A
    const lastMonthA = [...data].reverse().findIndex(d => d.hasDataA && d.yearA > 0);
    const maxIndex = lastMonthA === -1 ? 11 : 11 - lastMonthA;

    // Filter data to only include months up to maxIndex for Year B as well
    const overlappingData = data.slice(0, maxIndex + 1);
    
    // For totals, we use the monthly values to sum up, even if the chart is cumulative
    // However, if the chart is cumulative, the last item in overlappingData ALREADY has the running total
    // But to be safe and consistent with "compare only overlapping", we sum monthly values.
    
    // Wait, if it's monthly mode, sum. If cumulative, last item's value is the sum.
    // Let's just always recalculate from monthly to be 100% sure.
    const totalA = overlappingData.reduce((sum, d) => sum + (d.hasDataA ? d.yearA : 0), 0);
    const totalB = overlappingData.reduce((sum, d) => sum + (d.hasDataB ? d.yearB : 0), 0);

    // If we are in cumulative mode, the total is just the last value.
    // Actually, let's just use the overlapping months logic for the "Summary Metrics"
    return { totalA, totalB, maxIndex };
  };

  const elecSummary = useMemo(() => {
    // We always calculate summary from MONTHLY data to ensure "overlapping months" logic is correct
    const monthlyElec = processData(electricityData, yearA, yearB, 'monthly');
    const { totalA, totalB } = getComparison(monthlyElec);
    const avgA = totalA / 12; // Standard average or should it be / (maxIndex + 1)? User said "Priemerná mesačná", usually / 12.
    const change = totalB !== 0 ? ((totalA - totalB) / totalB) * 100 : 0;
    return { totalA, avgA, change };
  }, [electricityData, yearA, yearB]);

  const pelletSummary = useMemo(() => {
    const monthlyPellet = processData(pelletData, yearA, yearB, 'monthly');
    const { totalA, totalB } = getComparison(monthlyPellet);
    const avgDaily = totalA / 365;
    const change = totalB !== 0 ? ((totalA - totalB) / totalB) * 100 : 0;
    return { totalA, avgDaily, change };
  }, [pelletData, yearA, yearB]);

  const priceSummary = useMemo(() => {
    const yearAEntries = priceChartData.filter(p => p.year === yearA);
    const yearBEntries = priceChartData.filter(p => p.year === yearB);
    const avgA = yearAEntries.length ? yearAEntries.reduce((sum, d) => sum + d.price, 0) / yearAEntries.length : 0;
    const avgB = yearBEntries.length ? yearBEntries.reduce((sum, d) => sum + d.price, 0) / yearBEntries.length : 0;
    const change = avgB !== 0 ? ((avgA - avgB) / avgB) * 100 : 0;
    return { avgA, avgB, change };
  }, [priceChartData, yearA, yearB]);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-8 animate-pulse space-y-8">
      <div className="h-8 w-48 bg-slate-200 rounded"></div>
      <div className="h-64 bg-slate-200 rounded-2xl"></div>
      <div className="h-64 bg-slate-200 rounded-2xl"></div>
    </div>;
  }

  const CustomTooltip = ({ active, payload, label, unit }: any) => {
    if (active && payload && payload.length) {
      const valA = payload[0].value;
      const valB = payload[1]?.value || 0;
      const diff = valA - valB;
      const diffPercent = valB !== 0 ? (diff / valB) * 100 : 0;

      return (
        <div className="bg-white p-4 border-none shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-xl min-w-[180px]">
          <p className="font-bold text-slate-900 mb-3 text-sm">{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].fill }} />
                <span className="text-xs text-slate-500 font-medium">Rok {yearA}</span>
              </div>
              <span className="text-xs font-bold text-slate-900">{valA.toLocaleString()} {unit}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[1]?.fill || '#cbd5e1' }} />
                <span className="text-xs text-slate-400 font-medium">Rok {yearB}</span>
              </div>
              <span className="text-xs font-bold text-slate-400">{valB.toLocaleString()} {unit}</span>
            </div>
            <div className="pt-2 border-t border-slate-50 mt-2">
              <div className={`flex justify-between items-center ${diff >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider">Rozdiel</span>
                <span className="text-xs font-bold">
                  {diff >= 0 ? '+' : ''}{diff.toFixed(1)} {unit} ({diffPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const Toggle = ({ mode, setMode }: { mode: ViewMode, setMode: (m: ViewMode) => void }) => (
    <div className="flex bg-slate-100 p-1 rounded-xl">
      <button 
        onClick={() => setMode('monthly')}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        Mesačne
      </button>
      <button 
        onClick={() => setMode('cumulative')}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${mode === 'cumulative' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
      >
        Kumulatívne
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Štatistiky</h1>
            <p className="text-slate-500">Analýza spotreby a trendov</p>
          </div>

          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Porovnanie rokov</span>
            <div className="flex items-center gap-2">
              <Select value={yearA} onValueChange={setYearA}>
                <SelectTrigger className="w-[110px] h-9 rounded-xl border-slate-200">
                  <SelectValue placeholder="Rok A" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
              <Minus className="w-3 h-3 text-slate-300" />
              <Select value={yearB} onValueChange={setYearB}>
                <SelectTrigger className="w-[110px] h-9 rounded-xl border-slate-200">
                  <SelectValue placeholder="Rok B" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* SECTION 1 – ELEKTRINA */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50 pb-6 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Elektrina – spotreba</CardTitle>
            </div>
            <Toggle mode={elecMode} setMode={setElecMode} />
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[320px] w-full overflow-visible">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={electricityChartData} margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    width={42}
                    tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}
                    tickMargin={6}
                  />
                  <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip unit="kWh" />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <Bar 
                    name={`Rok ${yearA}`} 
                    dataKey="yearA" 
                    fill="#0f172a" 
                    radius={[4, 4, 0, 0]} 
                    barSize={28}
                  />
                  <Bar 
                    name={`Rok ${yearB}`} 
                    dataKey="yearB" 
                    fill="#94a3b8" 
                    radius={[4, 4, 0, 0]} 
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-8 border-t border-slate-50">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Celková spotreba (overlapping)</p>
                <p className="text-2xl font-bold text-slate-900">{elecSummary.totalA.toLocaleString()} <span className="text-sm font-medium text-slate-400">kWh</span></p>
              </div>
              <div className="space-y-1 md:border-x md:border-slate-100 md:px-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priemerná mesačná</p>
                <p className="text-2xl font-bold text-slate-900">{elecSummary.avgA.toFixed(1)} <span className="text-sm font-medium text-slate-400">kWh</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zmena medzi rokmi</p>
                <div className={`flex items-center gap-2 text-2xl font-bold ${elecSummary.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {elecSummary.change <= 0 ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                  {Math.abs(elecSummary.change).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2 – PELETY */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50 pb-6 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Peléty – spotreba</CardTitle>
            </div>
            <Toggle mode={pelletMode} setMode={setPelletMode} />
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[320px] w-full overflow-visible">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pelletChartData} margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    width={42}
                    tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}
                    tickMargin={6}
                  />
                  <Tooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip unit="kg" />} />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: '20px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <Bar 
                    name={`Rok ${yearA}`} 
                    dataKey="yearA" 
                    fill="#059669" 
                    radius={[4, 4, 0, 0]} 
                    barSize={28}
                  />
                  <Bar 
                    name={`Rok ${yearB}`} 
                    dataKey="yearB" 
                    fill="#a7f3d0" 
                    radius={[4, 4, 0, 0]} 
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-8 border-t border-slate-50">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Celková spotreba (overlapping)</p>
                <p className="text-2xl font-bold text-slate-900">{pelletSummary.totalA.toLocaleString()} <span className="text-sm font-medium text-slate-400">kg</span></p>
              </div>
              <div className="space-y-1 md:border-x md:border-slate-100 md:px-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priemerná denná</p>
                <p className="text-2xl font-bold text-slate-900">{pelletSummary.avgDaily.toFixed(1)} <span className="text-sm font-medium text-slate-400">kg</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zmena medzi rokmi</p>
                <div className={`flex items-center gap-2 text-2xl font-bold ${pelletSummary.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {pelletSummary.change <= 0 ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                  {Math.abs(pelletSummary.change).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3 – CENA PELIET */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-50 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Tag className="w-5 h-5 text-slate-600" />
              </div>
              <CardTitle className="text-lg font-semibold text-slate-900">Vývoj ceny peliet</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="h-[320px] w-full overflow-visible">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={priceChartData} margin={{ top: 16, right: 16, left: 12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e2e8f0" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 500}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    width={48}
                    domain={[
                      (dataMin: number) => Math.floor(dataMin - 0.4),
                      (dataMax: number) => Math.ceil(dataMax + 0.4)
                    ]}
                    tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}}
                    tickMargin={6}
                    tickFormatter={(val) => `${val} Kč`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#0f172a' }}
                    dot={{ r: 3, fill: '#0f172a', strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 pt-8 border-t border-slate-50">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priemerná cena (Rok {yearA})</p>
                <p className="text-2xl font-bold text-slate-900">{priceSummary.avgA.toFixed(2)} <span className="text-sm font-medium text-slate-400">Kč/kg</span></p>
              </div>
              <div className="space-y-1 md:border-x md:border-slate-100 md:px-8">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Priemerná cena (Rok {yearB})</p>
                <p className="text-2xl font-bold text-slate-900">{priceSummary.avgB.toFixed(2)} <span className="text-sm font-medium text-slate-400">Kč/kg</span></p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cenová zmena</p>
                <div className={`flex items-center gap-2 text-2xl font-bold ${priceSummary.change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceSummary.change <= 0 ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                  {Math.abs(priceSummary.change).toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
