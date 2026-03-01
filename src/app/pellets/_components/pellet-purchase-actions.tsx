'use client';

import { DeletePelletPurchaseButton } from './delete-pellet-purchase-button';
import { EditPelletPurchaseForm } from './edit-pellet-purchase-form';

interface Purchase {
  id: string;
  purchase_date: string;
  quantity_kg: number;
  price_per_kg: number;
  created_at: string;
}

export function PelletPurchaseActions({ purchase }: { purchase: Purchase }) {
  if (!purchase) {
    console.error("PelletPurchaseActions received an undefined or null purchase object.");
    return null;
  }
  return (
    <>
      <EditPelletPurchaseForm purchase={purchase} />
      <DeletePelletPurchaseButton purchaseId={purchase.id} />
    </>
  );
}
