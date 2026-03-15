'use client';

import { useState } from 'react';
import { Purchase, Consumption } from '../types';
import { PelletConsumptionTable } from './pellet-consumption-table';
import { PelletPurchaseTable } from './pellet-purchase-table';

interface PelletHistoryProps {
  purchases: Purchase[];
  consumptionEntries: Consumption[];
}

export function PelletHistory({ purchases, consumptionEntries }: PelletHistoryProps) {
  const [activeTab, setActiveTab] = useState<'consumption' | 'purchases'>('consumption');

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
      <h2 className="text-xl font-semibold text-slate-900">História</h2>
      
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('consumption')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
            activeTab === 'consumption'
              ? 'text-slate-900'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Spotreba
          {activeTab === 'consumption' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
            activeTab === 'purchases'
              ? 'text-slate-900'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Nákupy
          {activeTab === 'purchases' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
          )}
        </button>
      </div>

      <div className="pt-2">
        {activeTab === 'consumption' ? (
          <PelletConsumptionTable consumptionEntries={consumptionEntries} />
        ) : (
          <PelletPurchaseTable purchases={purchases} />
        )}
      </div>
    </div>
  );
}
