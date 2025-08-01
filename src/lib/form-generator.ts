import Anthropic from '@anthropic-ai/sdk';
import { FormSpec, FormSpecSchema } from './form-schema';
import { HEALTHCARE_KNOWLEDGE, HEALTHCARE_WIDGETS } from './healthcare-knowledge';
import { WIDGET_REGISTRY, generateWidgetDocumentation } from '../components/widgets';
import { generateHealthieSchemaDoc } from './healthie-schema';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function generateFormSpec(userPrompt: string): Promise<FormSpec> {
  const systemPrompt = `
You are an expert healthcare application generator with deep knowledge of medical workflows, clinical assessments, and HIPAA compliance.

## HEALTHCARE DOMAIN KNOWLEDGE:

### Common Workflows:
${JSON.stringify(HEALTHCARE_KNOWLEDGE.workflows, null, 2)}

### Clinical Assessment Tools:
${JSON.stringify(HEALTHCARE_KNOWLEDGE.assessments, null, 2)}

### Medical Field Categories:
${JSON.stringify(HEALTHCARE_KNOWLEDGE.medical_fields, null, 2)}

### Available Healthcare Widgets:
${generateWidgetDocumentation()}

## FIELD TYPES AVAILABLE:
Basic: text, email, number, textarea, select, checkbox, radio
Healthcare: patient_demographics, pain_scale, medication_list, assessment_scale, avatar_picker, insurance_capture

## OUTPUT FORMAT:
Return ONLY valid JSON in this structure:
{
  "title": "Form Title",
  "description": "Clinical purpose and context",
  "app_type": "patient_intake|clinical_assessment|appointment_booking|symptom_tracker",
  "target_audience": "patient|provider|parent_guardian",
  "age_group": "adult|pediatric_0_2|pediatric_3_7|pediatric_8_12|adolescent_13_17",
  "fields": [
    {
      "id": "field_name",
      "type": "field_type",
      "label": "Clinical appropriate label",
      "placeholder": "Helpful placeholder text",
      "required": true|false,
      "validation": {
        "pattern": "regex_if_needed",
        "min": number,
        "max": number
      },
      "options": [{"label": "Option", "value": "value"}], // for select/radio
      "clinical_coding": "SNOMED_CT|ICD_10|CPT", // if applicable
      "hipaa_sensitive": true|false
    }
  ],
  "healthie_form_id": "generated_form_id",
  "submit_button_text": "Contextually appropriate text",
  "estimated_completion_time": "X minutes",
  "clinical_validation": {
    "auto_scoring": true|false,
    "risk_assessment": true|false,
    "clinical_alerts": ["condition1", "condition2"]
  }
}

## HEALTHCARE-SPECIFIC GUIDELINES:
1. Use medically accurate terminology
2. Include appropriate validation for clinical data
3. Consider age-appropriate language and interactions
4. Mark PHI fields with hipaa_sensitive: true
5. For assessments, include proper scoring mechanisms
6. Suggest relevant clinical coding when applicable
7. Optimize for healthcare workflows and user types

## USER REQUEST:
"${userPrompt}"

Generate a healthcare-appropriate application specification:
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
    
    // Debug: log the generated spec
    console.log('Generated spec:', JSON.stringify(parsedSpec, null, 2));
    
    // For backward compatibility, ensure basic FormSpec structure
    const compatibleSpec = {
      title: parsedSpec.title,
      description: parsedSpec.description,
      fields: parsedSpec.fields,
      healthie_form_id: parsedSpec.healthie_form_id || 'custom_form_1',
      submit_button_text: parsedSpec.submit_button_text || 'Submit'
    };
    
    // Debug: log the compatible spec
    console.log('Compatible spec:', JSON.stringify(compatibleSpec, null, 2));
    
    return FormSpecSchema.parse(compatibleSpec);
  } catch (error) {
    console.error('Error parsing form spec:', error);
    throw new Error(`Failed to generate form specification: ${error.message}`);
  }
}

export async function generateReactForm(formSpec: FormSpec): Promise<string> {
  const systemPrompt = `
You are an expert React developer creating HIPAA-compliant healthcare applications using the Healthie SDK and modern healthcare UI patterns.

## HEALTHCARE CONTEXT:
Form Specification: ${JSON.stringify(formSpec, null, 2)}

## AVAILABLE HEALTHCARE WIDGETS:
${generateWidgetDocumentation()}

## WIDGET IMPORT EXAMPLES:
\`\`\`tsx
import { AvatarPicker, PainMap, PatientDemographics, AssessmentScale } from './components/widgets';

// Example usage:
<AvatarPicker 
  ageGroup="child" 
  onChange={(avatarId) => setFormData({...formData, avatar: avatarId})} 
/>

<PainMap 
  bodyType="adult"
  maxPoints={5}
  onChange={(painPoints) => setFormData({...formData, pain: painPoints})} 
/>

<PatientDemographics 
  required={['firstName', 'lastName', 'dateOfBirth']}
  onChange={(demographics) => setFormData({...formData, patient: demographics})} 
/>

<AssessmentScale 
  scaleType="PHQ-9"
  onChange={(responses, result) => setFormData({...formData, assessment: result})} 
/>
\`\`\`

## HIPAA COMPLIANCE REQUIREMENTS:
${JSON.stringify(HEALTHCARE_KNOWLEDGE.hipaa_requirements, null, 2)}

## HEALTHCARE UI PATTERNS:
${JSON.stringify(HEALTHCARE_KNOWLEDGE.ui_patterns, null, 2)}

## HEALTHIE GRAPHQL INTEGRATION:
${generateHealthieSchemaDoc()}

## GENERATE A COMPLETE REACT HEALTHCARE APPLICATION:

Requirements:
1. **HIPAA Compliance**: No PHI in console.log, secure data handling, audit trails
2. **Healthcare UX**: Patient-friendly design, accessibility (WCAG 2.1 AA), mobile-first
3. **Healthie Integration**: Uses @healthie/sdk properly with authentication
4. **Clinical Accuracy**: Proper medical terminology, validated input patterns
5. **Error Handling**: Healthcare-appropriate error messages and validation
6. **Progress Indicators**: Clear completion progress for longer forms
7. **Age-Appropriate Design**: Adapt UI based on target age group

## COMPONENT STRUCTURE:
\`\`\`tsx
import React, { useState, useEffect } from 'react';
import { ApolloProvider } from '@apollo/client';
import { Form } from '@healthie/sdk';
import { createHealthieClient } from './lib/healthie';
import '@healthie/sdk/dist/styles/index.css';

const client = createHealthieClient();

// TypeScript interfaces for form data
interface FormData {
  [key: string]: any;
}

// Healthcare-specific validation functions
const validateMedicalData = (data: FormData) => {
  // Include appropriate medical data validation
};

// HIPAA-compliant logging
const logSecurely = (event: string, metadata?: any) => {
  // Log without PHI, include audit trail information
};

export default function HealthcareForm() {
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Healthcare-appropriate form submission
  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      logSecurely('form_submission_started');
      
      // Validate healthcare data
      const validation = validateMedicalData(data);
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      // Submit to Healthie with proper error handling
      // Include clinical validation and risk assessment
      
      logSecurely('form_submission_completed');
    } catch (error) {
      logSecurely('form_submission_error', { error_type: error.name });
      // Show healthcare-appropriate error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ApolloProvider client={client}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
        {/* HIPAA Privacy Notice */}
        <div className="bg-blue-600 text-white px-4 py-2 text-sm">
          🔒 This form is HIPAA-compliant and your health information is protected
        </div>

        <div className="max-w-4xl mx-auto p-6">
          {/* Header with clinical context */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {formSpec.title}
            </h1>
            {formSpec.description && (
              <p className="text-lg text-gray-600 mb-4">{formSpec.description}</p>
            )}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                ✓ Secure • ✓ HIPAA Compliant • ✓ Encrypted
              </p>
            </div>
          </div>

          {/* Progress indicator for multi-step forms */}
          <div className="mb-8">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: \`\${(currentStep / totalSteps) * 100}%\` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Step {currentStep} of {totalSteps} • Estimated time: {estimatedTime}
            </p>
          </div>

          {/* Main form using Healthie SDK */}
          <div className="bg-white rounded-lg shadow-lg">
            <Form
              id={formSpec.healthie_form_id}
              onSubmit={handleSubmit}
              className="p-6"
            />
          </div>

          {/* Healthcare-specific footer */}
          <div className="mt-8 text-center text-xs text-gray-500">
            <p>
              Protected Health Information (PHI) is encrypted and secure. 
              By submitting this form, you acknowledge our HIPAA Privacy Notice.
            </p>
          </div>
        </div>
      </div>
    </ApolloProvider>
  );
}
\`\`\`

Generate the complete, production-ready healthcare React component. Include:
- Age-appropriate styling and interactions
- Clinical validation patterns
- HIPAA compliance measures
- Healthcare accessibility features
- Proper error handling
- Medical terminology accuracy

Return ONLY the complete React component code without explanations or markdown formatting.
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
  const codeMatch = content.text.match(/```tsx\n([\s\S]*?)```/);
  if (codeMatch) {
    return codeMatch[1];
  }

  // If no code block found, return the entire content (LLM might not use code blocks)
  return content.text;
}