import Anthropic from '@anthropic-ai/sdk';
import { HEALTHCARE_KNOWLEDGE } from './healthcare-knowledge';
import { generateWidgetDocumentation } from '../components/widgets';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function generateLiveHealthieSchemaContext(): Promise<string> {
  return `
## HEALTHIE GRAPHQL API INTEGRATION:

### Form Submission Pattern:
\`\`\`graphql
mutation createFormAnswerGroup($input: createFormAnswerGroupInput) {
  createFormAnswerGroup(input: $input) {
    form_answer_group {
      id
      name
      created_at
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
    }
    messages {
      field
      message
    }
  }
}
\`\`\`

### Input Structure:
- **custom_module_form_id**: String - The ID of the form template
- **user_id**: String - The patient ID
- **finished**: Boolean - Whether the form is complete
- **form_answers**: Array of FormAnswerInput objects
  - **custom_module_id**: String - The field ID
  - **answer**: String - The user's response
  - **label**: String - The field label

### Best Practices:
- Use meaningful custom_module_form_id values
- Include proper field labels for accessibility
- Handle validation errors from the API response
- Store form_answer_group.id for future reference
`;
}

// Single-step healthcare app generator
export async function generateHealthcareApp(userPrompt: string): Promise<string> {
  const healthieSchemaContext = await generateLiveHealthieSchemaContext();
  
  const systemPrompt = `
You are an expert React developer creating HIPAA-compliant healthcare applications with Healthie EMR integration.

${healthieSchemaContext}

## HEALTHCARE DOMAIN KNOWLEDGE:
### Common Workflows:
${JSON.stringify(HEALTHCARE_KNOWLEDGE.workflows, null, 2)}

### Clinical Assessment Tools:
${JSON.stringify(HEALTHCARE_KNOWLEDGE.assessments, null, 2)}

### Medical Field Categories:
${JSON.stringify(HEALTHCARE_KNOWLEDGE.medical_fields, null, 2)}

## AVAILABLE HEALTHCARE WIDGETS:
${generateWidgetDocumentation()}

## AVAILABLE DEPENDENCIES (ONLY USE THESE):
- React hooks: useState, useEffect, useMemo
- Our widgets: { AvatarPicker, PainMap, PatientDemographics, AssessmentScale } from '../components/widgets'
- Apollo Client: { useMutation } from '@apollo/client'
- GraphQL: { CREATE_FORM_ANSWER_GROUP } from '../lib/graphql-mutations'
- Healthie types: { CreateFormAnswerGroupInput, FormAnswerInput } from '../lib/healthie'
- Tailwind CSS classes

## REQUIREMENTS:
1. Generate a complete React component (TypeScript)
2. Use proper HIPAA security patterns
3. Include form validation (inline, simple functions)
4. Integrate with Healthie via CREATE_FORM_ANSWER_GROUP mutation
5. Use appropriate healthcare widgets
6. Include accessibility features
7. Handle errors and loading states

## EXAMPLE STRUCTURE:
\`\`\`typescript
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { AvatarPicker, PainMap, PatientDemographics, AssessmentScale } from '../components/widgets';
import { CREATE_FORM_ANSWER_GROUP } from '../lib/graphql-mutations';
import { CreateFormAnswerGroupInput } from '../lib/healthie';

const MyHealthcareForm: React.FC = () => {
  // State management
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Apollo mutation
  const [createFormAnswerGroup] = useMutation(CREATE_FORM_ANSWER_GROUP);
  
  // Simple validation functions
  const validateEmail = (email: string) => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[\\d\\s\\-\\(\\)\\+]{10,}$/.test(phone);
  
  // Field change handler
  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear errors when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };
  
  // Get field label for Healthie submission
  const getFieldLabel = (fieldId: string): string => {
    const fieldLabels: Record<string, string> = {
      // Add mappings based on your form fields
    };
    return fieldLabels[fieldId] || fieldId.replace('_', ' ');
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await createFormAnswerGroup({
        variables: {
          input: {
            custom_module_form_id: 'healthcare_form_123',
            finished: true,
            form_answers: Object.entries(formData).map(([id, answer]) => ({
              custom_module_id: id,
              answer: String(answer),
              label: getFieldLabel(id)
            }))
          }
        }
      });
      
      console.log('Form submitted successfully:', response);
    } catch (error) {
      console.error('Submission error:', error);
      setErrors(prev => ({ ...prev, submit: 'Failed to submit form. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Healthcare Form</h1>
        <p className="text-gray-600">Please provide accurate information for your healthcare record.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Use healthcare widgets and form fields here */}
        
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{errors.submit}</p>
          </div>
        )}
        
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Healthcare Information'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MyHealthcareForm;
\`\`\`

User Request: ${userPrompt}

Generate a complete, working React healthcare application following the above pattern:
`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
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
  const codeMatch = content.text.match(/```typescript\n([\s\S]*?)\n```/) || 
                   content.text.match(/```tsx\n([\s\S]*?)\n```/) ||
                   content.text.match(/```jsx\n([\s\S]*?)\n```/);
  
  if (codeMatch) {
    return codeMatch[1];
  }
  
  // If no code blocks found, return the whole response (fallback)
  return content.text;
}

// Legacy function for backward compatibility (will be removed)
export async function generateFormSpec(userPrompt: string): Promise<any> {
  console.warn('generateFormSpec is deprecated. Use generateHealthcareApp instead.');
  return { title: 'Legacy', description: 'Use generateHealthcareApp', fields: [], healthie_form_id: 'deprecated' };
}

// Legacy function for backward compatibility (will be removed)
export async function generateReactForm(formSpec: any): Promise<string> {
  console.warn('generateReactForm is deprecated. Use generateHealthcareApp instead.');
  return generateHealthcareApp('Create a basic healthcare form');
}