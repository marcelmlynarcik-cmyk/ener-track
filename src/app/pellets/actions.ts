'use server';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { format, parseISO } from 'date-fns';
import { PELLET_DAILY_AVERAGE_LOOKBACK_DAYS } from '@/lib/pellet-duration';

const PELLET_QUANTITY_EPSILON = 0.000001;

function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === '23505';
}

function isMissingColumnError(error: { code?: string; message?: string } | null, column: string): boolean {
  return error?.code === '42703' || error?.message?.includes(`'${column}'`) || error?.message?.includes(`"${column}"`) || false;
}

async function insertPelletConsumptionEntry(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  entry: { consumption_date: string; quantity_kg: number; cost: number },
) {
  const { error: costEurError } = await supabase
    .from('pellet_consumption')
    .insert({
      consumption_date: entry.consumption_date,
      quantity_kg: entry.quantity_kg,
      cost_eur: entry.cost,
    })
    .select();

  if (!isMissingColumnError(costEurError, 'cost_eur')) {
    return costEurError;
  }

  const { error: costCzkError } = await supabase
    .from('pellet_consumption')
    .insert({
      consumption_date: entry.consumption_date,
      quantity_kg: entry.quantity_kg,
      cost_czk: entry.cost,
    })
    .select();

  return costCzkError;
}

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
  // Keep the UI contract stable even if the database still uses cost_eur.
  return data.map(entry => ({
    ...entry,
    cost_czk: entry.cost_czk ?? entry.cost_eur ?? 0,
  }));
}

export async function addPelletConsumption(
  _prevState: unknown,
  formData: FormData,
) {
  const supabase = getSupabaseServerClient();
  const consumption_date = formData.get('consumption_date') as string;
  const quantity_kg = parseFloat(formData.get('quantity_kg') as string);

  // Validate input
  if (!consumption_date || isNaN(quantity_kg) || quantity_kg <= 0) {
    return { success: false, message: 'Invalid input for pellet consumption.' };
  }

  // Get available stock in FIFO order
  const { data: stockBatches, error: stockBatchesError } = await supabase
    .from('pellet_stock_batches')
    .select('id, purchase_id, initial_quantity_kg, remaining_quantity_kg, purchase_price_per_kg, entry_date, created_at')
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

  const totalAvailableStock = stockBatches.reduce((sum, batch) => sum + Number(batch.remaining_quantity_kg), 0);
  if (totalAvailableStock + PELLET_QUANTITY_EPSILON < quantity_kg) {
    return { success: false, message: 'Not enough pellet stock to cover consumption.' };
  }

  let remainingConsumption = quantity_kg;
  let totalCost = 0;
  const batchUpdates: Array<
    | { type: 'update'; id: string; previousRemaining: number }
    | { type: 'delete'; batch: typeof stockBatches[number]; previousRemaining: number }
  > = [];

  // Consume from stock batches (FIFO)
  for (const batch of stockBatches) {
    if (remainingConsumption <= PELLET_QUANTITY_EPSILON) break;

    const currentRemaining = Number(batch.remaining_quantity_kg);
    const canConsume = Math.min(remainingConsumption, currentRemaining);
    totalCost += canConsume * batch.purchase_price_per_kg;
    remainingConsumption -= canConsume;
    const nextRemaining = Math.max(0, currentRemaining - canConsume);

    if (nextRemaining <= PELLET_QUANTITY_EPSILON) {
      const { error: updateError } = await supabase
        .from('pellet_stock_batches')
        .update({ remaining_quantity_kg: 0 })
        .eq('id', batch.id);

      if (updateError) {
        console.error('Error setting depleted pellet stock batch to zero, deleting batch instead:', updateError);
        const { error: deleteError } = await supabase
          .from('pellet_stock_batches')
          .delete()
          .eq('id', batch.id);

        if (deleteError) {
          console.error('Error deleting depleted pellet stock batch:', deleteError);
          return { success: false, message: 'Failed to update pellet stock during consumption.' };
        }

        batchUpdates.push({
          type: 'delete',
          batch,
          previousRemaining: currentRemaining,
        });
      } else {
        batchUpdates.push({
          type: 'update',
          id: batch.id,
          previousRemaining: currentRemaining,
        });
      }
    } else {
      const { error: updateError } = await supabase
        .from('pellet_stock_batches')
        .update({ remaining_quantity_kg: nextRemaining })
        .eq('id', batch.id);

      if (updateError) {
        console.error('Error updating pellet stock batch:', updateError);
        return { success: false, message: 'Failed to update pellet stock during consumption.' };
      }

      batchUpdates.push({
        type: 'update',
        id: batch.id,
        previousRemaining: currentRemaining,
      });
    }
  }

  if (remainingConsumption > PELLET_QUANTITY_EPSILON) {
    return { success: false, message: 'Not enough pellet stock to cover consumption.' };
  }

  // Add consumption entry. Older databases used cost_eur, newer ones may use cost_czk.
  const consumptionError = await insertPelletConsumptionEntry(supabase, {
    consumption_date,
    quantity_kg,
    cost: totalCost,
  });

  if (consumptionError) {
    console.error('Error adding pellet consumption:', consumptionError);
    for (const batchUpdate of [...batchUpdates].reverse()) {
      const { error: rollbackError } = batchUpdate.type === 'delete'
        ? await supabase
          .from('pellet_stock_batches')
          .insert({
            ...batchUpdate.batch,
            remaining_quantity_kg: batchUpdate.previousRemaining,
          })
        : await supabase
          .from('pellet_stock_batches')
          .update({ remaining_quantity_kg: batchUpdate.previousRemaining })
          .eq('id', batchUpdate.id);

      if (rollbackError) {
        console.error('Error rolling back pellet stock batch after failed consumption insert:', rollbackError);
      }
    }
    if (isUniqueViolation(consumptionError)) {
      return { success: false, message: 'Spotreba peliet pre tento datum uz existuje. Upravte existujuci zaznam alebo zvolte iny datum.' };
    }

    return { success: false, message: 'Nepodarilo sa ulozit spotrebu peliet.' };
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
  
    // Validate input
    if (!id || !consumption_date || isNaN(quantity_kg) || quantity_kg <= 0) {
      return { success: false, message: 'Invalid input for pellet consumption update.' };
    }
  
    // Update the pellet_consumption entry
    const { error: consumptionUpdateError } = await supabase
      .from('pellet_consumption')
      .update({ consumption_date, quantity_kg })
      .eq('id', id);
  
    if (consumptionUpdateError) {
      console.error('Error updating pellet consumption:', consumptionUpdateError);
      if (isUniqueViolation(consumptionUpdateError)) {
        return { success: false, message: 'Spotreba peliet pre tento datum uz existuje. Zvolte iny datum alebo upravte existujuci zaznam.' };
      }

      return { success: false, message: 'Nepodarilo sa upravit spotrebu peliet.' };
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
        .select('*')
        .order('consumption_date', { ascending: false })
        .limit(1)
        .single();

    if (lastConsumptionError && lastConsumptionError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching last pellet consumption:', lastConsumptionError);
    }

    const { estimatedDurationDays, averageDailyConsumption } = await getEstimatedPelletDurationWithAverage();

    return {
        currentStock,
        averagePricePerKg,
        lastPurchase: lastPurchaseData || null,
        lastConsumption: lastConsumptionData ? {
          ...lastConsumptionData,
          cost_czk: lastConsumptionData.cost_czk ?? lastConsumptionData.cost_eur ?? 0,
        } : null,
        estimatedPelletDuration: estimatedDurationDays,
        averageDailyConsumption,
    };
}

export async function getMonthlyPelletConsumptionChartData() {
    const supabase = getSupabaseServerClient();
    const { data: consumptionData, error } = await supabase
      .from('pellet_consumption')
      .select('consumption_date, quantity_kg, cost_eur')
      .order('consumption_date', { ascending: true });
  
    if (error) {
      console.error('Error fetching monthly pellet consumption for chart:', error);
      return [];
    }
  
    // Group by month and year
    const monthlyConsumptionMap = new Map<string, { quantity_kg: number; total_cost: number }>();
  
    for (const entry of consumptionData) {
      const date = parseISO(entry.consumption_date);
      const monthYear = format(date, 'MM/yyyy');
      const current = monthlyConsumptionMap.get(monthYear) || { quantity_kg: 0, total_cost: 0 };
      monthlyConsumptionMap.set(monthYear, {
        quantity_kg: current.quantity_kg + entry.quantity_kg,
        total_cost: current.total_cost + (entry.cost_eur ?? 0),
      });
    }
  
    // Convert map to array of objects
    const chartData = Array.from(monthlyConsumptionMap.entries())
      .map(([monthYear, data]) => ({
        monthYear,
        quantity_kg: parseFloat(data.quantity_kg.toFixed(2)),
        total_cost_czk: parseFloat(data.total_cost.toFixed(2)),
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

  // 1. Fetch current stock (sum of remaining quantities in batches)
  const { data: stockBatches, error: stockError } = await supabase
    .from('pellet_stock_batches')
    .select('remaining_quantity_kg')
    .gt('remaining_quantity_kg', 0);

  const currentStock = stockBatches?.reduce((sum, batch) => sum + batch.remaining_quantity_kg, 0) || 0;

  if (stockError) {
    console.error('Error fetching current pellet stock for duration estimate:', stockError);
    return { estimatedDurationDays: null, averageDailyConsumption: null };
  }

  if (currentStock === 0) {
    return { estimatedDurationDays: 0, averageDailyConsumption: null };
  }

  // 2. Fetch historical consumption for a fixed look-back period (last 30 days)
  const periodStart = new Date(Date.now() - PELLET_DAILY_AVERAGE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const periodStartFormatted = format(periodStart, 'yyyy-MM-dd');

  const { data: recentConsumptionData, error: consumptionError } = await supabase
    .from('pellet_consumption')
    .select('consumption_date, quantity_kg')
    .gte('consumption_date', periodStartFormatted)
    .order('consumption_date', { ascending: true });

  if (consumptionError) {
    console.error('Error fetching recent pellet consumption for duration estimate:', consumptionError);
    return { estimatedDurationDays: null, averageDailyConsumption: null };
  }

  if (!recentConsumptionData || recentConsumptionData.length === 0) {
    return { estimatedDurationDays: null, averageDailyConsumption: null };
  }

  let totalConsumptionInPeriod = 0;
  for (const entry of recentConsumptionData) {
    totalConsumptionInPeriod += entry.quantity_kg;
  }

  const averageDailyConsumption = totalConsumptionInPeriod / PELLET_DAILY_AVERAGE_LOOKBACK_DAYS;

  if (averageDailyConsumption <= 0) {
    return { estimatedDurationDays: null, averageDailyConsumption: null };
  }

  const estimatedDurationDays = currentStock / averageDailyConsumption;
  const lastConsumptionDate = parseISO(recentConsumptionData[recentConsumptionData.length - 1].consumption_date);
  const projectedDepletionFromLastConsumption = new Date(lastConsumptionDate);
  projectedDepletionFromLastConsumption.setDate(
    projectedDepletionFromLastConsumption.getDate() + Math.ceil(estimatedDurationDays),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  projectedDepletionFromLastConsumption.setHours(0, 0, 0, 0);

  if (projectedDepletionFromLastConsumption < today) {
    return { estimatedDurationDays: null, averageDailyConsumption: null };
  }

  return { estimatedDurationDays, averageDailyConsumption };
}

export async function getEstimatedPelletDuration() {
    const { estimatedDurationDays } = await getEstimatedPelletDurationWithAverage();
    return estimatedDurationDays;
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
