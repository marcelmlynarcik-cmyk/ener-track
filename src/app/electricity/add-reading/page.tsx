// src/app/electricity/add-reading/page.tsx
import { getElectricityMeters } from '@/app/electricity/actions'
import { AddReadingForm } from './_components/add-reading-form'

export default async function AddElectricityReadingPage() {
  const meters = await getElectricityMeters()

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pridať odpočet elektriny</h1>
        <p className="text-muted-foreground">
          Zadajte podrobnosti pre váš nový odpočet.
        </p>
      </header>
      <AddReadingForm meters={meters} />
    </div>
  )
}
