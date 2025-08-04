import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
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
        'Authorization': `Basic ${apiKey}`,
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
}