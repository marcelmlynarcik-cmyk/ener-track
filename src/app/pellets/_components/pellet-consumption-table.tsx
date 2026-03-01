'use client';

import { ReactNode } from 'react';
import { format } from 'date-fns';
import { PaginatedTable } from '@/components/paginated-table';
import { PelletConsumptionActions } from './pellet-consumption-actions';
import { Consumption } from '../types';

interface PelletConsumptionTableProps {
  consumptionEntries: Consumption[];
}

export function PelletConsumptionTable({ consumptionEntries }: PelletConsumptionTableProps) {
  // Columns for Consumption Table
  const consumptionColumns: {
    key: keyof Consumption | 'actions';
    header: string;
    render: (item: Consumption) => ReactNode;
    className?: string;
  }[] = [
    { key: 'consumption_date', header: 'Dátum', render: (consumption: Consumption) => format(new Date(consumption.consumption_date), 'dd.MM.yyyy') },
    { key: 'quantity_kg', header: 'Množstvo (kg)', render: (consumption: Consumption) => consumption.quantity_kg.toFixed(2) },
    { key: 'cost_czk', header: 'Cena (Kč)', render: (consumption: Consumption) => `${(consumption.cost_czk ?? 0).toFixed(2)} Kč` },
    {
      key: 'actions',
      header: 'Akcie',
      render: (consumption: Consumption) => <PelletConsumptionActions consumption={consumption} />,
      className: 'text-right',
    },
  ];

  return (
    <PaginatedTable<Consumption>
      data={consumptionEntries}
      columns={consumptionColumns}
      itemsPerPage={10}
      emptyMessage="Žiadna zaznamenaná spotreba peliet."
    />
  );
}
