"use client"

import { useEffect, useActionState } from "react"
import { toast } from "sonner"
import { addElectricityMeter } from "@/app/electricity/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

const initialState = {
  error: "",
  success: undefined,
}

export function AddMeterForm() {
  const [state, formAction] = useActionState(addElectricityMeter, initialState)

  useEffect(() => {
    if (state.success) {
      toast.success("Elektromer bol úspešne pridaný!")
    } else if (state.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Názov merača</Label>
            <Input
              id="name"
              name="name"
              placeholder="napr. Hlavný merač"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installation_date">Dátum inštalácie</Label>
            <Input id="installation_date" name="installation_date" type="date" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initial_value">Počiatočná hodnota (kWh)</Label>
            <Input
              id="initial_value"
              name="initial_value"
              type="number"
              step="0.01"
              placeholder="napr. 12345.67"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Pridať merač
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

