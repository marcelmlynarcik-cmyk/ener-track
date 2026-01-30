

-- Create the 'electricity_meters' table
CREATE TABLE public.electricity_meters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    installation_date date NOT NULL,
    removal_date date, -- Nullable, if meter is still in use
    initial_value numeric NOT NULL, -- kWh value when meter was installed/started
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for 'electricity_meters'
ALTER TABLE public.electricity_meters ENABLE ROW LEVEL SECURITY;

-- Policies for 'electricity_meters'
CREATE POLICY "Public access for electricity_meters" ON public.electricity_meters FOR ALL USING (true) WITH CHECK (true);

-- Create the 'electricity_readings' table
CREATE TABLE public.electricity_readings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    meter_id uuid REFERENCES public.electricity_meters ON DELETE CASCADE NOT NULL,
    reading_date date NOT NULL,
    value numeric NOT NULL, -- kWh value of the reading
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (meter_id, reading_date) -- Ensure only one reading per meter per day
);

-- Enable RLS for 'electricity_readings'
ALTER TABLE public.electricity_readings ENABLE ROW LEVEL SECURITY;

-- Policies for 'electricity_readings'
CREATE POLICY "Public access for electricity_readings" ON public.electricity_readings FOR ALL USING (true) WITH CHECK (true);

-- Create the 'pellet_purchases' table
CREATE TABLE public.pellet_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_date date NOT NULL,
    quantity_kg numeric NOT NULL CHECK (quantity_kg > 0),
    price_per_kg numeric NOT NULL CHECK (price_per_kg >= 0),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for 'pellet_purchases'
ALTER TABLE public.pellet_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for 'pellet_purchases'
CREATE POLICY "Public access for pellet_purchases" ON public.pellet_purchases FOR ALL USING (true) WITH CHECK (true);

-- Create the 'pellet_stock_batches' table for FIFO tracking
-- This table will be managed internally by database functions/triggers or application logic
CREATE TABLE public.pellet_stock_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id uuid REFERENCES public.pellet_purchases ON DELETE CASCADE NOT NULL,
    initial_quantity_kg numeric NOT NULL CHECK (initial_quantity_kg > 0),
    remaining_quantity_kg numeric NOT NULL CHECK (remaining_quantity_kg >= 0),
    purchase_price_per_kg numeric NOT NULL CHECK (purchase_price_per_kg >= 0),
    entry_date date NOT NULL, -- Corresponds to purchase_date
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for 'pellet_stock_batches'
ALTER TABLE public.pellet_stock_batches ENABLE ROW LEVEL SECURITY;

-- Policies for 'pellet_stock_batches' (read-only for users, managed by app)
CREATE POLICY "Public access for pellet_stock_batches" ON public.pellet_stock_batches FOR ALL USING (true) WITH CHECK (true);

-- Create the 'pellet_consumption' table (boiler refills)
CREATE TABLE public.pellet_consumption (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    consumption_date date NOT NULL,
    quantity_kg numeric NOT NULL CHECK (quantity_kg > 0),
    cost_eur numeric NOT NULL DEFAULT 0, -- Calculated based on FIFO from pellet_stock_batches
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (consumption_date) -- Ensure only one consumption entry per user per day
);

-- Enable RLS for 'pellet_consumption'
ALTER TABLE public.pellet_consumption ENABLE ROW LEVEL SECURITY;

-- Policies for 'pellet_consumption'
CREATE POLICY "Public access for pellet_consumption" ON public.pellet_consumption FOR ALL USING (true) WITH CHECK (true);

-- Create the 'outdoor_temperature' table
CREATE TABLE public.outdoor_temperature (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    temperature_date date NOT NULL,
    average_temperature_celsius numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (temperature_date) -- Ensure only one temperature entry per user per day
);

-- Enable RLS for 'outdoor_temperature'
ALTER TABLE public.outdoor_temperature ENABLE ROW LEVEL SECURITY;

-- Policies for 'outdoor_temperature'
CREATE POLICY "Public access for outdoor_temperature" ON public.outdoor_temperature FOR ALL USING (true) WITH CHECK (true);



