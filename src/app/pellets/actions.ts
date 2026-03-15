'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { format, parseISO } from 'date-fns';
import {
  DEFAULT_PELLET_LOCATION,
  PELLET_DAILY_AVERAGE_LOOKBACK_DAYS,
  PELLET_FORECAST_TEMPERATURE_DAYS,
  PELLET_RECENT_TEMPERATURE_WINDOW_DAYS,
  PELLET_TEMPERATURE_MODEL_LOOKBACK_DAYS,
} from '@/lib/pellet-duration';

export async function getPelletPurchases() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('pellet_purchases')
    .select('*')
    .order('purchase_date', { ascending: false });

  if (error) {
    console.error('Error fetching pellet purchases:', error);
    return [];
  }
  return data;
}

export async function addPelletPurchase(
  _prevState: unknown,
  formData: FormData,
) {
  const supabase = getSupabaseServerClient();
  const purchase_date = formData.get('purchase_date') as string;
  const quantity_kg = parseFloat(formData.get('quantity_kg') as string);
  const price_per_kg = parseFloat(formData.get('price_per_kg') as string);

  // Validate input
  if (!purchase_date || isNaN(quantity_kg) || quantity_kg <= 0 || isNaN(price_per_kg) || price_per_kg < 0) {
    return { success: false, message: 'Invalid input for pellet purchase.' };
  }

  const { data: purchaseData, error: purchaseError } = await supabase
    .from('pellet_purchases')
    .insert({ purchase_date, quantity_kg, price_per_kg })
    .select()
    .single();

  if (purchaseError) {
    console.error('Error adding pellet purchase:', purchaseError);
    return { success: false, message: 'Failed to add pellet purchase.' };
  }

  // Add to pellet_stock_batches
  const { error: stockError } = await supabase
    .from('pellet_stock_batches')
    .insert({
      purchase_id: purchaseData.id,
      initial_quantity_kg: quantity_kg,
      remaining_quantity_kg: quantity_kg,
      purchase_price_per_kg: price_per_kg,
      entry_date: purchase_date,
    });

  if (stockError) {
    console.error('Error adding to pellet stock batches:', stockError);
    // If stock update fails, consider rolling back the purchase, or notify for manual correction.
    // For now, we'll just log and return failure for both.
    return { success: false, message: 'Failed to update pellet stock.' };
  }

  revalidatePath('/pellets');
  revalidatePath('/dashboard');
  return { success: true, message: 'Pellet purchase added successfully!' };
}

export async function updatePelletPurchase(
  _prevState: unknown,
  formData: FormData,
) {
  const supabase = getSupabaseServerClient();
  const id = formData.get('id') as string;
  const purchase_date = formData.get('purchase_date') as string;
  const quantity_kg = parseFloat(formData.get('quantity_kg') as string);
  const price_per_kg = parseFloat(formData.get('price_per_kg') as string);

  // Validate input
  if (!id || !purchase_date || isNaN(quantity_kg) || quantity_kg <= 0 || isNaN(price_per_kg) || price_per_kg < 0) {
    return { success: false, message: 'Invalid input for pellet purchase update.' };
  }

  // Start a transaction (Supabase doesn't directly support SQL transactions in client-side actions,
  // but we can simulate atomicity for simple cases or rely on RLS/triggers for complex ones).
  // For now, we'll execute sequentially and handle errors.

  // 1. Update the pellet_purchases entry
  const { error: purchaseUpdateError } = await supabase
    .from('pellet_purchases')
    .update({ purchase_date, quantity_kg, price_per_kg })
    .eq('id', id);

  if (purchaseUpdateError) {
    console.error('Error updating pellet purchase:', purchaseUpdateError);
    return { success: false, message: 'Failed to update pellet purchase.' };
  }

  // 2. Update the corresponding pellet_stock_batches entry
  // This is a simplification. A more robust solution would check if stock has been consumed
  // and adjust remaining_quantity_kg accordingly, or prevent updates that conflict with consumption.
  // For now, we're updating initial quantity and price.
  const { error: stockUpdateError } = await supabase
    .from('pellet_stock_batches')
    .update({
      initial_quantity_kg: quantity_kg,
      remaining_quantity_kg: quantity_kg, // Reset remaining to initial for simplicity, may need more complex logic
      purchase_price_per_kg: price_per_kg,
      entry_date: purchase_date,
    })
    .eq('purchase_id', id);

  if (stockUpdateError) {
    console.error('Error updating pellet stock batch on purchase update:', stockUpdateError);
    // Even if stock update fails, the purchase itself was updated.
    // This highlights the need for robust transaction management for complex operations.
    return { success: false, message: 'Pellet purchase updated, but stock update failed.' };
  }

  revalidatePath('/pellets');
  revalidatePath('/dashboard');
  return { success: true, message: 'Pellet purchase updated successfully!' };
}


export async function deletePelletPurchase(id: string) {
  const supabase = getSupabaseServerClient();

  // Check if any stock from this purchase has been consumed
  const { data: stockBatch, error: stockFetchError } = await supabase
    .from('pellet_stock_batches')
    .select('initial_quantity_kg, remaining_quantity_kg')
    .eq('purchase_id', id)
    .single();

  if (stockFetchError) {
    console.error('Error fetching stock batch for deletion check:', stockFetchError);
    return { success: false, message: 'Failed to check associated stock.' };
  }

  if (stockBatch && stockBatch.initial_quantity_kg !== stockBatch.remaining_quantity_kg) {
    return { success: false, message: 'Cannot delete purchase: some pellets from this batch have already been consumed. Please adjust consumption first.' };
  }

  // Delete the pellet_stock_batches entry first (due to foreign key constraint)
  const { error: stockDeleteError } = await supabase
    .from('pellet_stock_batches')
    .delete()
    .eq('purchase_id', id);

  if (stockDeleteError) {
    console.error('Error deleting pellet stock batch:', stockDeleteError);
    return { success: false, message: 'Failed to delete associated pellet stock.' };
  }

  // Then delete the pellet_purchases entry
  const { error: purchaseDeleteError } = await supabase
    .from('pellet_purchases')
    .delete()
    .eq('id', id);

  if (purchaseDeleteError) {
    console.error('Error deleting pellet purchase:', purchaseDeleteError);
    return { success: false, message: 'Failed to delete pellet purchase.' };
  }

  revalidatePath('/pellets');
  revalidatePath('/dashboard');
  return { success: true, message: 'Pellet purchase deleted successfully!' };
}

export async function getPelletConsumption() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('pellet_consumption')
    .select('*')
    .order('consumption_date', { ascending: false });

  if (error) {
    console.error('Error fetching pellet consumption:', error);
    return [];
  }
  // Ensure cost_czk is always a number
  return data.map(entry => ({
    ...entry,
    cost_czk: entry.cost_czk ?? 0, // Changed from cost_eur to cost_czk
  }));
}

export async function addPelletConsumption(
  _prevState: unknown,
  formData: FormData,
) {
  const supabase = getSupabaseServerClient();
  const consumption_date = formData.get('consumption_date') as string;
  const quantity_kg = parseFloat(formData.get('quantity_kg') as string);
  const average_temperature_celsius = parseFloat(formData.get('average_temperature_celsius') as string);

  // Validate input
  if (!consumption_date || isNaN(quantity_kg) || quantity_kg <= 0 || isNaN(average_temperature_celsius)) {
    return { success: false, message: 'Invalid input for pellet consumption.' };
  }

  let remainingConsumption = quantity_kg;
  let totalCost = 0;

  // Get available stock in FIFO order
  const { data: stockBatches, error: stockBatchesError } = await supabase
    .from('pellet_stock_batches')
    .select('*')
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true }) // Secondary sort for true FIFO
    .gt('remaining_quantity_kg', 0); // Only get batches with remaining stock

  if (stockBatchesError) {
    console.error('Error fetching pellet stock batches:', stockBatchesError);
    return { success: false, message: 'Failed to manage pellet stock.' };
  }
  
  if (!stockBatches || stockBatches.length === 0) {
    return { success: false, message: 'No pellet stock available for consumption.' };
  }

  // Consume from stock batches (FIFO)
  for (const batch of stockBatches) {
    if (remainingConsumption <= 0) break;

    const canConsume = Math.min(remainingConsumption, batch.remaining_quantity_kg);
    totalCost += canConsume * batch.purchase_price_per_kg;
    remainingConsumption -= canConsume;

    const { error: updateError } = await supabase
      .from('pellet_stock_batches')
      .update({ remaining_quantity_kg: batch.remaining_quantity_kg - canConsume })
      .eq('id', batch.id);

    if (updateError) {
      console.error('Error updating pellet stock batch:', updateError);
      return { success: false, message: 'Failed to update pellet stock during consumption.' };
    }
  }

  if (remainingConsumption > 0) {
    return { success: false, message: 'Not enough pellet stock to cover consumption.' };
  }

  // Add consumption entry
  const { error: consumptionError } = await supabase
    .from('pellet_consumption')
    .insert({ consumption_date, quantity_kg, cost_czk: totalCost, average_temperature_celsius }) // Changed cost_eur to cost_czk
    .select();

  if (consumptionError) {
    console.error('Error adding pellet consumption:', consumptionError);
    return { success: false, message: 'Failed to add pellet consumption.' };
  }

  revalidatePath('/pellets');
  revalidatePath('/dashboard');
  return { success: true, message: 'Pellet consumption added successfully!' };
}

export async function updatePelletConsumption(
    _prevState: unknown,
    formData: FormData,
  ) {
    const supabase = getSupabaseServerClient();
    const id = formData.get('id') as string;
    const consumption_date = formData.get('consumption_date') as string;
    const quantity_kg = parseFloat(formData.get('quantity_kg') as string);
    const average_temperature_celsius = parseFloat(formData.get('average_temperature_celsius') as string);
  
    // Validate input
    if (!id || !consumption_date || isNaN(quantity_kg) || quantity_kg <= 0 || isNaN(average_temperature_celsius)) {
      return { success: false, message: 'Invalid input for pellet consumption update.' };
    }
  
    // Update the pellet_consumption entry
    const { error: consumptionUpdateError } = await supabase
      .from('pellet_consumption')
      .update({ consumption_date, quantity_kg, cost_czk: formData.get('cost_czk') as string, average_temperature_celsius }) // Changed cost_eur to cost_czk
      .eq('id', id);
  
    if (consumptionUpdateError) {
      console.error('Error updating pellet consumption:', consumptionUpdateError);
      return { success: false, message: 'Failed to update pellet consumption.' };
    }
  
    revalidatePath('/pellets');
    revalidatePath('/dashboard');
    return { success: true, message: 'Pellet consumption updated successfully!' };
  }

  export async function deletePelletConsumption(id: string) {
    const supabase = getSupabaseServerClient();
  
    // Delete the pellet_consumption entry
    const { error: consumptionDeleteError } = await supabase
      .from('pellet_consumption')
      .delete()
      .eq('id', id);
  
    if (consumptionDeleteError) {
      console.error('Error deleting pellet consumption:', consumptionDeleteError);
      return { success: false, message: 'Failed to delete pellet consumption.' };
    }
  
    revalidatePath('/pellets');
    revalidatePath('/dashboard');
    return { success: true, message: 'Pellet consumption deleted successfully!' };
  }


export async function getPelletStockBatches() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('pellet_stock_batches')
    .select('*')
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })
    .gt('remaining_quantity_kg', 0); // Only get batches with remaining stock

  if (error) {
    console.error('Error fetching pellet stock batches:', error);
    return [];
  }
  return data;
}

export async function getPelletOverviewData() {
    const supabase = getSupabaseServerClient();

    // Get current stock
    const { data: stockData, error: stockError } = await supabase
        .from('pellet_stock_batches')
        .select('remaining_quantity_kg, purchase_price_per_kg') // Select purchase_price_per_kg too
        .gt('remaining_quantity_kg', 0);

    const currentStock = stockData?.reduce((sum, batch) => sum + batch.remaining_quantity_kg, 0) || 0;

    let totalWeightedPrice = 0;
    if (stockData && stockData.length > 0) {
        totalWeightedPrice = stockData.reduce((sum, batch) => sum + (batch.remaining_quantity_kg * batch.purchase_price_per_kg), 0);
    }
    
    const averagePricePerKg = currentStock > 0 ? totalWeightedPrice / currentStock : 0;

    if (stockError) {
        console.error('Error fetching current pellet stock:', stockError);
    }

    // Get last purchase
    const { data: lastPurchaseData, error: lastPurchaseError } = await supabase
        .from('pellet_purchases')
        .select('*')
        .order('purchase_date', { ascending: false })
        .limit(1)
        .single();

    if (lastPurchaseError && lastPurchaseError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching last pellet purchase:', lastPurchaseError);
    }

    // Get last consumption
    const { data: lastConsumptionData, error: lastConsumptionError } = await supabase
        .from('pellet_consumption')
        .select('*, cost_czk') // Select cost_czk instead of cost_eur
        .order('consumption_date', { ascending: false })
        .limit(1)
        .single();

    if (lastConsumptionError && lastConsumptionError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching last pellet consumption:', lastConsumptionError);
    }

    const { estimatedDurationDays, averageDailyConsumption, forecastDurationByDay } = await getEstimatedPelletDurationWithAverage();

    return {
        currentStock,
        averagePricePerKg,
        lastPurchase: lastPurchaseData || null,
        lastConsumption: lastConsumptionData || null,
        estimatedPelletDuration: estimatedDurationDays,
        averageDailyConsumption,
        forecastDurationByDay,
    };
}

export async function getMonthlyPelletConsumptionChartData() {
    const supabase = getSupabaseServerClient();
    const { data: consumptionData, error } = await supabase
      .from('pellet_consumption')
      .select('consumption_date, quantity_kg, average_temperature_celsius, cost_czk') // NEW: Select cost_czk
      .order('consumption_date', { ascending: true });
  
    if (error) {
      console.error('Error fetching monthly pellet consumption for chart:', error);
      return [];
    }
  
    // Group by month and year
    const monthlyConsumptionMap = new Map<string, { quantity_kg: number; total_temp: number; count: number; total_cost: number }>(); // NEW: total_cost
  
    for (const entry of consumptionData) {
      const date = parseISO(entry.consumption_date);
      const monthYear = format(date, 'MM/yyyy'); // e.g., "01/2023"
      const current = monthlyConsumptionMap.get(monthYear) || { quantity_kg: 0, total_temp: 0, count: 0, total_cost: 0 }; // NEW: total_cost
      monthlyConsumptionMap.set(monthYear, {
        quantity_kg: current.quantity_kg + entry.quantity_kg,
        total_temp: current.total_temp + (entry.average_temperature_celsius ?? 0),
        count: current.count + (entry.average_temperature_celsius !== null ? 1 : 0),
        total_cost: current.total_cost + (entry.cost_czk ?? 0), // NEW: total_cost
      });
    }
  
    // Convert map to array of objects
    const chartData = Array.from(monthlyConsumptionMap.entries())
      .map(([monthYear, data]) => ({
        monthYear,
        quantity_kg: parseFloat(data.quantity_kg.toFixed(2)),
        average_temperature_celsius: data.count > 0 ? parseFloat((data.total_temp / data.count).toFixed(2)) : null,
        total_cost_czk: parseFloat(data.total_cost.toFixed(2)), // NEW: total_cost_czk
      }))
      .sort((a, b) => {
        const [monthA, yearA] = a.monthYear.split('/');
        const [monthB, yearB] = b.monthYear.split('/');
        return new Date(`${yearA}-${monthA}-01`).getTime() - new Date(`${yearB}-${monthB}-01`).getTime();
      });
  
    return chartData;
  }

  export async function getPelletPriceEvolutionChartData() {
    const supabase = getSupabaseServerClient();
    const { data: purchaseData, error } = await supabase
      .from('pellet_purchases')
      .select('purchase_date, price_per_kg')
      .order('purchase_date', { ascending: true });
  
    if (error) {
      console.error('Error fetching pellet price evolution for chart:', error);
      return [];
    }
  
    // Map data to chart format
    const chartData = purchaseData.map(purchase => ({
      date: format(parseISO(purchase.purchase_date), 'dd.MM.yyyy'),
      price_per_kg: parseFloat(purchase.price_per_kg.toFixed(2)),
    }));
  
    return chartData;
  }

  export async function getPelletStockLevelChartData() {
    const supabase = getSupabaseServerClient();
    const { data: purchases, error: purchaseError } = await supabase
      .from('pellet_purchases')
      .select('purchase_date, quantity_kg')
      .order('purchase_date', { ascending: true });
  
    if (purchaseError) {
      console.error('Error fetching pellet purchases for stock level chart:', purchaseError);
      return [];
    }
  
    const { data: consumptions, error: consumptionError } = await supabase
      .from('pellet_consumption')
      .select('consumption_date, quantity_kg')
      .order('consumption_date', { ascending: true });
  
    if (consumptionError) {
      console.error('Error fetching pellet consumptions for stock level chart:', consumptionError);
      return [];
    }
  
    // Combine and sort all events by date
    const allEvents = [
      ...purchases.map(p => ({ date: parseISO(p.purchase_date), type: 'purchase', quantity: p.quantity_kg })),
      ...consumptions.map(c => ({ date: parseISO(c.consumption_date), type: 'consumption', quantity: c.quantity_kg })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());
  
    let currentStock = 0;
    const chartData = [];
  
    // Reconstruct stock level over time
    for (const event of allEvents) {
      if (event.type === 'purchase') {
        currentStock += event.quantity;
      } else if (event.type === 'consumption') {
        currentStock -= event.quantity;
        if (currentStock < 0) currentStock = 0; // Stock cannot go below zero
      }
      chartData.push({
        date: format(event.date, 'dd.MM.yyyy'),
        stock_level: parseFloat(currentStock.toFixed(2)),
      });
    }
  
    return chartData;
  }

async function getEstimatedPelletDurationWithAverage() {
    const supabase = getSupabaseServerClient();

    const getForecastTemperatures = async () => {
      const latitude = Number(process.env.PELLET_LOCATION_LAT ?? DEFAULT_PELLET_LOCATION.latitude);
      const longitude = Number(process.env.PELLET_LOCATION_LON ?? DEFAULT_PELLET_LOCATION.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return [];
      }

      const forecastUrl = new URL('https://api.open-meteo.com/v1/forecast');
      forecastUrl.searchParams.set('latitude', String(latitude));
      forecastUrl.searchParams.set('longitude', String(longitude));
      forecastUrl.searchParams.set('daily', 'temperature_2m_mean');
      forecastUrl.searchParams.set('forecast_days', String(PELLET_FORECAST_TEMPERATURE_DAYS));
      forecastUrl.searchParams.set('timezone', 'auto');

      try {
        const response = await fetch(forecastUrl.toString(), {
          next: { revalidate: 60 * 60 * 6 }, // Refresh forecast every 6 hours.
        });

        if (!response.ok) return [];
        const data = await response.json();
        const values = data?.daily?.temperature_2m_mean;
        const days = data?.daily?.time;
        if (!Array.isArray(values) || !Array.isArray(days) || values.length === 0 || days.length === 0) return [];

        const result = [];
        for (let i = 0; i < Math.min(values.length, days.length); i++) {
          if (Number.isFinite(values[i]) && typeof days[i] === 'string') {
            result.push({
              date: days[i],
              temperatureCelsius: values[i] as number,
            });
          }
        }

        return result;
      } catch (error) {
        console.error('Error fetching weather forecast for pellet duration estimate:', error);
        return [];
      }
    };

    const getTemperatureAdjustedDailyConsumption = (
      entries: { quantity_kg: number; average_temperature_celsius: number | null }[],
      fallbackAverageDailyConsumption: number,
      targetTemperature: number | null
    ) => {
      const withTemperature = entries.filter(
        (entry) => entry.average_temperature_celsius !== null
      ) as { quantity_kg: number; average_temperature_celsius: number }[];

      if (withTemperature.length < 5) return fallbackAverageDailyConsumption;

      const recentTemperatureEntries = withTemperature.slice(-PELLET_RECENT_TEMPERATURE_WINDOW_DAYS);
      const historicalCurrentTemperature =
        recentTemperatureEntries.reduce((sum, entry) => sum + entry.average_temperature_celsius, 0) /
        recentTemperatureEntries.length;

      const effectiveTargetTemperature = targetTemperature ?? historicalCurrentTemperature;

      if (!Number.isFinite(effectiveTargetTemperature)) return fallbackAverageDailyConsumption;

      // Weighted comparison: historical days with similar temperature have higher impact.
      let weightedConsumptionSum = 0;
      let weightSum = 0;

      for (const entry of withTemperature) {
        const delta = Math.abs(entry.average_temperature_celsius - effectiveTargetTemperature);
        const weight = 1 / (1 + delta);
        weightedConsumptionSum += entry.quantity_kg * weight;
        weightSum += weight;
      }

      if (weightSum <= 0) return fallbackAverageDailyConsumption;

      const temperatureAdjusted = weightedConsumptionSum / weightSum;
      const blendedDailyConsumption = (temperatureAdjusted * 0.6) + (fallbackAverageDailyConsumption * 0.4);
      return blendedDailyConsumption > 0 ? blendedDailyConsumption : fallbackAverageDailyConsumption;
    };

    // 1. Fetch current stock (sum of remaining quantities in batches)
    const { data: stockBatches, error: stockError } = await supabase
        .from('pellet_stock_batches')
        .select('remaining_quantity_kg')
        .gt('remaining_quantity_kg', 0);

    const currentStock = stockBatches?.reduce((sum, batch) => sum + batch.remaining_quantity_kg, 0) || 0;

    if (stockError) {
        console.error('Error fetching current pellet stock for duration estimate:', stockError);
        return { estimatedDurationDays: null, averageDailyConsumption: null, forecastDurationByDay: [] };
    }

    if (currentStock === 0) {
        return { estimatedDurationDays: 0, averageDailyConsumption: null, forecastDurationByDay: [] };
    }

    // 2. Fetch historical consumption for baseline average (last 30 days)
    const periodStart = new Date(Date.now() - PELLET_DAILY_AVERAGE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const periodStartFormatted = format(periodStart, 'yyyy-MM-dd');

    const { data: recentConsumptionData, error: consumptionError } = await supabase
        .from('pellet_consumption')
        .select('quantity_kg')
        .gte('consumption_date', periodStartFormatted)
        .order('consumption_date', { ascending: true });

    if (consumptionError) {
        console.error('Error fetching recent pellet consumption for duration estimate:', consumptionError);
        return { estimatedDurationDays: null, averageDailyConsumption: null, forecastDurationByDay: [] };
    }

    if (!recentConsumptionData || recentConsumptionData.length === 0) {
        return { estimatedDurationDays: null, averageDailyConsumption: null, forecastDurationByDay: [] };
    }

    let totalConsumptionInPeriod = 0;
    for (const entry of recentConsumptionData) {
        totalConsumptionInPeriod += entry.quantity_kg;
    }

    const averageDailyConsumption = totalConsumptionInPeriod / PELLET_DAILY_AVERAGE_LOOKBACK_DAYS;

    if (averageDailyConsumption <= 0) {
        return { estimatedDurationDays: null, averageDailyConsumption: null, forecastDurationByDay: [] };
    }

    // 3. Temperature-adjusted projected daily consumption from longer history.
    const tempModelStart = new Date(Date.now() - PELLET_TEMPERATURE_MODEL_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const tempModelStartFormatted = format(tempModelStart, 'yyyy-MM-dd');

    const { data: temperatureModelData, error: temperatureModelError } = await supabase
      .from('pellet_consumption')
      .select('quantity_kg, average_temperature_celsius')
      .gte('consumption_date', tempModelStartFormatted)
      .order('consumption_date', { ascending: true });

    if (temperatureModelError) {
      console.error('Error fetching pellet temperature model data for duration estimate:', temperatureModelError);
    }

    const forecastTemperatures = await getForecastTemperatures();

    const forecastDurationByDay = forecastTemperatures.map((forecastDay) => {
      const projectedDailyConsumption = temperatureModelData && temperatureModelData.length > 0
        ? getTemperatureAdjustedDailyConsumption(
            temperatureModelData,
            averageDailyConsumption,
            forecastDay.temperatureCelsius
          )
        : averageDailyConsumption;

      return {
        date: forecastDay.date,
        temperatureCelsius: forecastDay.temperatureCelsius,
        projectedDailyConsumption,
        estimatedDurationDays: currentStock / projectedDailyConsumption,
      };
    });

    const estimatedDurationDays = forecastDurationByDay.length > 0
      ? currentStock / (
          forecastDurationByDay.reduce((sum, day) => sum + day.projectedDailyConsumption, 0) /
          forecastDurationByDay.length
        )
      : (
          currentStock / (
            temperatureModelData && temperatureModelData.length > 0
              ? getTemperatureAdjustedDailyConsumption(
                  temperatureModelData,
                  averageDailyConsumption,
                  null
                )
              : averageDailyConsumption
          )
        );

    return { estimatedDurationDays, averageDailyConsumption, forecastDurationByDay };
}

export async function getEstimatedPelletDuration() {
    const { estimatedDurationDays } = await getEstimatedPelletDurationWithAverage();
    return estimatedDurationDays;
}

export async function getConsumptionTemperatureCorrelationChartData() {
  const supabase = getSupabaseServerClient();

  const { data: consumptionData, error: consumptionError } = await supabase
    .from('pellet_consumption')
    .select('consumption_date, quantity_kg, average_temperature_celsius')
    .order('consumption_date', { ascending: true });

  if (consumptionError) {
    console.error('Error fetching pellet consumption for correlation chart:', consumptionError);
    return [];
  }

  // Create a map to combine data by date
  const combinedDataMap = new Map<string, { consumption_kg: number; average_temperature_celsius: number | null }>();

  for (const entry of consumptionData) {
    const date = entry.consumption_date;
    combinedDataMap.set(date, {
      consumption_kg: (combinedDataMap.get(date)?.consumption_kg || 0) + entry.quantity_kg,
      average_temperature_celsius: entry.average_temperature_celsius ?? null,
    });
  }

  // Convert map to array and sort by date
  const chartData = Array.from(combinedDataMap.entries())
    .map(([date, values]) => ({
      date: format(parseISO(date), 'dd.MM.yyyy'),
      consumption_kg: parseFloat(values.consumption_kg.toFixed(2)),
      average_temperature_celsius: values.average_temperature_celsius,
    }))
    .sort((a, b) => parseISO(a.date.split('.').reverse().join('-')).getTime() - parseISO(b.date.split('.').reverse().join('-')).getTime());

  return chartData;
}

export async function getYearlyPelletConsumptionChartData() {
  const supabase = getSupabaseServerClient();
  const { data: consumptionData, error } = await supabase
    .from('pellet_consumption')
    .select('consumption_date, quantity_kg')
    .order('consumption_date', { ascending: true });

  if (error) {
    console.error('Error fetching yearly pellet consumption for chart:', error);
    return {};
  }

  const yearlyData: { [year: number]: { [month: number]: number } } = {};

  for (const entry of consumptionData) {
    const date = parseISO(entry.consumption_date);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11

    if (!yearlyData[year]) yearlyData[year] = {};
    if (!yearlyData[year][month]) yearlyData[year][month] = 0;
    yearlyData[year][month] += entry.quantity_kg;
  }

  return yearlyData;
}
