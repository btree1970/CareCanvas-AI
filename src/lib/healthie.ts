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
  user_id: z.string(),
  custom_module_form_id: z.string(),
  finished: z.boolean().default(true),
  form_answers: z.array(FormAnswerInputSchema),
  metadata: z.string().optional(),
});

export type FormAnswerInput = z.infer<typeof FormAnswerInputSchema>;
export type CreateFormAnswerGroupInput = z.infer<typeof CreateFormAnswerGroupInputSchema>;

// Create Apollo Client for Healthie
export function createHealthieClient() {
  const httpLink = createHttpLink({
    uri: process.env.HEALTHIE_API_URL || 'https://api.gethealthie.com/graphql',
  });

  const authLink = setContext((_, { headers }) => {
    const apiKey = process.env.HEALTHIE_API_KEY;
    
    if (!apiKey) {
      throw new Error('HEALTHIE_API_KEY environment variable is required');
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
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
}

// Healthie SDK configuration for generated apps
export const healthieConfig = {
  apiUrl: process.env.HEALTHIE_API_URL || 'https://api.gethealthie.com/graphql',
  getAuthHeaders: () => ({
    'Authorization': `Basic ${process.env.HEALTHIE_API_KEY}`,
    'AuthorizationSource': 'API',
  }),
};