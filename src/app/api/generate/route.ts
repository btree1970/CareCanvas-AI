import { NextRequest, NextResponse } from 'next/server';
import { generateFormSpec, generateReactForm } from '@/lib/form-generator';
import { deployLocally, GeneratedProject } from '@/lib/local-deployment';
import { z } from 'zod';

const GenerateRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  deployLocally: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, deployLocally: shouldDeployLocally } = GenerateRequestSchema.parse(body);

    console.log('Generating form for prompt:', prompt);
    console.log('Deploy locally:', shouldDeployLocally);

    // Step 1: Generate form specification from natural language
    const formSpec = await generateFormSpec(prompt);
    console.log('Generated form spec:', formSpec);

    // Step 2: Generate React code using the form spec
    const reactCode = await generateReactForm(formSpec);
    console.log('Generated React code length:', reactCode.length);

    // Step 3: Create deployment package
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
          'tailwindcss': '^3.3.0',
          'postcss': '^8.4.0',
          'autoprefixer': '^10.4.0',
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
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;`,
      'app/layout.tsx': `import './globals.css'

export const metadata = {
  title: '${formSpec.title}',
  description: '${formSpec.description || 'Generated healthcare form'}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
      'app/page.tsx': reactCode,
      'lib/healthie.ts': `import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

export function createHealthieClient() {
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_HEALTHIE_API_URL || 'https://api.gethealthie.com/graphql',
  });

  const authLink = setContext((_, { headers }) => {
    const apiKey = process.env.NEXT_PUBLIC_HEALTHIE_API_KEY;
    
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
  });
}`,
      '.env.local': `NEXT_PUBLIC_HEALTHIE_API_URL=https://api.gethealthie.com/graphql
NEXT_PUBLIC_HEALTHIE_API_KEY=your_api_key_here`,
    };

    // Step 4: Deploy locally if requested
    let localProject: GeneratedProject | undefined;
    
    if (shouldDeployLocally) {
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