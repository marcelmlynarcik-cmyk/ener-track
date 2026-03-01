// src/app/pellets/types.ts

export interface Purchase {
    id: string;
    purchase_date: string;
    quantity_kg: number;
    price_per_kg: number;
    created_at: string;
}

export interface Consumption {
    id: string;
    consumption_date: string;
    quantity_kg: number;
    cost_czk: number;
    average_temperature_celsius: number | null;
    created_at: string;
}
