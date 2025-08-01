# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CareCanvas AI is a healthcare application generator that uses natural language prompts to create HIPAA-compliant healthcare forms and applications. It integrates with Anthropic's Claude API and the Healthie healthcare platform.

## Development Commands

- `npm run dev` - Start development server with Turbopack (default port 3000)
- `npm run build` - Build for production 
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture

### Core Components

**Frontend (Next.js 15 with App Router)**
- `src/app/page.tsx` - Main UI for form generation with prompt interface
- `src/app/api/generate/route.ts` - API endpoint that generates forms and optionally deploys them locally
- `src/app/api/projects/route.ts` - API endpoint for managing local project deployments

**AI-Powered Form Generation**
- `src/lib/form-generator.ts` - Core logic using Anthropic Claude API to generate healthcare forms
- `src/lib/healthcare-knowledge.ts` - Comprehensive healthcare domain knowledge and widget definitions
- `src/lib/form-schema.ts` - TypeScript schemas for form specifications

**Healthcare Widget Library**
- `src/components/widgets/` - Specialized healthcare UI components (AvatarPicker, PainMap, PatientDemographics, AssessmentScale)
- `src/components/widgets/index.ts` - Widget registry with metadata for LLM context

**Local Deployment System**
- `src/lib/local-deployment.ts` - Automated deployment of generated forms as standalone Next.js apps
- `generated-apps/` - Directory where locally deployed projects are created

**Healthie Integration**
- `src/lib/healthie.ts` - Apollo GraphQL client configuration for Healthie API
- `src/lib/healthie-schema.ts` - Healthie GraphQL schema definitions

### Key Technologies

- **Next.js 15** with App Router and Turbopack
- **Anthropic Claude API** (@anthropic-ai/sdk) for form generation
- **Healthie SDK** for healthcare data integration
- **Zod** for runtime validation
- **TailwindCSS 4** for styling
- **TypeScript** throughout

### Data Flow

1. User enters natural language prompt describing desired healthcare form
2. Claude API generates structured form specification using healthcare domain knowledge
3. Second Claude API call generates complete React component code
4. System creates deployment package with all necessary files
5. Optional local deployment creates standalone Next.js app in `generated-apps/`

### Environment Variables

Required for full functionality:
- `ANTHROPIC_API_KEY` - For Claude API access
- `NEXT_PUBLIC_HEALTHIE_API_KEY` - For Healthie integration
- `NEXT_PUBLIC_HEALTHIE_API_URL` - Healthie GraphQL endpoint

### Healthcare Compliance

The system implements HIPAA compliance patterns:
- No PHI in console.log statements
- Encrypted data transmission
- Secure session handling
- Clinical validation and risk assessment
- Age-appropriate UI patterns

### Generated Application Structure

Each generated app includes:
- Complete Next.js application with TypeScript
- Healthcare-specific UI components and widgets
- Healthie GraphQL integration for form submission
- HIPAA-compliant security patterns
- Mobile-responsive design with accessibility features

### Development Notes

- Widget components are copied to generated projects from the source widget library
- Local deployments automatically find available ports starting from 3001
- Old generated projects are automatically cleaned up after 24 hours
- Form generation uses extensive healthcare domain knowledge and clinical assessment tools