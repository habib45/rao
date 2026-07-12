# ORH / BestFinds - Multi-locale Amazon Affiliate E-Commerce Platform

A modern, performant Amazon affiliate e-commerce platform built with Next.js 15, React 19, and TypeScript. Features multi-locale support, product curation, blog system, and comprehensive admin panel.

## 🚀 Features

- **Multi-locale Support**: English (en), Bengali (bn-BD), Swedish (sv)
- **Product Management**: Curated Amazon products with affiliate tracking
- **Blog System**: SEO-optimized blog with rich text editing
- **Admin Panel**: Production-grade admin interface with approval workflows
- **Search & Discovery**: Advanced product search and filtering
- **Cart System**: localStorage-first cart with optional sync
- **Analytics**: Click tracking and revenue analytics
- **SEO Optimized**: Dynamic sitemaps, structured data, ISR caching

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - App Router with Server Components
- **React 19** - Latest React with strict TypeScript
- **TypeScript** - Full type safety
- **Tailwind CSS v4** - Modern styling with custom theme
- **next-intl** - Internationalization (3 locales)

### Backend
- **MySQL API Gateway** - Express.js REST API (port 4000)
- **MySQL 8.0** - Primary database
- **JWT Authentication** - Admin panel security

### Integrations
- **Amazon PA-API 5.0** - Product data and pricing
- **AI Services** - Gemini, OpenAI, Groq for content generation

### Development Tools
- **Vitest** - Unit and integration testing
- **ESLint** - Code quality and consistency
- **TypeScript** - Static type checking

## 📁 Project Structure

```
orh/
├── src/
│   ├── app/
│   │   ├── [locale]/          # Public storefront (multi-locale)
│   │   ├── admin/             # Admin panel (English only)
│   │   └── api/               # API routes
│   ├── components/            # Shared React components
│   ├── lib/
│   │   ├── api/               # API Gateway clients
│   │   ├── queries/           # Database query helpers
│   │   └── types/             # TypeScript type definitions
│   └── types/domain.ts        # Core domain types
├── messages/                  # Translation files (en, bn-BD, sv)
├── plan/                      # Development phase plans
├── public/                    # Static assets
└── .devin/                    # AI development guidelines
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm, yarn, pnpm, or bun

### 1. Clone and Install

```bash
git clone <repository-url>
cd orh
npm install
```

### 2. Environment Setup

Create `.env.local` with required variables:

```env
# Public (client-safe)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_MYSQL_API_URL=http://localhost:4000

# Server-only (secret — never NEXT_PUBLIC_)
MYSQL_API_SECRET=your-api-secret
MYSQL_API_JWT_TOKEN=your-jwt-token
MYSQL_JWT_SECRET=your-jwt-secret
AMAZON_ACCESS_KEY=your-amazon-access-key
AMAZON_SECRET_KEY=your-amazon-secret-key
AMAZON_PARTNER_TAG=your-associate-tag
GEMINI_API_KEY=your-gemini-key
OPENAI_API_KEY=your-openai-key
GROQ_API_KEY=your-groq-key
```

### 3. Database Setup

Start MySQL and create database:

```sql
CREATE DATABASE orh_platform;
```

Run migrations from `apiGateWay/mysql/` directory.

### 4. Start API Gateway

```bash
cd ../apiGateWay
npm install
npm run dev
```

API Gateway runs on `http://localhost:4000`

### 5. Start Frontend

```bash
cd ../orh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

## 📚 Documentation

- **[AGENT.md](orh/AGENT.md)** - AI agent development guide
- **[PROJECT_CONTEXT.md](orh/PROJECT_CONTEXT.md)** - Comprehensive project context
- **[DEVELOPMENT_PLAN.md](orh/plan/DEVELOPMENT_PLAN.md)** - Master development plan
- **[.devin/RULES.md](.devin/RULES.md)** - Development rules and standards
- **[.devin/PATTERNS.md](.devin/PATTERNS.md)** - Common code patterns

## 🏗 Development Workflow

### Quality Gates

Every change must pass:
1. **TypeScript**: `npx tsc --noEmit` (0 errors)
2. **ESLint**: `npx eslint . --max-warnings 0` (0 warnings)
3. **Tests**: `npm test` (all passing)

### Before Coding

1. Check `plan/DEVELOPMENT_PLAN.md` for current phase
2. Read relevant phase plan in `plan/phase-N/`
3. Review feature documents
4. Check test matrix

### Code Conventions

- Server components by default, add `"use client"` only when needed
- All POST/PATCH inputs validated with Zod
- ISR on all public pages: `export const revalidate = 3600`
- No raw `<img>` — always `next/image` with dimensions
- Follow existing patterns in `.devin/PATTERNS.md`

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### VPS/Docker

```bash
# Build production image
docker build -t orh-platform .

# Run with Docker Compose
docker-compose up -d
```

## 🌍 Multi-locale Support

The platform supports three locales:

- **English (en)** - Default locale
- **Bengali Bangladesh (bn-BD)** - With Noto Sans Bengali font
- **Swedish (sv)** - Nordic market support

Translation files are located in `messages/[locale].json`

## 📊 Admin Panel

Access the admin panel at `/admin` (requires authentication).

Features:
- Dashboard with analytics
- Product management with approval workflow
- Blog content management
- Translation editor
- Media management
- Settings configuration
- Review queues

## 🔗 API Integration

### Amazon PA-API

- Product data synchronization
- Price updates (daily cron)
- Inventory tracking
- Rate limiting and error handling

### API Gateway

All data operations go through the MySQL API Gateway:
- Authentication via JWT
- Rate limiting
- Input validation
- Error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the development workflow
4. Ensure all quality gates pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Projects

- **[API Gateway](../apiGateWay/)** - Express.js backend service
- **[Development Documentation](../.devin/)** - AI development guidelines

---

Built with ❤️ for the Amazon Associates program
