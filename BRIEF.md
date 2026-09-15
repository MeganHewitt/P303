# What is this?
A mobile-first web app for retail store associates to manage their shift tasks, look up product locations, and log floor issues. Think a simplified Field Day or ServiceMax — no frills, high contrast, designed to be used one-handed while standing on a retail floor.

## Data
- Generate fake data as JSON files in src/data/
src/data/tasks.json — 8 tasks total:
    - id, title, location (e.g. "Aisle 7 Bay 3"), notes (short string or null)
    - priority ("must-do" or "as-time-allows")
    - status ("pending", "in-progress", "done")
    - relatedSku (string or null, e.g. "SKU-04821")
    - carriedOver (boolean — true if this task was handed off from a previous shift)
- Example tasks:
    - "Restock paper towels" — Aisle 7 Bay 3 — must-do — SKU-04821
    - "Update planogram — Seasonal End Cap 2" — End Cap 2 — must-do — null
    - "Recover softlines" — Section 12 — as-time-allows — null
    - "Price check" — Aisle 3 Bay 1 — as-time-allows — SKU-00234
    - (4 more across both priorities)
- src/data/products.json — 20 product records:
    - id, name, sku, aisle, bay, stockStatus ("In Stock", "Low", "Out")
    - lastRestocked (timestamp string, e.g. "2025-10-14 6:32 AM")
- src/data/managerNotes.json — 3 notes:
    - id, timestamp, text (short — 1–2 sentences each)
    - Example: "End cap 2 reset must be done before noon — vendor rep visiting at 12:30."


## Screens & Layout
- Mobile-first. Target viewport: 390px wide. All tap targets minimum 48px height. Bottom navigation bar (fixed): 4 icons — Tasks, Search, Report, Notes
- Screen 1 — Tasks (default/home)
    - Header bar: store number ("Store #0447"), associate name ("Jordan M."), current date
    - Section: "Must Do Today" — task cards in a vertical list
    - Section: "As Time Allows" — task cards below, visually de-emphasized
    - Each task card shows: title, location, status badge (colored dot + label), carried-over indicator if applicable
    - Tap a card → expands inline to show notes, related SKU, and two action buttons: "Mark In Progress" / "Mark Done"
    - When marked done, card gets a strikethrough and moves to a "Completed" collapsed section at the bottom
- Screen 2 — Product Search
    - Search input auto-focused on screen load
    - Type to filter the products list (filter by name or SKU, client-side only)
    - Results list: product name, SKU, Aisle + Bay location, stock status badge
    - Tap a result → detail card slides up from bottom: full location info, stock status, last restocked timestamp, and a "Flag for Restock" button (tapping shows a confirmation toast only — no data write needed)
- Screen 3 — Report Issue
    - Form with:
        - Issue Type (select/dropdown): "Damaged Product", "Empty Shelf/Peg", "Spill or Hazard", "Pricing Discrepancy", "Other"
        - Location (text input, placeholder: "e.g. Aisle 7 Bay 2")
        - Notes (textarea, optional, max 200 chars, character count shown)
        - Submit button
    - On submit: show a success toast ("Issue reported — manager notified"), reset form
    - No actual data submission needed — just UI behavior
- Screen 4 — Manager Notes
    - Read-only list of notes from managerNotes.json
    - Each note shows: timestamp, text
    - No interactions — just display
- Shift Handoff Modal
    - Triggered by a "End Shift" button in the header (top right, small)
    - Modal opens full-screen on mobile
    - Shows list of uncompleted tasks with a text input next to each for handoff notes (optional)
    - "Submit Handoff" button at bottom → success state with message "Handoff submitted. Have a good one, Jordan." and a disabled submit button
    - No routing needed — modal overlays the current screen

## Interactions
- Task cards: tap to expand/collapse (accordion behavior)
- "Mark In Progress" / "Mark Done": update the card's status badge immediately (local state only)
- "Mark Done": animate card with a brief check transition, then move to completed section
- Product search: filters results live on every keystroke (no search button)
- Product detail: slides up from bottom (bottom sheet pattern), dismissible by tapping outside or dragging down
- Issue form: validate that Issue Type and Location are filled before enabling Submit
- Toast notifications: appear at the top, auto-dismiss after 3 seconds
- Shift Handoff: "End Shift" button in header, opens full-screen modal

## Style
- Background: 
#F1F5F9 (light blue-gray)
- App surface (cards, bottom nav): 
#FFFFFF
- Primary action color: 
#1D4ED8 (blue) — used for primary buttons and active nav icon only
- Status colors: 
#16A34A (green = In Stock / Done), 
#D97706 (amber = Low / In Progress), 
#DC2626 (red = Out / At Risk)
- Text: 
#0F172A (near-black) for primary, 
#64748B for secondary/metadata
- Font: system-ui or Inter; 16px base, 14px for metadata, 20px for screen titles
- Bottom nav: white background, 1px top border 
#E2E8F0, icons with labels below
- No animations except: task done transition (0.2s), bottom sheet slide-up (0.25s ease-out), toast fade-in (0.15s)
- High contrast throughout — must be readable under fluorescent retail lighting

## Tech
- Vue 3 + TypeScript
- Vuetify 3 for layout and UI components
- Chart.js via vue-chartjs for all charts
- Fake data from local JSON files (no API calls)
- Single page — no routing needed