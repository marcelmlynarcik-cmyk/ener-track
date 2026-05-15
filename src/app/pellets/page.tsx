import {
  getPelletOverviewData,
  getPelletPurchases,
  getPelletConsumption,
} from './actions';
import { format } from 'date-fns';
import { Package, Plus } from 'lucide-react';

import { AddPelletPurchaseForm } from './_components/add-pellet-purchase-form';
import { AddPelletConsumptionForm } from './_components/add-pellet-consumption-form';
import { PelletHistory } from './_components/pellet-history';
import { Button } from '@/components/ui/button';
import { formatAverageDailyConsumption, formatEstimatedPelletDuration } from '@/lib/pellet-duration';

export const dynamic = 'force-dynamic';

export default async function PelletsPage() {
  const { 
    currentStock, 
    averagePricePerKg, 
    lastConsumption, 
    estimatedPelletDuration,
    averageDailyConsumption
  } = await getPelletOverviewData();
  
  const purchases = await getPelletPurchases();
  const consumptionEntries = await getPelletConsumption();

  const lastUpdateDate = lastConsumption 
    ? format(new Date(lastConsumption.consumption_date), 'dd.MM.yyyy')
    : 'N/A';

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pelety</h1>
            <p className="text-slate-500">Správa zásob a spotreby</p>
          </div>
          
          <div className="flex items-center gap-3">
            <AddPelletConsumptionForm 
              trigger={
                <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2.5 h-auto font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  Zaznamenať spotrebu
                </Button>
              }
            />
            <AddPelletPurchaseForm 
              trigger={
                <Button variant="outline" className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl px-5 py-2.5 h-auto font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  Pridať nákup
                </Button>
              }
            />
          </div>
        </div>

        {/* Section 1 – STOCK OVERVIEW */}
        <div className="bg-white rounded-2xl shadow-sm p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Package className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Aktuálny stav zásob</span>
            </div>
            
            <div className="space-y-1">
              <div className="text-5xl font-bold text-slate-900">
                {currentStock.toFixed(0)} <span className="text-3xl font-medium text-slate-400 ml-1">kg</span>
              </div>
              <p className="text-sm text-slate-400">
                Posledná aktualizácia: {lastUpdateDate}
              </p>
            </div>
          </div>

          <div className="border-t my-4"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0">
            {/* Column 1 */}
            <div className="md:pr-8 space-y-1">
              <p className="text-sm text-slate-400">Priemerná denná spotreba</p>
              <p className="text-xl font-semibold text-slate-900">
                {formatAverageDailyConsumption(averageDailyConsumption)}
              </p>
            </div>

            {/* Column 2 */}
            <div className="md:px-8 md:border-x border-slate-100 space-y-1">
              <p className="text-sm text-slate-400">Priemerná cena</p>
              <p className="text-xl font-semibold text-slate-900">
                {averagePricePerKg.toFixed(2)} Kč/kg
              </p>
            </div>

            {/* Column 3 */}
            <div className="md:pl-8 space-y-1">
              <p className="text-sm text-slate-400">Odhad výdrže</p>
              <p className="text-xl font-semibold text-slate-900">
                {formatEstimatedPelletDuration(estimatedPelletDuration)}
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2 – HISTORY */}
        <PelletHistory 
          purchases={purchases} 
          consumptionEntries={consumptionEntries} 
        />

      </div>
    </div>
  );
}
