import { z } from 'zod';

// Form field types including healthcare widgets
export const FieldTypeSchema = z.enum([
  // Basic HTML field types
  'text',
  'email', 
  'number',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'date',
  'tel',
  'url',
  // Healthcare widget types
  'patient_demographics',
  'pain_map',
  'avatar_picker',
  'assessment_scale',
  'pain_scale',
  'medication_list',
  'insurance_capture'
]);

export const FieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const FormFieldSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string(),
  type: FieldTypeSchema,
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(FieldOptionSchema).optional(), // for select/radio fields
  validation: z.object({
    min: z.union([z.number(), z.string().transform(Number)]).optional(),
    max: z.union([z.number(), z.string()]).optional(), // Allow string values like "current_date"
    pattern: z.string().optional(),
  }).optional(),
  // Additional healthcare-specific fields
  hipaa_sensitive: z.boolean().optional(),
  clinical_coding: z.string().optional(),
  fields: z.array(FormFieldSchema).optional(), // For nested fields like patient_demographics
}).passthrough()); // Allow additional fields

export const FormSpecSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
  healthie_form_id: z.string(), // The custom_module_form_id in Healthie
  submit_button_text: z.string().default('Submit'),
}).passthrough(); // Allow additional fields like app_type, target_audience, etc.

export type FieldType = z.infer<typeof FieldTypeSchema>;
export type FieldOption = z.infer<typeof FieldOptionSchema>;
export type FormField = z.infer<typeof FormFieldSchema>;
export type FormSpec = z.infer<typeof FormSpecSchema>;

// Helper function to generate form field mappings for Healthie
export function generateHealthieMapping(fields: FormField[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  fields.forEach((field, index) => {
    // For now, we'll use the field ID as the custom_module_id
    // In a real implementation, you'd map to actual Healthie custom module IDs
    mapping[field.id] = `custom_module_${index + 1}`;
  });
  
  return mapping;
}