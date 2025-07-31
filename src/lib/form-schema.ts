import { z } from 'zod';

// Simple form field types for MVP
export const FieldTypeSchema = z.enum([
  'text',
  'email', 
  'number',
  'textarea',
  'select',
  'checkbox',
  'radio'
]);

export const FieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const FormFieldSchema = z.object({
  id: z.string(),
  type: FieldTypeSchema,
  label: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z.array(FieldOptionSchema).optional(), // for select/radio fields
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
  }).optional(),
});

export const FormSpecSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema),
  healthie_form_id: z.string(), // The custom_module_form_id in Healthie
  submit_button_text: z.string().default('Submit'),
});

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