'use client';

import { DeletePelletConsumptionButton } from './delete-pellet-consumption-button';
import { EditPelletConsumptionForm } from './edit-pellet-consumption-form';

interface Consumption {
  id: string;
  consumption_date: string;
  quantity_kg: number;
  cost_czk: number;
  average_temperature_celsius: number | null;
  created_at: string;
}

export function PelletConsumptionActions({ consumption }: { consumption: Consumption }) {
  if (!consumption) {
    console.error("PelletConsumptionActions received an undefined or null consumption object.");
    return null;
  }
  return (
    <>
      <EditPelletConsumptionForm consumption={consumption} />
      <DeletePelletConsumptionButton consumptionId={consumption.id} />
    </>
  );
}
