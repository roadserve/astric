# AI SME Copilot - Project Structure

## Overview

This document provides a comprehensive overview of the project structure, architecture, and key components.

## Directory Structure

```
all_crm/
├── mobile/                          # Flutter mobile application
│   ├── android/                     # Android-specific files
│   ├── ios/                         # iOS-specific files
│   ├── lib/
│   │   ├── core/                    # Core functionality
│   │   │   ├── config/              # App configuration
│   │   │   │   ├── app_config.dart
│   │   │   │   ├── supabase_config.dart
│   │   │   │   └── firebase_config.dart
│   │   │   ├── router/              # Navigation
│   │   │   │   └── app_router.dart
│   │   │   ├── theme/               # UI theming
│   │   │   │   └── app_theme.dart
│   │   │   └── providers/           # Global providers
│   │   │       └── auth_provider.dart
│   │   ├── features/                # Feature modules
│   │   │   ├── auth/                # Authentication
│   │   │   │   ├── presentation/
│   │   │   │   │   └── pages/
│   │   │   │   │       ├── login_page.dart
│   │   │   │   │       ├── register_page.dart
│   │   │   │   │       └── phone_verification_page.dart
│   │   │   ├── organization/        # Organization management
│   │   │   ├── dashboard/           # Main dashboard
│   │   │   ├── billing/             # Invoicing & payments
│   │   │   │   ├── domain/
│   │   │   │   │   └── models/
│   │   │   │   │       └── invoice_model.dart
│   │   │   │   ├── data/
│   │   │   │   │   └── repositories/
│   │   │   │   │       └── invoice_repository.dart
│   │   │   │   └── presentation/
│   │   │   │       ├── pages/
│   │   │   │       └── providers/
│   │   │   ├── customers/           # Customer management
│   │   │   ├── products/            # Product catalog
│   │   │   ├── payroll/             # Payroll & attendance
│   │   │   ├── whatsapp/            # WhatsApp CRM
│   │   │   ├── ai/                  # AI Copilot features
│   │   │   └── settings/            # App settings
│   │   └── main.dart                # App entry point
│   └── pubspec.yaml                 # Flutter dependencies
│
├── web/                             # Next.js web dashboard
│   ├── app/                         # Next.js 13+ app directory
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   ├── login/                   # Login page
│   │   ├── register/                # Registration page
│   │   └── dashboard/               # Dashboard pages
│   ├── components/                  # React components
│   │   └── ui/                      # UI components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── label.tsx
│   ├── lib/                         # Utilities
│   │   ├── utils.ts                 # Helper functions
│   │   └── supabase.ts              # Supabase client
│   ├── public/                      # Static assets
│   ├── package.json                 # Node dependencies
│   ├── next.config.js               # Next.js configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   ├── tsconfig.json                # TypeScript config
│   └── postcss.config.js            # PostCSS config
│
├── supabase/                        # Supabase backend
│   ├── config.toml                  # Supabase configuration
│   ├── seed.sql                     # Sample data
│   ├── migrations/                  # Database migrations
│   │   ├── 20231201000001_initial_schema.sql
│   │   ├── 20231201000002_rls_policies.sql
│   │   ├── 20231201000003_functions_and_triggers.sql
│   │   └── 20231201000004_cron_jobs.sql
│   └── functions/                   # Edge Functions
│       ├── ai_invoice_parse/        # OCR invoice scanning
│       ├── whatsapp_send/           # WhatsApp messaging
│       ├── create_invoice_pdf/      # PDF generation
│       ├── file_gst/                # GST filing
│       ├── payroll_run/             # Payroll processing
│       ├── ai_reply_suggest/        # AI reply suggestions
│       ├── usage_billing_job/       # Usage tracking
│       └── webhook_inbound/         # Webhook handler
│
├── docs/                            # Documentation
│   ├── README.md                    # Main documentation
│   ├── SETUP.md                     # Setup guide
│   ├── DEPLOYMENT.md                # Deployment guide
│   └── PROJECT_STRUCTURE.md         # This file
│
├── .gitignore                       # Git ignore rules
└── LICENSE                          # MIT License

```

## Architecture Overview

### Mobile App (Flutter)

**Architecture Pattern**: Clean Architecture with Riverpod

**Layers**:
1. **Presentation Layer**: UI components, pages, and state management
2. **Domain Layer**: Business logic and models
3. **Data Layer**: Repositories and data sources

**State Management**: Riverpod (Provider-based)

**Navigation**: go_router

### Web Dashboard (Next.js)

**Architecture Pattern**: Server-Side Rendering (SSR) with API routes

**Key Features**:
- Server Components for better performance
- Client Components for interactivity
- API routes for backend integration
- Tailwind CSS for styling
- shadcn/ui components

### Backend (Supabase)

**Components**:
1. **PostgreSQL Database**: Relational database with Row Level Security
2. **Authentication**: Built-in auth with email/phone support
3. **Realtime**: WebSocket connections for live updates
4. **Storage**: File storage for documents and images
5. **Edge Functions**: Serverless functions for business logic

## Database Schema

### Core Tables

1. **organizations**: Company/organization data
2. **profiles**: User profile information
3. **organization_members**: User-organization relationships with roles

### Business Tables

4. **customers**: Customer directory
5. **products**: Product/service catalog
6. **invoices**: Invoice records
7. **invoice_items**: Invoice line items
8. **payments**: Payment transactions

### HR Tables

9. **employees**: Employee information
10. **attendance**: Attendance tracking
11. **payroll**: Payroll calculations

### Marketing Tables

12. **whatsapp_campaigns**: WhatsApp marketing campaigns
13. **campaign_recipients**: Campaign recipient tracking

### AI Tables

14. **ai_tasks**: AI processing task queue
15. **usage_tracking**: Feature usage analytics

## Key Features

### 1. Authentication & Authorization

- Email/phone authentication via Supabase Auth
- Multi-organization support (users can belong to multiple orgs)
- Role-based access control (owner, manager, accountant, hr, staff)
- Row Level Security (RLS) policies

### 2. Billing & Invoicing

- Create and manage invoices
- Auto-calculate GST
- Generate PDF invoices
- Track payments (UPI, cash, bank transfer)
- Payment reminders
- Outstanding dues tracking

### 3. GST Assistant

- Auto-calculate GST from invoices
- Generate GSTR-1 and GSTR-3B JSON
- Validate GSTIN
- Identify missing tax information
- Export GST reports

### 4. Payroll & Attendance

- QR code check-in/out
- GPS location tracking
- Automatic salary calculation
- PF and ESI deductions
- Generate payslips
- Attendance reports

### 5. WhatsApp CRM

- Customer directory with tags
- Message campaigns with templates
- Delivery and read tracking
- AI-powered reply suggestions
- Bulk messaging
- Campaign analytics

### 6. AI Copilot

- OCR invoice scanning
- Smart payment reminders
- Festive offer generation (Hindi/English)
- Query assistant for business insights
- Customer intent detection
- Automated responses

### 7. Analytics Dashboard

- Sales and revenue reports
- Customer analytics
- Payroll summaries
- Campaign performance
- Usage metering
- Custom date ranges

### 8. Admin Portal

- Organization management
- Subscription tracking
- Support impersonation
- System monitoring
- Audit logs
- Error tracking

## Edge Functions

### 1. ai_invoice_parse
- **Purpose**: Parse invoice images using OCR
- **Input**: File URL, organization ID
- **Output**: Structured invoice data

### 2. whatsapp_send
- **Purpose**: Send WhatsApp messages via Business API
- **Input**: Campaign ID, organization ID
- **Output**: Delivery status

### 3. create_invoice_pdf
- **Purpose**: Generate PDF from invoice data
- **Input**: Invoice ID
- **Output**: PDF URL

### 4. file_gst
- **Purpose**: Generate GST filing data
- **Input**: Period, organization ID
- **Output**: GSTR-1 and GSTR-3B JSON

### 5. payroll_run
- **Purpose**: Calculate payroll for all employees
- **Input**: Organization ID, period
- **Output**: Payroll records

### 6. ai_reply_suggest
- **Purpose**: Generate AI reply suggestions
- **Input**: Customer message, intent, language
- **Output**: Suggested replies

### 7. usage_billing_job
- **Purpose**: Track daily feature usage
- **Input**: None (cron job)
- **Output**: Usage records

### 8. webhook_inbound
- **Purpose**: Handle WhatsApp webhooks
- **Input**: Webhook payload
- **Output**: Status update

## Database Functions

### Utility Functions

- `calculate_invoice_totals()`: Auto-calculate invoice totals
- `generate_invoice_number()`: Generate sequential invoice numbers
- `check_invoice_payment_status()`: Update invoice status based on payments
- `mark_overdue_invoices()`: Mark invoices as overdue daily
- `track_usage()`: Track feature usage

### Analytics Functions

- `get_organization_stats()`: Get comprehensive org statistics
- `get_monthly_revenue()`: Get monthly revenue breakdown
- `get_overdue_invoices_for_reminders()`: Find invoices needing reminders

## Cron Jobs

1. **mark-overdue-invoices**: Daily at 1 AM - Mark overdue invoices
2. **usage-billing-job**: Daily at 2 AM - Track usage and calculate billing
3. **payment-reminders**: Daily at 10 AM - Send payment reminders
4. **cleanup-old-ai-tasks**: Weekly on Sunday at 3 AM - Clean up old logs
5. **daily-stats-aggregation**: Daily at midnight - Aggregate daily statistics

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Restrict access to organization members only
- Enforce role-based permissions
- Prevent unauthorized data access
- Allow public access where specified (per requirements)

### Authentication

- Secure password hashing
- JWT-based sessions
- Email verification
- Phone OTP verification
- Multi-factor authentication support

### Data Protection

- Encrypted connections (HTTPS/WSS)
- Secure storage of sensitive data
- Environment variables for secrets
- Service role key protection
- API rate limiting

## Performance Optimizations

### Database

- Strategic indexes on frequently queried columns
- Connection pooling
- Query optimization
- Materialized views for complex reports
- Partitioning for large tables (future)

### Caching

- Browser caching for static assets
- API response caching
- CDN for global content delivery
- Local storage for offline support

### Mobile App

- Lazy loading of features
- Image optimization
- Efficient state management
- Pagination for large lists
- Background sync

## Testing Strategy

### Unit Tests
- Business logic functions
- Utility functions
- Model serialization

### Integration Tests
- API endpoints
- Database functions
- Edge functions

### E2E Tests
- User flows
- Payment processing
- Campaign sending

## Monitoring & Logging

- Supabase logs for database and functions
- Sentry for error tracking
- Custom analytics events
- Performance monitoring
- Usage tracking

## Deployment

- **Mobile**: Google Play Store & Apple App Store
- **Web**: Vercel (or similar)
- **Backend**: Supabase managed hosting
- **CI/CD**: GitHub Actions (recommended)

## Future Enhancements

- [ ] Multi-language support (Hindi, regional languages)
- [ ] Advanced AI features (predictive analytics)
- [ ] Integration with accounting software (Tally, QuickBooks)
- [ ] Mobile offline mode
- [ ] Voice commands
- [ ] AR features for inventory
- [ ] Blockchain for invoice verification
- [ ] Advanced reporting and BI
- [ ] White-label solutions
- [ ] API for third-party integrations

## Contributing

See CONTRIBUTING.md for guidelines on how to contribute to this project.

## Support

For support, please contact:
- Email: support@aismecopilot.com
- Documentation: docs.aismecopilot.com
- Community: community.aismecopilot.com

## License

MIT License - see LICENSE file for details.
