import Anthropic from '@anthropic-ai/sdk';
import { FormSpec, FormSpecSchema } from './form-schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateFormSpec(userPrompt: string): Promise<FormSpec> {
  const systemPrompt = `
You are a healthcare form specification generator. Convert natural language descriptions into structured JSON form specifications.

Available field types: text, email, number, textarea, select, checkbox, radio

Output ONLY valid JSON in this format:
{
  "title": "Form Title",
  "description": "Brief description of the form purpose",
  "fields": [
    {
      "id": "field_name",
      "type": "text|email|number|textarea|select|checkbox|radio",
      "label": "Field Label",
      "placeholder": "Placeholder text (optional)",
      "required": true|false,
      "options": [{"label": "Option 1", "value": "option1"}] // only for select/radio
    }
  ],
  "healthie_form_id": "form_123", // placeholder ID
  "submit_button_text": "Submit Form"
}

Guidelines:
- Keep field IDs simple (e.g., "name", "email", "symptoms")
- Use appropriate field types for the data being collected
- Make required fields that are essential for healthcare
- For medical forms, include relevant fields like symptoms, medical history, etc.
- Keep forms focused and not too long (max 10 fields for MVP)

User request: "${userPrompt}"
`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: systemPrompt,
      },
    ],
  });

  try {
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Expected text response from Anthropic');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsedSpec = JSON.parse(jsonMatch[0]);
    return FormSpecSchema.parse(parsedSpec);
  } catch (error) {
    console.error('Error parsing form spec:', error);
    throw new Error(`Failed to generate form specification: ${error.message}`);
  }
}

export async function generateReactForm(formSpec: FormSpec): Promise<string> {
  const systemPrompt = `
You are a React code generator that creates healthcare forms using the Healthie SDK.

Generate a complete React component that:
1. Uses the @healthie/sdk Form component for Healthie integration
2. Includes proper TypeScript types
3. Uses Tailwind CSS for styling
4. Handles form submission to Healthie
5. Includes proper error handling

Return ONLY the complete React component code, no explanations.

Here's the template structure:
\`\`\`tsx
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { Form } from '@healthie/sdk';
import { createHealthieClient } from './lib/healthie';
import '@healthie/sdk/dist/styles/index.css';

const client = createHealthieClient();

interface FormData {
  // Add interface based on form fields
}

export default function GeneratedForm() {
  const handleFormSubmit = (data: FormData) => {
    console.log('Form submitted:', data);
    // Form automatically submits to Healthie
  };

  return (
    <ApolloProvider client={client}>
      <div className="max-w-2xl mx-auto p-6 bg-white">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {formSpec.title}
          </h1>
          {formSpec.description && (
            <p className="text-gray-600">{formSpec.description}</p>
          )}
        </div>
        
        <Form
          id="{formSpec.healthie_form_id}"
          onSubmit={handleFormSubmit}
        />
      </div>
    </ApolloProvider>
  );
}
\`\`\`

Form specification: ${JSON.stringify(formSpec, null, 2)}
`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 3000,
    messages: [
      {
        role: 'user',
        content: systemPrompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Expected text response from Anthropic');
  }

  // Extract the React component code
  const codeMatch = content.text.match(/```tsx\n([\s\S]*?)```/);
  if (!codeMatch) {
    throw new Error('No React code found in response');
  }

  return codeMatch[1];
}