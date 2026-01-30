# EnerTrack - Development Log

This file tracks the development progress of the EnerTrack application.

## Project Summary

A web application for tracking household energy usage, focusing on electricity meter readings and pellet consumption.

**Tech Stack:**
- Frontend: Next.js (React, TypeScript)
- UI: Tailwind CSS + shadcn/ui
- Backend & Database: Supabase
- Language: Slovak

## Current Status

- **Project Initialized:** Next.js project set up with TypeScript, Tailwind CSS, and shadcn/ui.
- **Database Schema Created:** `supabase_schema.sql` is ready and has been provided to the user.
- **Supabase Client Configured:** `.env.local`, `src/lib/supabase/client.ts`, and `src/lib/supabase/server.ts` are set up. Simplified for DB-only access.
- **Authentication & Middleware Removed:** All authentication logic, middleware, and auth helpers have been successfully removed as per project requirements (no authentication).
- **Core UI & Navigation - REDESIGNED & LOCALIZED:**
    - **Landing Page Removed:** The application now starts directly on the Dashboard (`/dashboard`).
    - **Bottom Navigation Bar Introduced:** Persistent bottom navigation with Slovak labels (`Prehľad`, `Elektrina`, `Pelety`, `Štatistiky`) and icons.
    - **Slovak Localization:** All UI texts and navigation labels have been localized to Slovak.
    - **Dashboard (`/dashboard`) Redesigned:** Now displays "Posledný odpočet" (Last Reading) and "Spotreba za posledné obdobie" (Consumption for the Last Period) cards with reading-based consumption and year-over-year comparison. Includes a clear CTA "➕ Pridať odpočet".
    - **Electricity (`/electricity`) Redesigned:** Separated sections for "Elektromery" (meters as cards with active indicator) and "Všetky odpočty" (all readings in a table). Each reading row now includes year-over-year comparison with conditional styling.
    - **"Add Reading" Functionality Added:** Dedicated page (`/electricity/add-reading`) with a form to add new readings for specific meters.
    - **"Add Meter" Functionality Refactored:** Dedicated page (`/electricity/add-meter`) with a form to add new meters.
    - **Meter Details Page (`/electricity/[meterId]`) Redesigned:** Displays meter details and specific readings for that meter.

## Recent Changes

-   **Mobile UI for Electricity Readings:** Replaced the table layout on the "Elektrina" page with a mobile-friendly card list for electricity readings, ensuring readability and preventing horizontal scrolling on small screens.
-   **"Rozdiel" Column Refinement:** Shortened the comparison text for the "Rozdiel" column on the "Elektrina" page for better conciseness.
-   **Back Button on Meter Details:** Added a "Späť" (Back) button to the "Detaily merača" page for improved navigation.
-   **Clickable Dashboard Cards:** Made the "Posledný odpočet" and "Spotreba za posledné obdobie" cards on the "Prehľad" (Dashboard) page clickable, linking to the main "Elektrina" overview.
-   **Dashboard Card Icons:** Added relevant icons (`Gauge`, `CloudLightning`) to the dashboard cards for better visual identification.
-   **Fixed `useActionState` Import:** Corrected the import path for `useActionState` in the `EditReadingForm` component to resolve a runtime `TypeError`.
-   **Added Delete Functionality for Readings:** Implemented the ability to delete electricity readings from the "Elektrina" page, including a server action, a confirmation dialog, and UI integration.
-   **Added Update Functionality for Readings:** Implemented the ability to edit electricity readings, including a new edit page, a pre-filled form, a server action for updating, and UI integration.
-   **Sort Order on Meter Details Page:** Changed the sorting logic on the "Detaily merača" page to display the newest readings at the top of the table.
-   **Fixed `params` unwrapping in Edit Page:** Corrected the dynamic route parameter access on the edit page by awaiting the `params` object, resolving a server error.
-   **Fixed `formData.get is not a function`:** Corrected the `addElectricityReading` server action signature to properly receive `formData` when used with `useActionState`.
-   **Redirect after Add Reading:** Implemented redirection to the main electricity page after a successful addition of an electricity reading.

## Resolved Issues (during redesign and refactoring)

- Crashes on `npm run dev` due to Supabase auth and middleware code.
- "Invalid API key" errors due to incorrect `.env.local` configuration.
- "Link is not defined" and "Button is not defined" errors due to missing imports.
- "useState used in Server Component" error by extracting `AddMeterForm` to a Client Component.
- "Chyba pri pridávaní elektromera" (Error adding electricity meter) due to incorrect RLS policies and `user_id` column.
- `TypeError: Cannot read properties of null (reading 'reset')` in `add-meter-form.tsx`.
- `ReferenceError: Link is not defined` in `page.tsx`.
- `Console Error: A param property was accessed directly with params.meterId. params is a Promise` in `add-reading/page.tsx`.
- `Build Error: useRouter` in Server Component in `add-reading/page.tsx`.
- `Build Error: Module not found: Can't resolve 'next/font/google/target.css'` (Fixed by correcting Geist font import from `next/font/google` to `geist/font/sans` and `geist/font/mono`).
- `Build Error: Module not found: Can't resolve '@/components/ui/card'` (Fixed by creating `src/components/ui/card.tsx`).
- `Build Error: Module not found: Can't resolve '@/components/ui/select'` (Fixed by creating `src/components/ui/select.tsx`).
- `Build Error: Module not found: Can't resolve '@radix-ui/react-select'` (Fixed by installing `@radix-ui/react-select`).
- `Console Error: ReactDOM.useFormState has been renamed to React.useActionState` (Fixed by updating `useFormState` to `React.useActionState` in `add-reading-form.tsx` and `add-meter-form.tsx`).
- `Console Error: Error fetching electricity meter: "invalid input syntax for type uuid: \"undefined\""` (Fixed by adding `meterId` validation in action functions).
- `Console Error: Error fetching electricity meter: meterId is undefined` (Fixed by adding `meterId` UUID validation in `src/app/electricity/[meterId]/page.tsx` and awaiting `params`).
- `Console Error: 
legacyBehavior` is deprecated` (Fixed by removing `legacyBehavior` prop and refactoring `Link` component in `src/components/bottom-navbar.tsx`).
- `Build Error: Export getDashboardConsumptionData doesn't exist in target module` (Fixed by fully reconstructing `src/app/electricity/actions.ts` with all functions and imports in correct order and scope, and integrating per-reading comparison logic into `getProcessedElectricityReadings`).

## Future Work

The application now has a robust and logically correct foundation for tracking electricity readings, with a clear structure, clean design, and improved UX. The dashboard provides an at-a-glance overview, and the electricity readings table offers detailed comparison for each period.

Continuing with the user's request, the next steps are to focus on further refinements or new modules as per their guidance.