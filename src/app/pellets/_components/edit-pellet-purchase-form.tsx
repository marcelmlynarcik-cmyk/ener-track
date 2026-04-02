'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { toast } from 'sonner';
import { updatePelletPurchase } from '../actions';
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

interface PelletPurchase {
  id: string;
  purchase_date: string;
  quantity_kg: number;
  price_per_kg: number;
  created_at: string;
}

interface EditPelletPurchaseFormProps {
  purchase: PelletPurchase;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Ukladám...' : 'Uložiť zmeny'}
    </Button>
  );
}

export function EditPelletPurchaseForm({ purchase }: EditPelletPurchaseFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(updatePelletPurchase, { success: null, message: '' } as any);

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
          <DialogTitle>Upraviť nákup peliet</DialogTitle>
          <DialogDescription>
            Vykonajte zmeny v nákupe peliet tu. Kliknutím na Uložiť zmeny aktualizujete záznam.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4 py-4">
          <input type="hidden" name="id" value={purchase.id} />
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="purchase_date" className="text-right">
              Dátum nákupu
            </Label>
            <Input
              id="purchase_date"
              name="purchase_date"
              type="date"
              defaultValue={format(new Date(purchase.purchase_date), 'yyyy-MM-dd')}
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
              defaultValue={purchase.quantity_kg}
              className="col-span-3"
              required
              min="0.01"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price_per_kg" className="text-right">
              Cena za kg (Kč)
            </Label>
            <Input
              id="price_per_kg"
              name="price_per_kg"
              type="number"
              step="0.01"
              defaultValue={purchase.price_per_kg}
              className="col-span-3"
              required
              min="0"
            />
          </div>
          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}
