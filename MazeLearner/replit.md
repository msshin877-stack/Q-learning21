# Overview

This is a maze-solving Q-learning application built with React and Express. The application allows users to train a reinforcement learning agent (Q-learning algorithm) to navigate through randomly generated mazes. Users can configure maze parameters (size, wall density) and learning parameters (learning rate, discount factor, exploration rate) to observe how different settings affect the agent's learning performance. The application provides real-time visualization of the training process, showing the agent's position, path exploration, and learning statistics.

# User Preferences

Preferred communication style: Simple, everyday language.
Maze generation algorithm: Recursive backtracker algorithm (requested on 2025-01-12).
Path visualization: Color-coded frequency tracking showing robot's learning progress (requested on 2025-01-12).
Fullscreen functionality: Added fullscreen button for better maze viewing on big screen (requested on 2025-01-12).
Robot path trail: Blue trail showing robot movement that clears when returning to entrance (requested on 2025-01-12).

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React hooks for local state, TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Canvas Rendering**: HTML5 Canvas for maze visualization and agent animation

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Server Structure**: Modular design with separate route handlers and storage abstraction
- **Data Storage**: In-memory storage with interface abstraction for potential database integration
- **Development Setup**: Vite development server with HMR integration
- **Build Process**: ESBuild for server bundling, Vite for client bundling

## Core Components
- **Maze Generator**: Procedural maze generation with configurable wall density and path validation
- **Q-Learning Agent**: Implementation of Q-learning algorithm with configurable parameters
- **Training Engine**: Episode-based training loop with real-time statistics tracking
- **Visualization Engine**: Canvas-based rendering of maze, agent position, and exploration heat maps
- **Path Visualization**: Real-time color-coded path tracking showing visit frequency with blue-to-red gradient

## Data Models
- **User Schema**: Basic user model with Drizzle ORM and Zod validation
- **Maze Configuration**: Size and wall density parameters
- **Learning Parameters**: Learning rate, discount factor, exploration rate, and animation speed
- **Training Statistics**: Episode counts, success rates, performance metrics

## Development Features
- **Hot Module Replacement**: Vite integration for fast development
- **Type Safety**: Full TypeScript coverage with strict configuration
- **Code Organization**: Shared types and utilities between client and server
- **Path Aliases**: Configured imports for cleaner code organization

# External Dependencies

## Database
- **Drizzle ORM**: Database toolkit with PostgreSQL dialect configuration
- **Neon Database**: Serverless PostgreSQL database (configured but not actively used)
- **Schema Management**: Drizzle Kit for migrations and schema management

## UI and Styling
- **Shadcn/ui**: Pre-built component library with Radix UI primitives
- **Radix UI**: Headless UI components for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework with custom theme configuration
- **Lucide React**: Icon library for UI elements

## State Management and Data Fetching
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with Zod validation
- **Hookform Resolvers**: Integration between React Hook Form and validation libraries

## Development and Build Tools
- **Vite**: Frontend build tool and development server
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Type checking and compilation
- **PostCSS**: CSS processing with Tailwind CSS plugin

## Utility Libraries
- **Class Variance Authority**: Utility for creating component variants
- **CLSX**: Conditional className utility
- **Date-fns**: Date manipulation and formatting
- **Nanoid**: URL-safe unique ID generator
- **SweetAlert2**: Enhanced alert and modal dialogs

## Deployment and Runtime
- **Node.js**: Runtime environment with ESM support
- **Connect-pg-simple**: PostgreSQL session store (configured but not used)
- **Replit Integration**: Development environment integration with error overlay and cartographer