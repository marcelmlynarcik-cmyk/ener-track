import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Plus, TrendingUp, TrendingDown, Gauge, CloudLightning } from "lucide-react";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import {
  getElectricityMeters,
  getLatestReadingForMeter, // Keep for "Posledný odpočet" card
  getDashboardConsumptionData, // New import
} from "@/app/electricity/actions";

export default async function DashboardPage() {
  const meters = await getElectricityMeters();
  const defaultMeter = meters && meters.length > 0 ? meters[0] : null;

  const lastReading = defaultMeter ? await getLatestReadingForMeter(defaultMeter.id) : null;
  const dashboardData = defaultMeter ? await getDashboardConsumptionData(defaultMeter.id) : null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Prehľad</h1>
        <p className="text-muted-foreground">
          Váš osobný prehľad spotreby energie.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/electricity">
        <Card className="hover:border-primary/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-x-2 pb-2">
            <div className="flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Posledný odpočet ({defaultMeter?.name || "N/A"})
              </CardTitle>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {lastReading ? (
              <>
                <div className="text-2xl font-bold">{lastReading.value} kWh</div>
                <p className="text-xs text-muted-foreground">
                  dňa{" "}
                  {format(new Date(lastReading.reading_date), "dd. MM. yyyy", {
                    locale: sk,
                  })}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Zatiaľ neboli zaznamenané žiadne odpočty pre tento merač.
              </p>
            )}
          </CardContent>
        </Card>
        </Link>

        <Link href="/electricity">
        <Card className="hover:border-primary/80 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-x-2 pb-2">
            <div className="flex items-center space-x-2">
              <CloudLightning className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Spotreba za posledné obdobie ({defaultMeter?.name || "N/A"})
              </CardTitle>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dashboardData && dashboardData.status === "success" ? (
              <>
                                 <div className="text-2xl font-bold">{dashboardData.consumption!.toFixed(0)} kWh</div>                <p className="text-xs text-muted-foreground">
                  za obdobie{" "}
                                     {format(new Date(dashboardData.periodStart!), "dd. MM. yyyy", { locale: sk })}
                                    {" – "}
                                    {format(new Date(dashboardData.periodEnd!), "dd. MM. yyyy", { locale: sk })}                </p>
                {dashboardData.comparison && (
                  <p className={`text-xs mt-2 flex items-center ${dashboardData.comparison.color}`}>
                    {dashboardData.comparison.icon === 'up' ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : dashboardData.comparison.icon === 'down' ? (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    ) : null}
                    {dashboardData.comparison.text}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {dashboardData?.status === "no_meter_selected"
                  ? "Vyberte merač pre zobrazenie spotreby."
                  : dashboardData?.status === "not_enough_data"
                  ? "Nedostatok dát pre výpočet spotreby (potrebné sú aspoň 2 odpočty)."
                  : "Nedostatok dát pre výpočet spotreby."}
              </p>
            )}
          </CardContent>
        </Card>
        </Link>
      </div>

      <div className="mt-8">
        <Link href="/electricity/add-reading">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Pridať odpočet
          </Button>
        </Link>
      </div>
    </div>
  );
}
