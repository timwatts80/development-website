# Daily Tracker

A modern habit and task tracking application built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Authentication** - Secure login with Google and GitHub
- 📊 **Habit Tracking** - Create and track daily habits with streaks
- ✅ **Task Management** - Organize tasks with priorities and due dates
- 📱 **Mobile-First Design** - Responsive design that works great on all devices
- 🎨 **Beautiful UI** - Clean, modern interface with Tailwind CSS
- 🗄️ **Database Integration** - PostgreSQL with Prisma ORM

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Authentication:** NextAuth.js v5
- **Database:** PostgreSQL + Prisma
- **UI Icons:** Lucide React
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google OAuth credentials (optional)
- GitHub OAuth credentials (optional)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd daily-tracking
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - OAuth credentials for Google/GitHub

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Database Schema

The app uses the following main models:
- **User** - User accounts and authentication
- **Habit** - Trackable habits with frequency and targets
- **Task** - Individual tasks with priorities and due dates
- **Entry** - Daily habit completion records

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### iOS App (Future)

This codebase is designed to be mobile-friendly and can be converted to a native iOS app using:
- React Native (with shared components)
- Capacitor (hybrid approach)
- Progressive Web App (PWA)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.
