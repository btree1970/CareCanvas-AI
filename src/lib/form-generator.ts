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

**CRITICAL: Only use healthcare widgets that are specifically relevant to the user's request. Most basic intake forms only need PatientDemographics + regular HTML form fields.**

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
- Our widgets: { AvatarPicker, PainMap, PatientDemographics, PatientIntakeForm, RefillTracker } from '../components/widgets'
- Apollo Client: { useMutation } from '@apollo/client'
- GraphQL: { CREATE_FORM_ANSWER_GROUP, CREATE_MEDICATION, UPDATE_MEDICATION } from '../lib/graphql-mutations'
- Healthie types: { CreateFormAnswerGroupInput, FormAnswerInput, MedicationInput } from '../lib/healthie'
- Widget types: { PatientIntakeData, RefillRecord } from '../components/widgets'
- Tailwind CSS classes

## WIDGET SELECTION GUIDELINES (CRITICAL):
**ONLY include widgets that are specifically relevant to the user's request. Do NOT add widgets just because they exist.**

### When to use each widget:
- **PatientDemographics**: Use for basic intake forms (demographics, contact info, insurance)
- **PatientIntakeForm**: Use for comprehensive patient intake with full medical history, medications, allergies, symptoms
- **PainMap**: ONLY for pain assessments, orthopedic visits, post-surgical follow-ups, injury evaluations
- **AvatarPicker**: ONLY for pediatric forms or when patient engagement is specifically mentioned
- **RefillTracker**: ONLY for medication management, pharmacy coordination, practice dashboards, refill monitoring

### Examples:
- "Primary care intake" → PatientDemographics + basic text fields (NO PainMap)
- "Basic intake form" → PatientDemographics + chief complaint field
- "Comprehensive patient intake" → PatientIntakeForm (includes demographics, medical history, symptoms, allergies)
- "New patient intake with medical history" → PatientIntakeForm
- "Annual physical intake" → PatientIntakeForm
- "Pain clinic assessment" → PatientDemographics + PainMap
- "Pediatric intake" → PatientDemographics + AvatarPicker
- "Children's form" → PatientDemographics + AvatarPicker
- "Medication refill tracker" → RefillTracker
- "Practice dashboard for medications" → RefillTracker
- "Pharmacy coordination form" → RefillTracker

### Common fields for basic intake (use regular HTML inputs):
- Chief complaint (textarea)
- Medical history (textarea or checkboxes)
- Current medications (textarea)
- Allergies (textarea)
- Family history (textarea)
- Review of systems (checkboxes)

### IMPORTANT TYPE USAGE:
- When using **PatientIntakeForm** widget, use **PatientIntakeData** interface (flat structure with firstName, lastName, etc.)
- Do NOT use PatientIntakeFormData (that's for Healthie integration only)
- Widget returns: { firstName: string, lastName: string, address: {...}, ... }

### ARRAY FIELD VALIDATION:
PatientIntakeForm widget has these ARRAY fields that need special handling:
- allergies: string[] - validate with: data.allergies?.length > 0
- medications: string[] - validate with: data.medications?.length > 0  
- medicalConditions: string[] - validate with: data.medicalConditions?.length > 0
- surgicalHistory: string[] - validate with: data.surgicalHistory?.length > 0
- Do NOT use .trim() on array fields!

## REQUIREMENTS:
1. Generate a complete React component (TypeScript)
2. Use proper HIPAA security patterns
3. Include form validation (inline, simple functions)
4. Integrate with Healthie via CREATE_FORM_ANSWER_GROUP mutation
5. **Use ONLY widgets that match the clinical context of the request**
6. Include accessibility features
7. Handle errors and loading states

## EXAMPLE STRUCTURE:
\`\`\`typescript
'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { PatientDemographics, PatientIntakeForm } from '../components/widgets'; // Import only what you need based on the request
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
  
  // Field change handler (wrapped in useCallback to prevent infinite re-renders)
  const handleFieldChange = useCallback((fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear errors when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  }, [errors]);
  
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