'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { deleteElectricityReading } from '@/app/electricity/actions';
import { toast } from 'sonner';

interface DeleteReadingButtonProps {
  readingId: string;
}

export function DeleteReadingButton({ readingId }: DeleteReadingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      const result = await deleteElectricityReading(readingId);
      if (result.success) {
        toast.success(result.success);
        setIsOpen(false); // Close the dialog on success
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Naozaj chcete vymazať tento odpočet?</DialogTitle>
          <DialogDescription>
            Táto akcia je trvalá a odpočet nebude možné obnoviť.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Zrušiť</Button>
          </DialogClose>
          <Button onClick={handleDelete} disabled={isPending} variant="destructive">
            {isPending ? 'Mazanie...' : 'Vymazať'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
