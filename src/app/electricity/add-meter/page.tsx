// src/app/electricity/add-meter/page.tsx
import { AddMeterForm } from './_components/add-meter-form'

export default function AddElectricityMeterPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pridať elektromer</h1>
        <p className="text-muted-foreground">
          Zadajte podrobnosti pre váš nový elektromer.
        </p>
      </header>
      <AddMeterForm />
    </div>
  )
}
