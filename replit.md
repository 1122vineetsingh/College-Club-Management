# Club Management System

## Overview

This is a full-stack club management system built for educational institutions to manage student clubs, events, memberships, and administrative tasks. The application provides role-based access control with different permissions for administrators, faculty, club heads, and regular members. It features a modern React frontend with shadcn/ui components and an Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern component-based architecture using functional components and hooks
- **shadcn/ui Component Library**: Comprehensive UI components built on Radix UI primitives with Tailwind CSS styling
- **Routing**: Client-side routing implemented with Wouter for lightweight navigation
- **State Management**: TanStack Query (React Query) for server state management and data fetching
- **Form Handling**: React Hook Form with Zod schema validation for type-safe form management
- **Styling**: Tailwind CSS with CSS custom properties for theming, supporting both light and dark modes
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Express.js Server**: RESTful API with middleware for authentication, logging, and error handling
- **Authentication**: Passport.js with local strategy using scrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod schemas shared between frontend and backend for consistent data validation
- **Role-Based Access Control**: Multi-tier user roles (admin, faculty, club_head, member) with appropriate permissions

### Database Design
- **Users Table**: Stores user credentials, roles, and profile information with UUID primary keys
- **Clubs Table**: Club information with creator tracking and active status flags
- **Events Table**: Event management linked to clubs with participant limits and scheduling
- **Memberships Table**: Junction table handling club memberships with approval workflow
- **Event Registrations Table**: Tracks user participation in events with attendance status

### Authentication and Authorization
- **Session-Based Authentication**: Secure server-side sessions with PostgreSQL persistence
- **Password Security**: Scrypt-based password hashing with salt for secure credential storage
- **Protected Routes**: Frontend route protection with authentication checks and role-based access
- **Middleware Security**: Request logging, CORS handling, and trust proxy configuration for production deployment

## External Dependencies

### Database and ORM
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL for cloud deployment
- **Drizzle ORM**: Type-safe database queries and migrations with PostgreSQL dialect
- **connect-pg-simple**: PostgreSQL session store integration for Express sessions

### UI and Styling
- **Radix UI**: Accessible, unstyled UI primitives for components like dialogs, dropdowns, and form controls
- **Tailwind CSS**: Utility-first CSS framework with custom theming variables
- **Lucide React**: Consistent icon library for UI elements
- **embla-carousel**: Touch-friendly carousel component for image galleries

### Development and Build Tools
- **Vite**: Fast build tool with React plugin and development server
- **TypeScript**: Static typing for both frontend and backend code
- **ESBuild**: Fast bundler for production server builds
- **Replit Integration**: Development environment plugins for runtime error handling and debugging

### Form and Validation
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: TypeScript-first schema validation for forms and API endpoints
- **@hookform/resolvers**: Integration between React Hook Form and Zod validation

### Utilities and Helpers
- **date-fns**: Date manipulation and formatting utilities
- **clsx & class-variance-authority**: Dynamic class name generation and component variants
- **nanoid**: Secure URL-friendly unique ID generation