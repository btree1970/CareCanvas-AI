import { NextRequest, NextResponse } from 'next/server';
import { generateHealthcareApp } from '@/lib/form-generator';
import { deployLocally, GeneratedProject } from '@/lib/local-deployment';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

const GenerateRequestSchema = z.object({
	prompt: z.string().min(1, 'Prompt is required'),
	deployLocally: z.boolean().optional().default(false),
});

// Function to read widget files for deployment
function getWidgetFiles(): Record<string, string> {
	const widgetFiles: Record<string, string> = {};
	const widgetsDir = path.join(process.cwd(), 'src/components/widgets');

	const widgetNames = ['AvatarPicker.tsx', 'PainMap.tsx', 'PatientDemographics.tsx', 'PatientIntakeForm.tsx', 'RefillTracker.tsx', 'index.ts'];

	for (const fileName of widgetNames) {
		try {
			const filePath = path.join(widgetsDir, fileName);
			if (fs.existsSync(filePath)) {
				widgetFiles[`src/components/widgets/${fileName}`] = fs.readFileSync(filePath, 'utf-8');
			}
		} catch (error) {
			console.warn(`Could not read widget file ${fileName}:`, error);
		}
	}

	return widgetFiles;
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { prompt, deployLocally: shouldDeployLocally } = GenerateRequestSchema.parse(body);

		console.log('Generating healthcare app for prompt:', prompt);
		console.log('Deploy locally:', true);

		// Single step: Generate React healthcare application
		const reactCode = await generateHealthcareApp(prompt);
		console.log('Generated React code length:', reactCode.length);

		// Create a basic form spec for compatibility with deployment
		const formSpec = {
			title: `Healthcare Application`,
			description: `Generated from prompt: ${prompt}`,
			healthie_form_id: 'generated_healthcare_app',
			submit_button_text: 'Submit'
		};

		// Step 3: Create deployment package with real widget files
		const widgetFiles = getWidgetFiles();
		const deploymentPackage = {
			'package.json': JSON.stringify({
				name: 'carecanvas-generated-form',
				version: '1.0.0',
				private: true,
				scripts: {
					dev: 'next dev',
					build: 'next build',
					start: 'next start',
				},
				dependencies: {
					'next': '^14.0.0',
					'react': '^18.0.0',
					'react-dom': '^18.0.0',
					'@healthie/sdk': '^1.5.0',
					'@apollo/client': '^3.8.0',
					'graphql': '^16.8.0',
				},
				devDependencies: {
					'@types/node': '^20.0.0',
					'@types/react': '^18.0.0',
					'@types/react-dom': '^18.0.0',
					'typescript': '^5.0.0',
					'tailwindcss': '^4',
					'@tailwindcss/postcss': '^4',
				},
			}, null, 2),
			'next.config.js': `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`,
			'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}`,
			'postcss.config.js': `module.exports = {
  plugins: ["@tailwindcss/postcss"],
}`,
			'src/app/globals.css': `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}`,
			'src/app/layout.tsx': `'use client'

import './globals.css'
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { createHealthieClient } from '../lib/healthie'

// Initialize Apollo Client with fallback
let client: ApolloClient<any>;
try {
  client = createHealthieClient();
} catch (error) {
  console.error('Failed to initialize Healthie client:', error);
  // Create a minimal Apollo Client for development
  client = new ApolloClient({
    link: createHttpLink({ uri: 'https://staging-api.gethealthie.com/graphql' }),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { errorPolicy: 'ignore' },
      query: { errorPolicy: 'ignore' },
      mutate: { errorPolicy: 'ignore' },
    },
  });
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ApolloProvider client={client}>
          {children}
        </ApolloProvider>
      </body>
    </html>
  )
}`,
			'src/app/page.tsx': reactCode,
			'src/lib/healthie.ts': `import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { z } from 'zod';

// Healthie API types based on the GraphQL schema we explored
export const FormAnswerInputSchema = z.object({
  custom_module_id: z.string(),
  answer: z.string(),
  label: z.string().optional(),
  metadata: z.string().optional(),
});

export const CreateFormAnswerGroupInputSchema = z.object({
  user_id: z.string().optional(),
  custom_module_form_id: z.string(),
  finished: z.boolean().default(true),
  form_answers: z.array(FormAnswerInputSchema),
  metadata: z.string().optional(),
});

export type FormAnswerInput = z.infer<typeof FormAnswerInputSchema>;
export type CreateFormAnswerGroupInput = z.infer<typeof CreateFormAnswerGroupInputSchema>;

export function createHealthieClient() {
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_HEALTHIE_API_URL || 'https://staging-api.gethealthie.com/graphql',
  });

  const authLink = setContext((_, { headers }) => {
    const apiKey = process.env.NEXT_PUBLIC_HEALTHIE_API_KEY;
    
    // Only add authorization if API key is present
    if (!apiKey) {
      console.warn('⚠️  NEXT_PUBLIC_HEALTHIE_API_KEY not found. Please check .env.local file.');
      console.log('📖 Setup instructions: https://staging.gethealthie.com/admin/api_keys');
      return { headers };
    }
    
    return {
      headers: {
        ...headers,
        'Authorization': \`Basic \${apiKey}\`,
        'AuthorizationSource': 'API',
      }
    };
  });

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    // Add error handling for development
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
}`,
			'src/lib/graphql-mutations.ts': `import { gql } from '@apollo/client';

// Healthie GraphQL mutation for creating form answer groups
export const CREATE_FORM_ANSWER_GROUP = gql\`
  mutation createFormAnswerGroup($input: createFormAnswerGroupInput) {
    createFormAnswerGroup(input: $input) {
      form_answer_group {
        id
        name
        created_at
        finished
        custom_module_form {
          id
          name
        }
        form_answers {
          id
          answer
          custom_module_id
          label
        }
        user {
          id
          full_name
        }
      }
      messages {
        field
        message
      }
    }
  }
\`;`,
			'README.md': `# Generated Healthcare Application

This application was generated by CareCanvas AI and integrates with the Healthie healthcare platform.

## Quick Start

1. **Install dependencies:**
   \\\`\\\`\\\`bash
   npm install
   \\\`\\\`\\\`

2. **Configure Healthie API:**
   ${process.env.NEXT_PUBLIC_HEALTHIE_API_KEY ? 
   '- ✅ API key automatically inherited from CareCanvas builder' :
   `- Sign up at [Healthie Staging](https://staging.gethealthie.com)
   - Go to Admin > API Keys to generate your key
   - Update \\\`.env.local\\\` with your API key`}

3. **Start development server:**
   \\\`\\\`\\\`bash
   npm run dev
   \\\`\\\`\\\`

4. **Open in browser:**
   Visit [http://localhost:3000](http://localhost:3000)

## Features

- 🏥 HIPAA-compliant healthcare forms
- 📊 Clinical assessment tools (PHQ-9, GAD-7)
- 🗂️ Patient demographics collection
- 🎯 Interactive pain mapping
- 👤 Avatar-based patient engagement
- 🔄 Real-time Healthie EMR integration

## Configuration

${process.env.NEXT_PUBLIC_HEALTHIE_API_KEY ? 
`🎉 **Ready to use!** API key automatically configured from CareCanvas builder.

Current configuration:
\\\`\\\`\\\`
NEXT_PUBLIC_HEALTHIE_API_URL=https://staging-api.gethealthie.com/graphql
NEXT_PUBLIC_HEALTHIE_API_KEY=${process.env.NEXT_PUBLIC_HEALTHIE_API_KEY.substring(0, 8)}...
\\\`\\\`\\\`` :
`Update \\\`.env.local\\\` with your Healthie credentials:

\\\`\\\`\\\`
NEXT_PUBLIC_HEALTHIE_API_URL=https://staging-api.gethealthie.com/graphql
NEXT_PUBLIC_HEALTHIE_API_KEY=your_actual_api_key_here
\\\`\\\`\\\``}

## Healthcare Widgets

This application includes specialized healthcare components:

- **PatientDemographics**: Comprehensive patient intake forms
- **PainMap**: Interactive body diagram for pain assessment  
- **AssessmentScale**: Validated clinical questionnaires
- **AvatarPicker**: Patient engagement and personalization

---

*Generated with ❤️ by [CareCanvas AI](https://carecanvas.ai)*`,
			'.env.local': `# Healthie API Configuration
# ${process.env.NEXT_PUBLIC_HEALTHIE_API_KEY ? '✅ API key inherited from CareCanvas builder' : '⚠️  Get your API key from: https://staging.gethealthie.com/admin/api_keys'}
NEXT_PUBLIC_HEALTHIE_API_URL=https://staging-api.gethealthie.com/graphql
NEXT_PUBLIC_HEALTHIE_API_KEY=${process.env.NEXT_PUBLIC_HEALTHIE_API_KEY || 'your_api_key_here'}

${process.env.NEXT_PUBLIC_HEALTHIE_API_KEY ? 
'# API key automatically configured from CareCanvas builder!' : 
`# Instructions to set up API key:
# 1. Sign up for Healthie at https://staging.gethealthie.com
# 2. Go to Admin > API Keys to generate your key
# 3. Replace 'your_api_key_here' with your actual API key
# 4. Restart the development server: npm run dev`}`,
			'src/components/widgets/index.ts': `// Healthcare Widget Library
'use client'

// Export all widgets with both named and default exports
export { AvatarPicker, default as AvatarPickerDefault } from './AvatarPicker';
export { PainMap, default as PainMapDefault } from './PainMap';
export { PatientDemographics, default as PatientDemographicsDefault } from './PatientDemographics';
export { AssessmentScale, default as AssessmentScaleDefault } from './AssessmentScale';

// For convenience - re-export as default object
export default {
  AvatarPicker,
  PainMap,
  PatientDemographics,
  AssessmentScale
};`,
			// Include actual widget component files
			'src/components/widgets/AvatarPicker.tsx': `'use client'

import React, { useState } from 'react';

interface Avatar {
	id: string;
	name: string;
	imageUrl: string;
	ageGroup: 'infant' | 'child' | 'teen' | 'adult';
	ethnicity: string;
}

interface AvatarPickerProps {
	ageGroup?: 'infant' | 'child' | 'teen' | 'adult';
	onChange: (avatarId: string) => void;
	value?: string;
	className?: string;
}

// Sample avatar data - in production this would come from a comprehensive avatar library
const AVATARS: Avatar[] = [
	{ id: 'child_1', name: 'Alex', imageUrl: '/avatars/child_alex.png', ageGroup: 'child', ethnicity: 'diverse' },
	{ id: 'child_2', name: 'Sam', imageUrl: '/avatars/child_sam.png', ageGroup: 'child', ethnicity: 'diverse' },
	{ id: 'child_3', name: 'Casey', imageUrl: '/avatars/child_casey.png', ageGroup: 'child', ethnicity: 'diverse' },
	{ id: 'child_4', name: 'Jordan', imageUrl: '/avatars/child_jordan.png', ageGroup: 'child', ethnicity: 'diverse' },
	{ id: 'teen_1', name: 'Taylor', imageUrl: '/avatars/teen_taylor.png', ageGroup: 'teen', ethnicity: 'diverse' },
	{ id: 'teen_2', name: 'Morgan', imageUrl: '/avatars/teen_morgan.png', ageGroup: 'teen', ethnicity: 'diverse' },
	{ id: 'adult_1', name: 'Adult 1', imageUrl: '/avatars/adult_1.png', ageGroup: 'adult', ethnicity: 'diverse' },
	{ id: 'adult_2', name: 'Adult 2', imageUrl: '/avatars/adult_2.png', ageGroup: 'adult', ethnicity: 'diverse' },
];

export function AvatarPicker({ ageGroup = 'child', onChange, value, className = '' }: AvatarPickerProps) {
	const [selectedAvatar, setSelectedAvatar] = useState<string>(value || '');

	const filteredAvatars = AVATARS.filter(avatar =>
		ageGroup === 'infant' ? avatar.ageGroup === 'child' : avatar.ageGroup === ageGroup
	);

	const handleAvatarSelect = (avatarId: string) => {
		setSelectedAvatar(avatarId);
		onChange(avatarId);
	};

	return (
		<div className={\`avatar-picker \${className}\`}>
			<div className="mb-4">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					Choose Your Avatar
				</h3>
				<p className="text-sm text-gray-600">
					Select an avatar that represents you best. This helps personalize your healthcare experience.
				</p>
			</div>

			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{filteredAvatars.map((avatar) => (
					<button
						key={avatar.id}
						type="button"
						onClick={() => handleAvatarSelect(avatar.id)}
						className={\`
              relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md
              \${selectedAvatar === avatar.id
								? 'border-blue-500 bg-blue-50 shadow-md'
								: 'border-gray-200 bg-white hover:border-gray-300'
							}
            \`}
						aria-label={\`Select \${avatar.name} avatar\`}
					>
						{/* Avatar Image Placeholder */}
						<div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
							<span className="text-2xl">👤</span>
						</div>

						<p className="text-sm font-medium text-gray-700">{avatar.name}</p>

						{/* Selection indicator */}
						{selectedAvatar === avatar.id && (
							<div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
								<span className="text-white text-xs">✓</span>
							</div>
						)}
					</button>
				))}
			</div>

			{/* Accessibility and engagement features */}
			<div className="mt-4 text-center">
				<p className="text-xs text-gray-500">
					Your avatar helps us make your experience more personal and engaging
				</p>
			</div>
		</div>
	);
}

export { AvatarPicker };
export default AvatarPicker;`,
			// Dynamic widget files added here
			...widgetFiles,
		};

		// Step 4: Deploy locally if requested
		let localProject: GeneratedProject | undefined;

		try {
			console.log('Starting local deployment...');
			localProject = await deployLocally(formSpec.title, deploymentPackage);
			console.log('Local deployment successful:', localProject.url);
		} catch (deployError) {
			console.error('Local deployment failed:', deployError);
			return NextResponse.json({
				success: false,
				error: 'Failed to deploy locally',
				details: deployError instanceof Error ? deployError.message : 'Unknown deployment error',
				formSpec,
				deploymentPackage, // Still return the package for manual use
			}, { status: 500 });
		}

		return NextResponse.json({
			success: true,
			formSpec,
			deploymentPackage,
			localProject,
			message: localProject
				? `Form generated and deployed locally! Visit ${localProject.url}`
				: 'Form generated successfully! Use "Run Locally" to test it.',
		});

	} catch (error) {
		console.error('Error in /api/generate:', error);

		if (error instanceof z.ZodError) {
			return NextResponse.json({
				success: false,
				error: 'Invalid request format',
				details: error.errors,
			}, { status: 400 });
		}

		return NextResponse.json({
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error occurred',
		}, { status: 500 });
	}
}
