// app/electricity/edit-reading/[readingId]/page.tsx
import { getElectricityMeters, getElectricityReading } from "@/app/electricity/actions";
import { EditReadingForm } from "./_components/edit-reading-form";
import { notFound } from "next/navigation";

interface EditReadingPageProps {
  params: {
    readingId: string;
  };
}

export default async function EditElectricityReadingPage({ params }: EditReadingPageProps) {
  const { readingId } = await params;
  const [reading, meters] = await Promise.all([
    getElectricityReading(readingId),
    getElectricityMeters(),
  ]);

  if (!reading) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upraviť odpočet elektriny</h1>
        <p className="text-muted-foreground">
          Zmeňte podrobnosti pre váš odpočet.
        </p>
      </header>
      <EditReadingForm reading={reading} meters={meters} />
    </div>
  );
}
