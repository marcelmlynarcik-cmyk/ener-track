import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Gauge, CloudLightning, Home, Package, Clock, Zap } from "lucide-react"; // Updated icons
import { format } from "date-fns";
import { sk } from "date-fns/locale";
// Removed KpiCard import as it will be refactored or used differently

import {
  getElectricityMeters,
  getLatestReadingForMeter,
  getDashboardConsumptionData,
} from "@/app/electricity/actions";
import { getPelletOverviewData } from "@/app/pellets/actions";

export default async function DashboardPage() {
  const meters = await getElectricityMeters();
  const defaultMeter = meters && meters.length > 0 ? meters[0] : null;

  const lastReading = defaultMeter ? await getLatestReadingForMeter(defaultMeter.id) : null;
  const dashboardData = defaultMeter ? await getDashboardConsumptionData(defaultMeter.id) : null;
  const { 
    currentStock, 
    estimatedPelletDuration, 
    averageDailyConsumption, 
    lastConsumption 
  } = await getPelletOverviewData();

  const lastUpdateDate = lastConsumption 
    ? format(new Date(lastConsumption.consumption_date), "dd. MM. yyyy", { locale: sk })
    : format(new Date(), "dd. MM. yyyy", { locale: sk });

  const getDurationColor = (days: number | null) => {
    if (days === null) return "text-slate-900";
    if (days >= 14) return "text-emerald-600";
    if (days >= 7) return "text-amber-500";
    return "text-red-600";
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-semibold">Prehľad domácnosti</h1>
          <p className="text-muted-foreground text-slate-500">Energetický a palivový prehľad</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/electricity/add-reading">
            <Button className="bg-slate-900 text-white rounded-xl px-4 py-2 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Nový odpočet
            </Button>
          </Link>
          <Link href="/pellets">
            <Button className="bg-white border border-slate-300 text-slate-700 rounded-xl px-4 py-2 hover:bg-slate-100">
              <Plus className="w-4 h-4 mr-2" />
              Spotreba peliet
            </Button>
          </Link>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1 – ELEKTRINA (Combined card) */}
        <Card className="p-6 border-t-2 border-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm uppercase tracking-wide text-slate-500">ELEKTRINA</p>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Posledný odpočet</p>
              <p className="text-4xl font-bold tracking-tight mt-1">
                {lastReading ? lastReading.value.toString() : "N/A"} kWh
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {lastReading ? `Dátum: ${format(new Date(lastReading.reading_date), "dd. MM. yyyy", { locale: sk })}` : "Zatiaľ neboli zaznamenané žiadne odpočty."}
              </p>
            </div>
            <div className="border-t my-4"></div>
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Spotreba za 30 dní</p>
              <p className="text-4xl font-bold tracking-tight mt-1">
                {dashboardData && dashboardData.status === "success" ? dashboardData.consumption!.toFixed(0) : "N/A"} kWh
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {dashboardData && dashboardData.status === "success" ?
                  `${format(new Date(dashboardData.periodStart!), "dd. MM. yyyy", { locale: sk })} – ${format(new Date(dashboardData.periodEnd!), "dd. MM. yyyy", { locale: sk })}`
                  : "Nedostatok dát."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2 – PELLETY (Combined card: Zásoby + Odhad výdrže) */}
        <Card className="p-6 border-t-2 border-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-0 space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-sm uppercase tracking-wide text-slate-500">PELETY</p>
            </div>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            {/* Stock Section */}
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Aktuálny stav zásob</p>
              <p className="text-4xl font-bold tracking-tight mt-1">
                {currentStock.toFixed(0)} kg
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Posledná aktualizácia: {lastUpdateDate}
              </p>
            </div>
            <div className="border-t my-4"></div> {/* Divider */}
            {/* Estimated Duration Section */}
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">Odhad výdrže</p>
              <p className={`text-4xl font-bold tracking-tight mt-1 ${getDurationColor(estimatedPelletDuration)}`}>
                {estimatedPelletDuration !== null ? `${estimatedPelletDuration.toFixed(0)}` : 'N/A'} dní
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Pri aktuálnom tempe spotreby
              </p>
            </div>
            {/* Actual Average Daily Consumption */}
            <p className="text-xs text-slate-500 mt-4">
              Priemerná denná spotreba: {averageDailyConsumption ? averageDailyConsumption.toFixed(1) : 'N/A'} kg
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Temporary spacing before charts section (will be replaced by actual charts) */}
      <div className="h-4"></div>
    </div>
  );
}
