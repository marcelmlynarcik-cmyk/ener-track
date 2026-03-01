'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { toast } from 'sonner';
import { addPelletPurchase } from '../actions';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle } from 'lucide-react'; // Icon for adding

interface AddPelletPurchaseFormProps {
  trigger?: React.ReactNode;
}

export function AddPelletPurchaseForm({ trigger }: AddPelletPurchaseFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addPelletPurchase, { success: undefined, message: '' });

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
            <PlusCircle className="w-4 h-4" />
            <span>Pridať nákup peliet</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pridať nový nákup peliet</DialogTitle>
          <DialogDescription>
            Zaznamenajte nový nákup peliet vrátane množstva a ceny.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchase_date" className="text-right">
              Dátum nákupu
            </Label>
            <Input type="date" id="purchase_date" name="purchase_date" required defaultValue={today} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity_kg" className="text-right">
              Množstvo (kg)
            </Label>
            <Input type="number" id="quantity_kg" name="quantity_kg" step="0.01" required min="0.01" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price_per_kg" className="text-right">
              Cena za kg (Kč)
            </Label>
            <Input type="number" id="price_per_kg" name="price_per_kg" step="0.01" required min="0" className="col-span-3" />
          </div>
          <Button type="submit">Pridať nákup</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
