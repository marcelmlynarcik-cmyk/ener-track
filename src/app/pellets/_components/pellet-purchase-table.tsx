'use client';

import { ReactNode } from 'react';
import { format } from 'date-fns';
import { PaginatedTable } from '@/components/paginated-table';
import { PelletPurchaseActions } from './pellet-purchase-actions';
import { Purchase } from '../types';

interface PelletPurchaseTableProps {
  purchases: Purchase[];
}

export function PelletPurchaseTable({ purchases }: PelletPurchaseTableProps) {
  const purchaseColumns: {
    key: keyof Purchase | 'actions';
    header: string;
    render: (item: Purchase) => ReactNode;
    className?: string;
  }[] = [
    { key: 'purchase_date', header: 'Dátum', render: (purchase: Purchase) => format(new Date(purchase.purchase_date), 'dd.MM.yyyy') },
    { key: 'quantity_kg', header: 'Množstvo (kg)', render: (purchase: Purchase) => purchase.quantity_kg.toFixed(2) },
    { key: 'price_per_kg', header: 'Cena/kg (Kč)', render: (purchase: Purchase) => `${purchase.price_per_kg.toFixed(2)} Kč` },
    {
      key: 'actions',
      header: 'Akcie',
      render: (purchase: Purchase) => <PelletPurchaseActions purchase={purchase} />,
      className: 'text-right',
    },
  ];

  return (
    <PaginatedTable<Purchase>
      data={purchases}
      columns={purchaseColumns}
      itemsPerPage={10}
      emptyMessage="Žiadne zaznamenané nákupy peliet."
    />
  );
}
