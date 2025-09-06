# Custom Hooks Documentation

This directory contains custom React hooks that encapsulate all Supabase database operations for the Bar Sign-In application. These hooks provide a clean separation of concerns and improve code reusability and maintainability.

## Architecture Overview

The hooks system is organized into several specialized modules:

- **usePatrons**: Patron-related operations (search, create, retrieve)
- **useSignIns**: Sign-in management and status checking
- **useDrawings**: Weekly drawing operations and management
- **useWeekStats**: Comprehensive week statistics and data aggregation
- **useWeekUtils**: Date and week calculation utilities

## Hook Descriptions

### `usePatrons()`

Handles all patron-related database operations.

**Methods:**

- `searchPatrons(query: string): Promise<Patron[]>` - Search patrons by name or assigned number
- `getPatronById(id: string): Promise<Patron | null>` - Get patron by database ID
- `getPatronByNumber(assignedNumber: number): Promise<Patron | null>` - Get patron by assigned number
- `getAllPatrons(): Promise<Patron[]>` - Get all patrons (used for drawings)
- `createPatron(patronData: CreatePatronData): Promise<Patron>` - Create new patron with auto-assigned number

**Usage:**

```tsx
const { searchPatrons, createPatron } = usePatrons();

// Search for patrons
const patrons = await searchPatrons("John");

// Create new patron
const newPatron = await createPatron({
  name: "Jane Doe",
  contact: "(920)555-0123",
});
```

### `useSignIns()`

Manages sign-in operations and status checking.

**Methods:**

- `checkSignInStatus(patronId: string, weekNumber: number): Promise<boolean>` - Check if patron signed in for specific week
- `checkMultipleSignInStatus(patronIds: string[], weekNumber: number): Promise<Set<string>>` - Batch check sign-in status
- `createSignIn(patronId: string, weekNumber: number): Promise<SignIn>` - Create new sign-in record
- `getWeekSignIns(weekNumber: number): Promise<SignIn[]>` - Get all sign-ins for a week
- `getWeekSignInIds(weekNumber: number): Promise<string[]>` - Get patron IDs who signed in for a week
- `enrichPatronsWithSignInStatus(patrons: Patron[], weekNumber: number): Promise<Patron[]>` - Add sign-in status to patron objects

**Usage:**

```tsx
const { createSignIn, enrichPatronsWithSignInStatus } = useSignIns();

// Create sign-in
await createSignIn(patronId, weekNumber);

// Enrich search results with sign-in status
const patronsWithStatus = await enrichPatronsWithSignInStatus(
  patrons,
  weekNumber
);
```

### `useDrawings()`

Handles weekly drawing operations.

**Methods:**

- `getDrawingByWeek(weekNumber: number): Promise<Drawing | null>` - Get drawing for specific week
- `getLatestDrawing(): Promise<{prize_amount: number; winner_id?: string} | null>` - Get most recent drawing
- `performDrawing(weekNumber, prizeAmount, allPatrons, signedInPatronIds): Promise<DrawingResult>` - Execute weekly drawing
- `deleteDrawing(weekNumber: number): Promise<void>` - Delete drawing (dev/testing only)

**Usage:**

```tsx
const { performDrawing, getDrawingByWeek } = useDrawings();

// Perform drawing
const result = await performDrawing(
  weekNumber,
  prizeAmount,
  allPatrons,
  signedInPatronIds
);

// Check if drawing exists
const existingDrawing = await getDrawingByWeek(weekNumber);
```

### `useWeekStats()`

Provides comprehensive week statistics and data aggregation.

**Methods:**

- `fetchWeekStats(): Promise<WeekStats>` - Get complete week statistics including sign-ins, prize amount, and drawing status
- `getCurrentWeek(): number` - Get current week number

**Usage:**

```tsx
const { fetchWeekStats } = useWeekStats();

const stats = await fetchWeekStats();
// Returns: { weekNumber, signInCount, prizeAmount, isDrawingDone, effectiveWeek, latestDrawing? }
```

### `useWeekUtils()`

Utility functions for date and week calculations.

**Methods:**

- `getCurrentWeek(): number` - Calculate current week number based on ISO week standard

**Usage:**

```tsx
const { getCurrentWeek } = useWeekUtils();

const currentWeek = getCurrentWeek();
```

## Type Definitions

All hooks use TypeScript interfaces defined in `src/types/database.ts`:

- `Patron` - Patron record with optional sign-in status
- `CreatePatronData` - Data for creating new patrons
- `SignIn` - Sign-in record
- `Drawing` - Drawing record
- `WeekStats` - Comprehensive week statistics
- `DrawingResult` - Result of performing a drawing

## Error Handling

All hooks follow consistent error handling patterns:

- Database errors are thrown and should be caught by the calling component
- Components should use try/catch blocks and display appropriate user feedback
- Toast notifications are handled at the component level, not in hooks

## Benefits

1. **Separation of Concerns**: Database logic is separated from UI components
2. **Reusability**: Common operations can be shared across components
3. **Consistency**: Standardized error handling and data formatting
4. **Testability**: Hooks can be unit tested independently
5. **Type Safety**: Full TypeScript support with proper return types
6. **Maintainability**: Single source of truth for database operations

## Migration Notes

The refactoring replaced direct Supabase calls in components with these hooks:

- **SignIn.tsx**: Now uses `usePatrons`, `useSignIns`, and `useWeekUtils`
- **Admin.tsx**: Now uses `useWeekStats`, `useDrawings`, `usePatrons`, and `useSignIns`
- **Registration.tsx**: Now uses `usePatrons`, `useSignIns`, and `useWeekUtils`
- **NumberLookup.tsx**: Now uses `usePatrons`

## Future Enhancements

Potential improvements to the hooks system:

1. **Caching**: Add React Query or SWR for data caching and synchronization
2. **Real-time Updates**: Integrate Supabase real-time subscriptions
3. **Optimistic Updates**: Add optimistic UI updates for better UX
4. **Pagination**: Add pagination support for large datasets
5. **Validation**: Add client-side validation before database calls
