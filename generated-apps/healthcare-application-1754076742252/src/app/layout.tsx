'use client'

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
}