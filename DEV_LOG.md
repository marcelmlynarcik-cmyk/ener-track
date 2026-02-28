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
-   **Added Delete Functionality for Readings:** Implemented the ability to delete electricity readings from the "Elektrina" page, including a server action, a confirmation dialog, and UI integration.
-   **Added Update Functionality for Readings:** Implemented the ability to edit electricity readings, including a new edit page, a pre-filled form, a server action for updating, and UI integration.
-   **Sort Order on Meter Details Page:** Changed the sorting logic on the "Detaily merača" page to display the newest readings at the top of the table.
-   **PWA Implementation:**
    -   Installed `next-pwa` package.
    -   Configured `next.config.ts` to integrate `next-pwa`, enabling PWA in production and disabling in development.
    -   Created `public/manifest.json` with basic PWA metadata (name, short_name, icons, theme_color, background_color, start_url, display, orientation, description).
    -   Added a 180x180 icon reference for iPhone compatibility to `manifest.json`.
    -   Added `<link rel="manifest" ...>` and `<link rel="apple-touch-icon" ...>` tags to `src/app/layout.tsx`.
-   **Vercel Build Fixes:**
    -   **Resolved `Error: Supabase environment variables (URL/Anon Key) are missing.`:** Instructed user to correctly set environment variables on Vercel.
    -   **Resolved `Export createClient doesn't exist in target module`:** Removed `/login` route, corrected `main` branch push, and verified Vercel build from correct branch.
    -   **Resolved `Type error: 'dashboardData.consumption' is possibly 'null'.`:** Added non-null assertion operator (`!`) to `dashboardData.consumption` in `src/app/dashboard/page.tsx`.
    -   **Resolved `Type error: No overload matches this call. ... dashboardData.periodStart`:** Added non-null assertion operator (`!`) to `dashboardData.periodStart` and `dashboardData.periodEnd` in `src/app/dashboard/page.tsx`.
    -   **Resolved `Type error: Module ... has no exported member 'getElectricityConsumption'.`:** Created `getElectricityConsumptionChartData` server action in `src/app/electricity/actions.ts` and updated `src/app/electricity/[meterId]/_components/consumption-chart.tsx` to use it.
    -   **Resolved `Type error: Expected 2 arguments, but got 1. ... addElectricityReading` (manual call):** Passed `null` as the first argument to `addElectricityReading` in `src/app/electricity/[meterId]/add-reading/page.tsx` to match its `useActionState` compatible signature.
    -   **Resolved `Type error: No overload matches this call. ... addElectricityMeter` (in AddMeterForm):** Modified `initialState.success` to `undefined` in `src/app/electricity/add-meter/_components/add-meter-form.tsx`.
    -   **Resolved `Type error: No overload matches this call. ... addElectricityReading` (in AddReadingForm):** Modified `initialState.success` to `undefined` in `src/app/electricity/add-reading/_components/add-reading-form.tsx`.
    -   **Resolved `Type error: No overload matches this call. ... updateElectricityReading` (in EditReadingForm):** Modified `initialState.success` to `undefined` in `src/app/electricity/edit-reading/[readingId]/_components/edit-reading-form.tsx`.
    -   **Resolved `Type error: Cannot find module 'next-themes/dist/types'.`:** Corrected import path for `ThemeProviderProps` from `next-themes/dist/types` to `next-themes` in `src/components/theme-provider.tsx`.
    -   **Resolved `Type error: (0 , __TURBOPACK__...__.useActionState) is not a function`:** Corrected the import path for `useActionState` in `EditReadingForm` to `react`.

## Future Work

The application now has a robust and logically correct foundation for tracking electricity readings, with a clear structure, clean design, and improved UX. The dashboard provides an at-a-glance overview, and the electricity readings table offers detailed comparison for each period. It also has PWA capabilities and should now build successfully on Vercel.

Continuing with the user's request, the next steps are to focus on further refinements or new modules as per their guidance.