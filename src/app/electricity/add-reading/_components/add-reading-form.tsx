"use client"

import { useEffect, useActionState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addElectricityReading } from "@/app/electricity/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"

type ElectricityMeter = {
  id: string
  name: string
}

interface AddReadingFormProps {
  meters: ElectricityMeter[]
}

const initialState = {
  error: "",
  success: undefined,
}

export function AddReadingForm({ meters }: AddReadingFormProps) {
  const [state, formAction] = useActionState(addElectricityReading, initialState)
  const router = useRouter()

  useEffect(() => {
    if (state.success) {
      toast.success("Odpočet elektriny bol úspešne pridaný!")
      router.push("/electricity")
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state, router])

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="meter_id">Merač</Label>
            <Select name="meter_id">
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
            <Input id="reading_date" name="reading_date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Hodnota odpočtu (kWh)</Label>
            <Input
              id="value"
              name="value"
              type="number"
              step="0.01"
              placeholder="napr. 12345.67"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Pridať odpočet
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
