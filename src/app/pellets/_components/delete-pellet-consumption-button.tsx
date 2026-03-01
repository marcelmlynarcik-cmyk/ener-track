'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deletePelletConsumption } from '../actions';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export function DeletePelletConsumptionButton({ consumptionId }: { consumptionId: string }) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    const result = await deletePelletConsumption(consumptionId);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Naozaj chcete vymazať tento záznam o spotrebe peliet?</AlertDialogTitle>
          <AlertDialogDescription>
            Táto akcia sa nedá vrátiť späť. Týmto sa natrvalo odstráni tento záznam o spotrebe peliet.
            Upozornenie: odstránenie záznamu o spotrebe peliet NEUPRAVUJE stav zásob peliet.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Zrušiť</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
            Vymazať
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
