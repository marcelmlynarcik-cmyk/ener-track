'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { updatePelletConsumption } from '../actions';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PenSquare } from 'lucide-react';

interface PelletConsumption {
  id: string;
  consumption_date: string;
  quantity_kg: number;
  cost_czk: number;
  average_temperature_celsius: number | null;
  created_at: string;
}

interface EditPelletConsumptionFormProps {
  consumption: PelletConsumption;
}

export function EditPelletConsumptionForm({ consumption }: EditPelletConsumptionFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updatePelletConsumption, { success: null, message: '' } as any);

  useEffect(() => {
    if (state.success === true) {
      toast.success(state.message);
      setOpen(false); // Close dialog on successful update
    } else if (state.success === false) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700">
          <PenSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upraviť záznam o spotrebe peliet</DialogTitle>
          <DialogDescription>
            Vykonajte zmeny v zázname o spotrebe peliet tu. Kliknutím na Uložiť zmeny aktualizujete záznam.
            Upozornenie: zmena záznamu o spotrebe peliet NEUPRAVUJE stav zásob peliet.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={consumption.id} />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="consumption_date" className="text-right">
              Dátum spotreby
            </Label>
            <Input
              id="consumption_date"
              name="consumption_date"
              type="date"
              defaultValue={format(new Date(consumption.consumption_date), 'yyyy-MM-dd')}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity_kg" className="text-right">
              Množstvo (kg)
            </Label>
            <Input
              id="quantity_kg"
              name="quantity_kg"
              type="number"
              step="0.01"
              defaultValue={consumption.quantity_kg}
              className="col-span-3"
              required
              min="0.01"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="average_temperature_celsius" className="text-right">
              Priemerná teplota (°C)
            </Label>
            <Input
              id="average_temperature_celsius"
              name="average_temperature_celsius"
              type="number"
              step="0.1"
              defaultValue={consumption.average_temperature_celsius ?? ''} // Use nullish coalescing for default value
              className="col-span-3"
            />
          </div>
          <Button type="submit">Uložiť zmeny</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
