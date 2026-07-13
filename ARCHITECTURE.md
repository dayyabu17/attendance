# Architecture

This document outlines the architectural decisions, data flow, and component structure of the Usman Nagarta Attendance Dashboard.

## High-Level Architecture

The project is divided into two distinct phases to maximize frontend performance:
1. **Offline Data Pipeline (Node.js)**: Parses and normalizes heavy `.XLS` files into a lightweight JSON array.
2. **Frontend Dashboard (React/Vite)**: Fetches the pre-compiled JSON and dynamically calculates analytics on the client-side using React hooks.

This decoupled architecture ensures that the browser never has to perform expensive Excel parsing or raw data normalization, resulting in instant load times.

---

## 1. Data Pipeline (`scripts/process_xls.cjs`)

Biometric devices (like ZKTeco) generate complex, human-readable spreadsheet reports that are difficult to query. 

### Processing Steps:
- **Input**: Reads all `.XLS` files from the `public/xls/` directory.
- **Parsing**: Uses the `xlsx` (SheetJS) library to read the proprietary spreadsheet format.
- **Normalization**: Iterates through the rows to extract the Date, Name, Log In Time (earliest punch), and Log Out Time (latest punch).
- **Output**: Writes a flattened, structured array of objects to `public/attendance_data.json`.

---

## 2. Frontend Application

The frontend is a Single Page Application (SPA) built with React 18 and Vite.

### State Management & Data Flow
Global state is managed primarily in `App.jsx`, which acts as the controller:
1. **Data Fetching**: On mount, `App.jsx` fetches `attendance_data.json`.
2. **Pre-sorting**: The raw data is pre-sorted chronologically immediately after fetching ($O(N \log N)$), eliminating sorting overhead during filter changes.
3. **Filtering**: User selections (Person, Month, Week) are stored in React state.
4. **Analytics Engine**: The raw data and active filters are passed into the custom `useAttendanceAnalytics` hook.

### The Analytics Engine (`hooks/useAttendanceAnalytics.js`)
This hook is the mathematical core of the dashboard. It performs a single $O(N)$ pass over the filtered data to compute:
- **KPIs**: Average Log In/Out times, Total Overtime.
- **Aggregations**: Punctuality ratio (On Time vs. Late).
- **Time Series**: Daily arrival trends grouped by day of the week.
- **Leaderboards**: Most punctual and most overtime.

### Component Tree
```text
App
 ├── Header              (Theme toggle, Filtering Dropdowns)
 ├── MetricCards         (KPIs, Leaderboards)
 ├── ChartsSection       (Recharts: Punctuality Donut, Arrival Trend Line)
 └── DetailedLog         (TableVirtuoso Virtualized Data Grid, CSV Export)
```

---

## 3. UI/UX & Theming System

### CSS Variable Architecture (`index.css`)
The project avoids utility-class clutter by using semantic Vanilla CSS with CSS Variables.
- **Color Space**: Uses modern `oklch()` color spaces for perceptual uniformity.
- **Light/Dark Mode**: The `.dark` class on the `<html>` element dynamically swaps the root OKLCH variables.
- **Glassmorphism**: Panels utilize `backdrop-filter: blur()`, gracefully degrading on mobile viewports for optimal rendering performance.

### Performance Optimizations
- **Virtualization**: `react-virtuoso` handles the Detailed Log table, rendering only the rows visible in the viewport to maintain 60fps scrolling with thousands of records.
- **Non-blocking Exports**: The CSV export function offloads string concatenation to a macro-task queue (`setTimeout`), preventing the main thread from blocking the UI during large exports.
- **Memoization**: Heavy visual components (like `MetricCards` and `ChartsSection`) use `React.memo` to prevent unnecessary re-renders during unrelated state updates.

---

## 4. Tech Stack Summary
- **Core**: React 18, Vite
- **Styling**: Vanilla CSS, Lucide React (Icons), Geist Variable Font
- **Visualization**: Recharts
- **Data Grid**: React Virtuoso
- **Data Processing**: SheetJS (xlsx), PapaParse, Date-fns
