# WiseBond Home Loan Application - replit.md

## Overview

WiseBond is a comprehensive home loan application platform built with React, TypeScript, Express.js, and PostgreSQL. The application provides bond calculation tools, user management, agent functionality, and PDF report generation. It's designed for the South African market with specific features like prime rate integration from SARB (South African Reserve Bank) and Mailgun email services.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Query (@tanstack/react-query) for server state
- **Build Tool**: Vite with modern ES modules
- **Component Library**: Radix UI primitives with custom theming
- **Maps Integration**: Google Maps API for location services

### Backend Architecture
- **Runtime**: Node.js 20.x with Express.js
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Session-based auth with bcrypt password hashing
- **OAuth**: Google OAuth2 integration
- **Email Service**: Mailgun for transactional emails
- **PDF Generation**: Puppeteer with custom HTML templates

### Data Storage Solutions
- **Primary Database**: Azure PostgreSQL Flexible Server with VNet integration
- **Development Fallback**: Local PostgreSQL or in-memory storage
- **Session Storage**: Memory-based sessions with Redis-style functionality
- **Secret Management**: Azure Key Vault for production, Replit Secrets for development

## Key Components

### User Management System
- User registration with OTP email verification
- Password reset functionality
- Profile management with co-applicant support
- OAuth integration (Google)
- Session management with persistent login

### Bond Calculator Engine
- Standard bond repayment calculations
- Additional payment analysis with time/interest savings
- Prime rate integration from SARB API
- PDF report generation with charts and visualizations
- Budget category tracking and expense management

### Email Service Infrastructure
- Welcome emails for new users
- OTP verification emails
- Password reset emails
- Calculation result sharing
- Multi-provider support (Mailgun primary, SendGrid backup)

### Agent/Agency System
- Real estate agency management
- Agent profiles and applications
- Application tracking with milestones
- Document management system
- Notification system for agents

### PDF Report Generation
- Dynamic HTML templates with embedded charts
- Server-side rendering with Puppeteer
- Professional branding and formatting
- Chart generation using SVG for scalability

## Data Flow

1. **User Registration**: User submits form → OTP sent via Mailgun → Email verification → Account creation
2. **Calculations**: User inputs → Calculation engine → Results stored → Optional PDF generation → Optional email sharing
3. **Authentication**: Login attempt → Session creation → Database user lookup → Session persistence
4. **Prime Rate**: Background service → SARB API → Cache for 24 hours → Serve to calculators
5. **PDF Generation**: Calculation data → HTML template → Puppeteer rendering → PDF buffer → Client download

## External Dependencies

### Azure Services
- **PostgreSQL Flexible Server**: Primary database with private endpoints
- **Key Vault**: Secret management for production environment
- **App Service**: Deployment target with native Node.js support

### Third-Party APIs
- **Mailgun**: Email delivery service (wisebond.co.za domain)
- **Google OAuth**: Authentication provider
- **Google Maps**: Location services and address lookup
- **SARB API**: South African Reserve Bank prime rate data

### Development Tools
- **Replit**: Development environment with built-in PostgreSQL
- **GitHub Actions**: CI/CD pipeline for Azure deployment
- **npm**: Package management with security auditing

## Deployment Strategy

### Production Deployment (Azure)
- **Target**: Azure App Service with native Node.js runtime
- **Database**: Azure PostgreSQL with SSL and private endpoints
- **Secrets**: Azure Key Vault integration
- **SSL**: DigiCert certificates for database connections
- **Build Process**: Vite frontend build + esbuild backend bundling

### Development Environment
- **Local**: Replit with PostgreSQL module
- **Database**: Local PostgreSQL instance or fallback storage
- **Secrets**: Replit Secrets or .env file
- **Hot Reload**: Vite dev server with Express middleware

### Security Features
- SSL-only database connections with certificate validation
- Environment-based secret management
- Session security with httpOnly cookies
- Input validation with Zod schemas
- SQL injection prevention with parameterized queries

## Changelog
- June 24, 2025. Initial setup
- June 25, 2025. Property management system implemented with loan scenario modeling
- June 25, 2025. Azure Key Vault integration completed for WiseBondVault with graceful fallback
- June 25, 2025. Database credentials validated and Key Vault setup documented for production deployment
- June 25, 2025. Implemented three-tier database connection strategy: (1) Key Vault + Azure Auth, (2) Hardcoded + Azure Auth, (3) Simple username/password

## User Preferences

Preferred communication style: Simple, everyday language.