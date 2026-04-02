'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { addPelletConsumption } from '../actions';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FlameKindling } from 'lucide-react'; // Icon for adding consumption

interface AddPelletConsumptionFormProps {
  trigger?: React.ReactNode;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Ukladám...' : 'Zaznamenať spotrebu'}
    </Button>
  );
}

export function AddPelletConsumptionForm({ trigger }: AddPelletConsumptionFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addPelletConsumption, { success: null, message: '' } as any);

  useEffect(() => {
    if (state.success === true) {
      toast.success(state.message);
      setOpen(false); // Close dialog on successful update
    } else if (state.success === false) {
      toast.error(state.message);
    }
  }, [state]);

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center space-x-2">
            <FlameKindling className="w-4 h-4" />
            <span>Zaznamenať spotrebu peliet</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Zaznamenať spotrebu peliet</DialogTitle>
          <DialogDescription>
            Zaznamenajte spotrebované množstvo peliet.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="consumption_date" className="text-right">
              Dátum spotreby
            </Label>
            <Input type="date" id="consumption_date" name="consumption_date" required defaultValue={today} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity_kg" className="text-right">
              Množstvo (kg)
            </Label>
            <Input type="number" id="quantity_kg" name="quantity_kg" step="0.01" required min="0.01" className="col-span-3" />
          </div>
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
