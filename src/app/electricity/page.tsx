
import { getElectricityMeters, getProcessedElectricityReadings } from "@/app/electricity/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { DeleteReadingButton } from "./_components/delete-reading-button";
import { format } from "date-fns";
import { sk } from "date-fns/locale";

export default async function ElectricityPage() {
  const [meters, processedReadings] = await Promise.all([
    getElectricityMeters(),
    getProcessedElectricityReadings(),
  ]);

  const defaultMeterId = meters.length > 0 ? meters[0].id : null;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Elektrina</h1>
        <p className="text-muted-foreground">
          Spravujte svoje elektromery a odpočty.
        </p>
      </header>

      {/* Section for adding new data */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <Link href="/electricity/add-meter" className="flex-1">
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Pridať nový merač
          </Button>
        </Link>
        <Link href="/electricity/add-reading" className="flex-1">
          <Button className="w-full" variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            Pridať nový odpočet
          </Button>
        </Link>
      </div>

      {/* Electricity Meters Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold tracking-tight mb-4">
          Vaše merače
        </h2>
        {meters && meters.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {meters.map((meter) => (
              <Card key={meter.id} className={meter.id === defaultMeterId ? "border-primary shadow-lg" : ""}>
                <CardHeader>
                  <CardTitle>{meter.name} {meter.id === defaultMeterId && "(Aktívny)"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Inštalované:{" "}
                    {format(new Date(meter.installation_date), "PPP", {
                      locale: sk,
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Počiatočná hodnota: {meter.initial_value} kWh
                  </p>
                   <Link href={`/electricity/${meter.id}`} className="text-sm text-blue-500 hover:underline">
                    Zobraziť detaily
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Žiadne merače neboli nájdené.</p>
        )}
      </section>

      {/* Electricity Readings Section */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">
          Všetky odpočty
        </h2>
        {processedReadings && processedReadings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {processedReadings.map((reading) => {
              const comparison = reading.comparison;
              const colorClass = comparison
                ? comparison.colorClass
                : reading.difference > 0
                ? "text-red-500"
                : reading.difference < 0
                ? "text-green-500"
                : "text-muted-foreground";

              return (
                <Card key={reading.id}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {reading.meter_name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground pt-1">
                        {format(new Date(reading.reading_date), "dd. MM. yyyy", {
                          locale: sk,
                        })}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Link href={`/electricity/edit-reading/${reading.id}`}>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DeleteReadingButton readingId={reading.id} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{reading.value} kWh</p>
                    <div className={`mt-2 font-semibold ${colorClass}`}>
                      {comparison?.icon === 'up' && <TrendingUp className="w-5 h-5 inline-block mr-1" />}
                      {comparison?.icon === 'down' && <TrendingDown className="w-5 h-5 inline-block mr-1" />}
                      <span>
                        {reading.difference > 0 ? `+${reading.difference.toFixed(0)}` : reading.difference.toFixed(0)} kWh
                      </span>
                    </div>
                    {comparison && (
                      <p className={`text-xs ${colorClass}`}>
                        ({comparison.text})
                      </p>
                    )}
                    {!comparison && reading.difference !== 0 && (
                      <p className="text-xs text-muted-foreground">
                        (Porovnanie s min. rokom nedostupné.)
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">Žiadne odpočty neboli nájdené.</p>
        )}
      </section>
    </div>
  );
}
