import {
  getElectricityMeter,
  getElectricityReadingsForMeter,
} from "@/app/electricity/actions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { sk } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";

interface MeterDetailsPageProps {
  params: {
    meterId: string;
  };
}

export default async function MeterDetailsPage({
  params,
}: MeterDetailsPageProps) {
  const { meterId } = await params;

  // Basic UUID validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!meterId || !uuidRegex.test(meterId)) {
    notFound();
  }

  const meter = await getElectricityMeter(meterId);

  if (!meter) {
    notFound();
  }

  const readings = await getElectricityReadingsForMeter(meterId);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{meter.name}</h1>
        <p className="text-muted-foreground">
          Detaily a odpočty pre váš elektromer.
        </p>
      </header>

      <div className="mb-8 flex gap-4">
        <Link href="/electricity">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Späť
          </Button>
        </Link>
        <Link href={`/electricity/add-reading?meter_id=${meter.id}`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Pridať odpočet
          </Button>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Meter Details Section */}
        <section className="lg:col-span-1">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            Detaily merača
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="flex justify-between">
                  <span className="font-medium text-muted-foreground">
                    Dátum inštalácie
                  </span>
                  <span>
                    {format(new Date(meter.installation_date), "PPP", {
                      locale: sk,
                    })}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span className="font-medium text-muted-foreground">
                    Počiatočná hodnota
                  </span>
                  <span>{meter.initial_value} kWh</span>
                </p>
                {meter.removal_date && (
                  <p className="flex justify-between">
                    <span className="font-medium text-muted-foreground">
                      Dátum odstránenia
                    </span>
                    <span>
                      {format(new Date(meter.removal_date), "PPP", {
                        locale: sk,
                      })}
                    </span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Readings Section */}
        <section className="lg:col-span-2">
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            Odpočty
          </h2>
          {readings && readings.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dátum</TableHead>
                    <TableHead className="text-right">Hodnota (kWh)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readings.map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>
                        {format(new Date(reading.reading_date), "PPP", {
                          locale: sk,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {reading.value}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <p className="text-muted-foreground">
              Pre tento merač neboli nájdené žiadne odpočty.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}