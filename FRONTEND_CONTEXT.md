# FRONTEND CONTEXT - Single Source of Truth

## Backend Configuration
- **Base URL**: `https://log75-x73s4.ondigitalocean.app`
- **API Prefix**: `/api/v1`

## Authentication
- **Model**: PIN-based (no user accounts)
- **Storage**: `localStorage.admin_pin`
- **Header**: `X-ADMIN-PIN` (required for all write operations)
- **Validation Endpoint**: `POST /check-pin`
  - Request: `{ "pin": "1234" }`
  - Response: `{ "valid": true }` or `true`
- **401 Response**: Clear pin from localStorage, redirect to PIN screen

## API Endpoints

### Profiles
- `GET /api/v1/` → `{ "profiles": ["Jeff", "Alice", "Tom"] }`
- `GET /api/v1/{profile_name}` → Profile object
- `POST /api/v1/` (X-ADMIN-PIN) → Create new profile

### Days
- `GET /api/v1/{profile_name}/days` (query: limit, offset, from_day, to_day) → Day[]
- `GET /api/v1/{profile_name}/days/{day_count}` → Day
- `GET /api/v1/{profile_name}/today` → `{ exists: bool, date: string, data: Day }`
- `POST /api/v1/{profile_name}/today` (X-ADMIN-PIN) → Create today
- `PATCH /api/v1/{profile_name}/days/{day_count}` (X-ADMIN-PIN) → Partial update
- `PUT /api/v1/{profile_name}/days/{day_count}` (X-ADMIN-PIN) → Full update

### Stats
- `GET /api/v1/{profile_name}` → Stats object (same endpoint as profile metadata)
- `GET /api/v1/` → Global stats (same endpoint as profiles list)

## Data Models

### Profile
```json
{
  "name": "Jeff",
  "row_count": 42,
  "last_date": "2026-01-13",
  "last_day_count": 42
}
```

### Day
```json
{
  "date": "2026-01-13",
  "day_count": 42,
  "water": true,
  "exercise": false,
  "reading": true,
  "meditation": false,
  "health_food": true
}
```

### Stats
```json
{
  "completion_rate": 85.5,
  "current_streak": 7,
  "longest_streak": 21,
  "today_completion": 3
}
```

## Routing (Hash-based)
- `#/pin` → PIN gate screen
- `#/profiles` → Profile list screen
- `#/profile/{name}` → Profile detail screen

## State Object
```javascript
state = {
  pin: null,
  profiles: [],
  activeProfile: null,
  days: [],
  stats: null,
  today: null,
  loading: false,
  error: null
}
```

## Design System

### Colors
- Background: `#F5F5F5`
- Primary: `#572C57`
- Secondary: `#9F5F91`
- Highlight (today): `#F6EA98`
- Error: `#E26972`

### Style Rules
- Mobile-first responsive design
- Rounded cards (14-18px border-radius)
- Large tap targets (min 44px)
- Switch-style toggles
- System font stack

### Fields
- `water` → Water
- `exercise` → Exercise
- `reading` → Reading
- `meditation` → Meditation
- `health_food` → Healthy Food

## UX Constraints

### PIN Gate
- Single input (password type)
- Unlock button
- Error text with shake animation
- Zero friction experience

### Profiles Screen
- Vertical list of profile cards
- Show name and last active date
- Tap to navigate to profile

### Profile Detail Screen
- Sticky top bar (app name, profile switch, lock icon)
- Summary card (completion %, streaks, today progress)
- Scrollable day list
- Each day: day count (large), date (small), 5 toggles
- Highlight today's row
- "Create Today" button if today doesn't exist
- Immediate PATCH on toggle (optimistic UI)

## Error Handling
- Read failure → retry UI
- Write failure (401) → clear pin, redirect to PIN
- Write failure (other) → revert optimistic update, show toast
- Network down → global banner

## Important Rules
- No frameworks (vanilla JS)
- No hardcoded PIN
- Optimistic UI updates
- Revert on failure
- Mobile-first always
