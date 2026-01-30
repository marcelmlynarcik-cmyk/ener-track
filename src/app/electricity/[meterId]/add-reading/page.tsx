// src/app/electricity/[meterId]/add-reading/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { addElectricityReading } from '@/app/electricity/actions'

interface AddReadingPageProps {
  params: {
    meterId: string
  }
}

export default function AddReadingPage({ params }: AddReadingPageProps) {
  const router = useRouter()
  const { meterId } = params

  const [date, setDate] = useState<Date | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    formData.set('meter_id', meterId) // Set meterId from URL params
    if (date) {
      formData.set('reading_date', format(date, 'yyyy-MM-dd'))
    } else {
      setError('Prosím, vyberte dátum odpočtu.')
      setLoading(false)
      return
    }

    const result = await addElectricityReading(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      // On success, navigate back to the electricity meters list
      router.push('/electricity')
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-3xl font-bold mb-6">Pridať Nový Odpočet Elektriny</h1>
      <p className="text-muted-foreground mb-4">Pre merač s ID: {meterId}</p>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="reading_date" className="text-right">
            Dátum Odpočtu
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className={cn(
                  'w-[280px] justify-start text-left font-normal col-span-3',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP', { locale: sk }) : <span>Vyberte dátum</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={sk} // Set locale for calendar
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="value" className="text-right">
            Hodnota Odpočtu (kWh)
          </Label>
          <Input
            id="value"
            name="value"
            type="number"
            step="0.01"
            className="col-span-3"
            required
          />
        </div>
        <div className="col-span-4 flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? 'Ukladám...' : 'Uložiť Odpočet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
