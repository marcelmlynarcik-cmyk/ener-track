// src/app/electricity/actions.ts
'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

// Helper to find a reading closest to a target date within a given tolerance (e.g., a few days)
function findReadingClosestToDate(readings: any[], targetDate: Date, toleranceDays: number = 5): any | null {
  const targetTime = targetDate.getTime();
  let closestReading = null;
  let minDiff = Infinity;

  for (const reading of readings) {
    const readingDate = new Date(reading.reading_date);
    const diff = Math.abs(readingDate.getTime() - targetTime);

    if (diff <= toleranceDays * 24 * 60 * 60 * 1000) {
      if (diff < minDiff) {
        minDiff = diff;
        closestReading = reading;
      }
    }
  }
  return closestReading;
}

// Helper to find the reading immediately before a specific date for a given meter
function findReadingImmediatelyBefore(readings: any[], date: Date): any | null {
  let previousReading = null;
  const targetTime = date.getTime();

  for (const reading of readings) {
    const readingDate = new Date(reading.reading_date);
    if (readingDate.getTime() < targetTime) {
      previousReading = reading;
    } else {
      break;
    }
  }
  return previousReading;
}

export async function addElectricityMeter(previousState: any, formData: FormData) {
  const supabase = getSupabaseServerClient()

  const name = formData.get('name') as string
  const installation_date = formData.get('installation_date') as string
  const initial_value = parseFloat(formData.get('initial_value') as string)

  if (!name || !installation_date || isNaN(initial_value)) {
    return { error: 'Všetky polia sú povinné.', success: false }
  }

  const { error } = await supabase.from('electricity_meters').insert({
    name,
    installation_date,
    initial_value,
  })

  if (error) {
    console.error('Chyba pri pridávaní elektromera:', error)
    if (error.code === '42501') {
      return {
        error:
          'Chyba pri pridávaní elektromera: Operácia porušila bezpečnostné pravidlá databázy. Skontrolujte politiky RLS (Row Level Security).',
        success: false
      }
    }
    return { error: `Chyba pri pridávaní elektromera: ${error.message}`, success: false }
  }

  revalidatePath('/electricity')
  return { success: true, error: "" }
}

export async function getProcessedElectricityReadings() {
  const supabase = getSupabaseServerClient();
  const [meters, allReadingsResult] = await Promise.all([
    getElectricityMeters(),
    supabase.from('electricity_readings').select('*').order('reading_date', { ascending: true })
  ]);

  if (allReadingsResult.error) {
    console.error('Chyba pri načítaní všetkých odpočtov elektriny:', allReadingsResult.error.message);
    throw new Error(`Nepodarilo sa načítať všetky odpočty elektriny: ${allReadingsResult.error.message}`);
  }

  const meterMap = new Map(meters.map(meter => [meter.id, meter.name]));
  const processedReadings: any[] = [];
  const readingsByMeter: { [meterId: string]: any[] } = {};

  allReadingsResult.data.forEach(reading => {
    if (!readingsByMeter[reading.meter_id]) {
      readingsByMeter[reading.meter_id] = [];
    }
    readingsByMeter[reading.meter_id].push(reading);
  });

  for (const meterId in readingsByMeter) {
    const meterReadings = readingsByMeter[meterId]; // Already sorted ascending by date
    for (let i = 0; i < meterReadings.length; i++) {
      const currentReading = meterReadings[i];
      const previousReading = i > 0 ? meterReadings[i - 1] : null;

      const consumptionCurrent = previousReading
        ? currentReading.value - previousReading.value
        : 0;

      let comparisonResult = null;
      // Find reading from same month in previous year
      if (previousReading) {
        const currentDate = new Date(currentReading.reading_date);
        const targetDateLastYear = new Date(currentDate);
        targetDateLastYear.setFullYear(currentDate.getFullYear() - 1);

        const R2_last_year = findReadingClosestToDate(meterReadings, targetDateLastYear, 10);

        if (R2_last_year) {
            const R1_last_year = findReadingImmediatelyBefore(meterReadings, new Date(R2_last_year.reading_date));

            if (R1_last_year) {
                const consumptionLastYear = R2_last_year.value - R1_last_year.value;

                if (consumptionLastYear !== 0) {
                    const diff = consumptionCurrent - consumptionLastYear;
                    const percentageDiff = (diff / consumptionLastYear) * 100;

                    comparisonResult = {
                        percentage: parseFloat(percentageDiff.toFixed(1)),
                        icon: percentageDiff > 0 ? 'up' : (percentageDiff < 0 ? 'down' : null),
                    };
                }
            }
        }
      }

      processedReadings.push({
        ...currentReading,
        meter_name: meterMap.get(currentReading.meter_id) || 'Neznámy merač',
        difference: consumptionCurrent,
        comparison: comparisonResult,
      });
    }
  }

  // Sort all processed readings by date descending for display
  processedReadings.sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime());

  return processedReadings;
}

export async function getLatestReadingForMeter(meterId: string) {
  if (!meterId) {
    console.error('Chyba pri načítaní posledného odpočtu pre merač: meterId nie je definované');
    return null;
  }
  const supabase = getSupabaseServerClient();

  const { data: reading, error } = await supabase
    .from('electricity_readings')
    .select('value, reading_date')
    .eq('meter_id', meterId)
    .order('reading_date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error(`Chyba pri načítaní posledného odpočtu pre merač ${meterId}:`, error.message);
    return null;
  }

  return reading;
}

export async function getElectricityReadingsForMeter(meterId: string) {
  if (!meterId) {
    console.error('Chyba pri načítaní odpočtov elektriny pre merač: meterId nie je definované');
    return [];
  }
  const supabase = getSupabaseServerClient();

  const { data: readings, error } = await supabase
    .from('electricity_readings')
    .select('*')
    .eq('meter_id', meterId)
    .order('reading_date', { ascending: false });

  if (error) {
    console.error('Chyba pri načítaní odpočtov elektriny pre merač:', error.message);
    throw new Error(`Nepodarilo sa načítať odpočty elektriny pre merač: ${error.message}`);
  }

  return readings;
}

export async function getElectricityMeters() {
  const supabase = getSupabaseServerClient();

  const { data: meters, error } = await supabase
    .from('electricity_meters')
    .select('*')
    .order('installation_date', { ascending: true });

  if (error) {
    console.error('Chyba pri načítaní elektromerov:', error.message);
    throw new Error(`Nepodarilo sa načítať elektromery: ${error.message}`);
  }

  return meters;
}

export async function getElectricityMeter(meterId: string) {
  if (!meterId) {
    console.error('Chyba pri načítaní elektromera: meterId nie je definované');
    return null;
  }
  const supabase = getSupabaseServerClient();

  const { data: meter, error } = await supabase
    .from('electricity_meters')
    .select('*')
    .eq('id', meterId)
    .single();

  if (error) {
    console.error('Chyba pri načítaní elektromera:', error.message);
    return null;
  }

  return meter;
}

export async function getElectricityReading(readingId: string) {
  if (!readingId) {
    return null;
  }
  const supabase = getSupabaseServerClient();
  const { data: reading, error } = await supabase
    .from('electricity_readings')
    .select('*')
    .eq('id', readingId)
    .single();

  if (error) {
    console.error('Chyba pri načítaní odpočtu elektriny:', error.message);
    return null;
  }

  return reading;
}

export async function addElectricityReading(previousState: any, formData: FormData) {
  const supabase = getSupabaseServerClient();

  const meter_id = formData.get('meter_id') as string;
  const reading_date = formData.get('reading_date') as string;
  const value = parseFloat(formData.get('value') as string);

  if (!meter_id || !reading_date || isNaN(value)) {
    return { error: 'Všetky polia sú povinné.', success: false };
  }

  const { error } = await supabase.from('electricity_readings').insert({
    meter_id,
    reading_date,
    value,
  });

  if (error) {
    console.error('Chyba pri pridávaní odpočtu elektriny:', error)
    if (error.code === '42501') {
      return {
        error:
          'Chyba pri pridávaní odpočtu elektriny: Operácia porušila bezpečnostné pravidlá databázy. Skontrolujte politiky RLS (Row Level Security).',
        success: false
      }
    }
    return { error: `Chyba pri pridávaní odpočtu elektriny: ${error.message}`, success: false }
  }
  revalidatePath('/electricity');
  revalidatePath(`/electricity/${meter_id}`);
  return { success: true, error: "" };
}

export async function getDashboardConsumptionData(meterId: string) {
    if (!meterId) {
        return {
            consumption: null,
            periodStart: null,
            periodEnd: null,
            comparison: null,
            status: "no_meter_selected"
        };
    }

    const allReadings = await getElectricityReadingsForMeter(meterId);

    if (!allReadings || allReadings.length < 2) {
        return {
            consumption: null,
            periodStart: null,
            periodEnd: null,
            comparison: null,
            status: "not_enough_data"
        };
    }

    const R2 = allReadings[0];
    const R1 = allReadings[1];

    const lastPeriodConsumption = R2.value - R1.value;
    const lastPeriodStartDate = new Date(R1.reading_date);
    const lastPeriodEndDate = new Date(R2.reading_date);

    const R2Date = new Date(R2.reading_date);
    const targetDateR2LastYear = new Date(R2Date);
    targetDateR2LastYear.setFullYear(R2Date.getFullYear() - 1);

    const R2_last_year = findReadingClosestToDate(allReadings, targetDateR2LastYear);

    let comparisonResult = null;
    if (R2_last_year) {
        const R1_last_year = findReadingImmediatelyBefore(allReadings, new Date(R2_last_year.reading_date));

        if (R1_last_year) {
            const lastYearConsumption = R2_last_year.value - R1_last_year.value;

            const diff = lastPeriodConsumption - lastYearConsumption;
            let percentageDiff = 0;
            if (lastYearConsumption !== 0) {
                percentageDiff = (diff / lastYearConsumption) * 100;
            }

            let text = '';
            let icon = null;
            let color = 'text-muted-foreground';

            if (diff > 0) {
                text = `O ${Math.abs(diff).toFixed(0)} kWh viac (↑ ${percentageDiff.toFixed(0)} %) ako ${format(new Date(R2_last_year.reading_date), "MMMM yyyy", { locale: sk })}`;
                icon = 'up';
                color = 'text-red-500';
            } else if (diff < 0) {
                text = `O ${Math.abs(diff).toFixed(0)} kWh menej (↓ ${Math.abs(percentageDiff).toFixed(0)} %) ako ${format(new Date(R2_last_year.reading_date), "MMMM yyyy", { locale: sk })}`;
                icon = 'down';
                color = 'text-green-500';
            } else {
                text = `Rovnaká spotreba ako ${format(new Date(R2_last_year.reading_date), "MMMM yyyy", { locale: sk })}`;
            }

            comparisonResult = {
                value: diff,
                percentage: percentageDiff,
                text: text,
                icon: icon,
                color: color,
            };
        }
    }

    return {
        consumption: lastPeriodConsumption,
        periodStart: lastPeriodStartDate,
        periodEnd: lastPeriodEndDate,
        comparison: comparisonResult,
        status: "success"
    };
}

export async function deleteElectricityReading(readingId: string) {
  if (!readingId) {
    return { error: 'ID odpočtu je neplatné.' };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('electricity_readings')
    .delete()
    .eq('id', readingId);

  if (error) {
    console.error('Chyba pri mazaní odpočtu elektriny:', error);
    return { error: `Chyba pri mazaní odpočtu: ${error.message}` };
  }

  revalidatePath('/electricity');
  return { success: 'Odpočet bol úspešne vymazaný.' };
}

export async function updateElectricityReading(previousState: any, formData: FormData) {
  const supabase = getSupabaseServerClient();

  const readingId = formData.get('readingId') as string;
  const meter_id = formData.get('meter_id') as string;
  const reading_date = formData.get('reading_date') as string;
  const value = parseFloat(formData.get('value') as string);

  if (!readingId || !meter_id || !reading_date || isNaN(value)) {
    return { error: 'Všetky polia sú povinné.', success: false };
  }

  const { error } = await supabase
    .from('electricity_readings')
    .update({
      meter_id,
      reading_date,
      value,
    })
    .eq('id', readingId);

  if (error) {
    console.error('Chyba pri úprave odpočtu elektriny:', error);
    return { error: `Chyba pri úprave odpočtu: ${error.message}`, success: false };
  }

  revalidatePath('/electricity');
  revalidatePath(`/electricity/${meter_id}`); // Also revalidate the meter details page
  revalidatePath(`/electricity/edit-reading/${readingId}`);

  return { success: true, error: "" };
}

export async function getElectricityConsumptionChartData(meterId: string) {
  if (!meterId) {
    return [];
  }

  const readings = await getElectricityReadingsForMeter(meterId); // These are already sorted ascending by date

  if (!readings || readings.length < 2) {
    return [];
  }

  const chartData: { date: string; consumption: number; cumulativeConsumption: number }[] = [];
  let cumulative = 0;

  for (let i = 1; i < readings.length; i++) {
    const previousReading = readings[i - 1];
    const currentReading = readings[i];

    const consumption = currentReading.value - previousReading.value;
    cumulative += consumption;

    chartData.push({
      date: format(new Date(currentReading.reading_date), 'dd.MM.'), // Format date for chart X-axis
      consumption: consumption,
      cumulativeConsumption: cumulative,
    });
  }

  return chartData;
}

export async function getYearlyElectricityConsumptionChartData() {
  const supabase = getSupabaseServerClient();
  const readings = await supabase
    .from('electricity_readings')
    .select('reading_date, value, meter_id')
    .order('reading_date', { ascending: true });

  if (readings.error) {
    console.error('Error fetching readings for yearly consumption:', readings.error.message);
    return [];
  }

  const readingsByMeter: { [meterId: string]: any[] } = {};
  readings.data.forEach(reading => {
    if (!readingsByMeter[reading.meter_id]) {
      readingsByMeter[reading.meter_id] = [];
    }
    readingsByMeter[reading.meter_id].push(reading);
  });

  // Calculate monthly consumption by year and month
  // We need to interpolate or estimate if readings are not exactly on month boundaries
  // For simplicity, we will calculate differences between readings and attribute to the month of the current reading
  const monthlyData: { [year: number]: { [month: number]: number } } = {};

  for (const meterId in readingsByMeter) {
    const meterReadings = readingsByMeter[meterId];
    for (let i = 1; i < meterReadings.length; i++) {
      const prev = meterReadings[i - 1];
      const curr = meterReadings[i];
      const consumption = curr.value - prev.value;
      const date = new Date(curr.reading_date);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11

      if (!monthlyData[year]) monthlyData[year] = {};
      if (!monthlyData[year][month]) monthlyData[year][month] = 0;
      monthlyData[year][month] += consumption;
    }
  }

  return monthlyData;
}

export async function getActiveMeterSummary(meterId: string) {
  const supabase = getSupabaseServerClient();

  const [meterResult, readingsResult] = await Promise.all([
    supabase.from('electricity_meters').select('*').eq('id', meterId).single(),
    supabase.from('electricity_readings').select('*').eq('meter_id', meterId).order('reading_date', { ascending: false })
  ]);

  if (meterResult.error || !meterResult.data) {
    return null;
  }

  const meter = meterResult.data;
  const readings = readingsResult.data || [];

  const latestReading = readings.length > 0 ? readings[0] : null;
  const sparklineData = readings.slice(0, 7).reverse().map((reading, index, array) => {
    if (index === 0) return null;
    const prev = array[index - 1];
    return {
      date: format(new Date(reading.reading_date), 'dd.MM.'),
      value: reading.value - prev.value
    };
  }).filter(Boolean);

  // Calculate average monthly consumption
  let avgMonthlyConsumption = 0;
  if (readings.length >= 2) {
    const totalConsumption = readings[0].value - readings[readings.length - 1].value;
    const firstDate = new Date(readings[readings.length - 1].reading_date);
    const lastDate = new Date(readings[0].reading_date);
    const diffMonths = (lastDate.getFullYear() - firstDate.getFullYear()) * 12 + (lastDate.getMonth() - firstDate.getMonth());
    avgMonthlyConsumption = diffMonths > 0 ? totalConsumption / diffMonths : totalConsumption;
  }

  // Get comparison for last month
  const dashboardData = await getDashboardConsumptionData(meterId);

  return {
    meter,
    latestReading,
    sparklineData,
    avgMonthlyConsumption,
    comparison: dashboardData.comparison
  };
}