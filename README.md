# Bar Sign-In Application

A React-based web application for managing weekly bar drawings and patron sign-ins. This application helps bars and taverns manage their weekly lucky draw system with patron registration, automated number assignments, and prize rollovers.

## Features

- 🎯 **Patron Registration**: New customers can register with their name and optional contact information
- 🎫 **Automated Number Assignment**: Each patron gets a unique number for drawings
- ✍️ **Weekly Sign-Ins**: Patrons can sign in each week to be eligible for drawings
- 🔍 **Number Lookup**: Patrons can look up their assigned numbers
- 🎲 **Weekly Drawings**: Automated drawing system with prize rollover
- 📊 **Admin Panel**: Manage drawings and view weekly statistics

## Tech Stack

- React 18.2.0 with TypeScript
- Vite for development and building
- Chakra UI for styling and components
- Supabase for database and authentication
- React Router for navigation

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn
- Supabase account and project

## Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:

   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

### Patrons Table

- `id`: UUID
- `name`: String
- `contact`: String (optional)
- `assigned_number`: Integer
- `created_at`: Timestamp

### Sign-Ins Table

- `id`: UUID
- `patron_id`: UUID (references Patrons)
- `week_number`: Integer
- `created_at`: Timestamp

### Drawings Table

- `id`: UUID
- `week_number`: Integer
- `drawn_number`: Integer
- `winner_id`: UUID (references Patrons)
- `prize_amount`: Integer
- `created_at`: Timestamp

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Development

The application is structured into several main components:

- `/src/pages/` - Main page components
- `/src/lib/` - Utility functions and shared logic
- `/src/types/` - TypeScript type definitions
- `/src/App.tsx` - Main application component

## Production Build

To create a production build:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

```

```
