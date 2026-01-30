'use client';

import { useEffect } from 'react';
import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateElectricityReading } from '@/app/electricity/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

// Define types locally for the form component
type ElectricityMeter = {
  id: string;
  name: string;
};

type Reading = {
  id: string;
  meter_id: string;
  reading_date: string;
  value: number;
};

interface EditReadingFormProps {
  reading: Reading;
  meters: ElectricityMeter[];
}

const initialState = {
  error: "",
  success: undefined,
};


export function EditReadingForm({ reading, meters }: EditReadingFormProps) {
  const [state, formAction] = useActionState(updateElectricityReading, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast.success('Odpočet elektriny bol úspešne upravený!');
      router.push('/electricity');
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="readingId" value={reading.id} />
          <div className="space-y-2">
            <Label htmlFor="meter_id">Merač</Label>
            <Select name="meter_id" defaultValue={reading.meter_id}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte merač" />
              </SelectTrigger>
              <SelectContent>
                {meters.map((meter) => (
                  <SelectItem key={meter.id} value={meter.id}>
                    {meter.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reading_date">Dátum odpočtu</Label>
            <Input
              id="reading_date"
              name="reading_date"
              type="date"
              defaultValue={format(new Date(reading.reading_date), 'yyyy-MM-dd')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Hodnota odpočtu (kWh)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              step="0.01"
              defaultValue={reading.value}
              placeholder="napr. 12345.67"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Uložiť zmeny
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
