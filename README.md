# IdonneoApp

A comprehensive fitness application for managing workouts, nutrition, and healthy habits.

## Features

- Authentication & Onboarding
- Weekly Planner (Workouts + Nutrition)
- Workout Management
- Nutrition & Recipe Management
- Shopping Lists
- Newsletter & Publications
- User Profile & Settings

## Getting Started

### Prerequisites

- Node.js (Latest LTS version)
- npm or yarn
- Expo CLI
- iOS Simulator (for Mac) or Android Emulator

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd idonneoapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm start
```

## Development

The project uses:
- React Native with Expo
- TypeScript
- expo-router for navigation
- Zustand for state management
- Supabase for backend
- expo-sqlite for offline storage

## Project Structure

```
src/
├── app/              # App routes
├── components/       # Reusable components
└── lib/             # Utilities and configurations
```

## License

[License Type] - See LICENSE file for details
