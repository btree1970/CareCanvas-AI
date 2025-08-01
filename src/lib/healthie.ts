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

// Medication management types
export const MedicationInputSchema = z.object({
  name: z.string(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  directions: z.string().optional(),
  active: z.boolean().default(true),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  user_id: z.string(),
});

export const UpdateMedicationInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  directions: z.string().optional(),
  active: z.boolean().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type MedicationInput = z.infer<typeof MedicationInputSchema>;
export type UpdateMedicationInput = z.infer<typeof UpdateMedicationInputSchema>;

// Patient intake form data mapping
export interface PatientIntakeFormData {
  demographics: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  medicalHistory: {
    primaryCarePhysician: string;
    insurance: {
      provider: string;
      policyNumber: string;
      groupNumber: string;
    };
    allergies: string[];
    medications: string[];
    medicalConditions: string[];
    surgicalHistory: string[];
    familyHistory: string;
  };
  currentSymptoms: {
    chiefComplaint: string;
    symptoms: {
      description: string;
      onset: string;
      severity: 'mild' | 'moderate' | 'severe';
      duration: string;
      triggers: string;
      alleviatingFactors: string;
    };
    vitalSigns: {
      bloodPressure: string;
      heartRate: string;
      temperature: string;
      weight: string;
      height: string;
    };
  };
}

// Refill tracker data types
export interface RefillRecord {
  id: string;
  patientName: string;
  medication: string;
  lastRefill: string;
  nextRefill: string;
  status: 'overdue' | 'ok' | 'due-soon';
}

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

// Helper functions for transforming widget data to Healthie format

/**
 * Transform PatientIntakeForm data to Healthie form answers
 */
export function transformPatientIntakeToHealthie(
  data: PatientIntakeFormData,
  userId: string,
  formId: string = 'patient_intake_form'
): CreateFormAnswerGroupInput {
  const formAnswers: FormAnswerInput[] = [];

  // Demographics
  formAnswers.push(
    { custom_module_id: 'demographics_first_name', answer: data.demographics.firstName, label: 'First Name' },
    { custom_module_id: 'demographics_last_name', answer: data.demographics.lastName, label: 'Last Name' },
    { custom_module_id: 'demographics_date_of_birth', answer: data.demographics.dateOfBirth, label: 'Date of Birth' },
    { custom_module_id: 'demographics_gender', answer: data.demographics.gender, label: 'Gender' },
    { custom_module_id: 'demographics_phone', answer: data.demographics.phone, label: 'Phone' },
    { custom_module_id: 'demographics_email', answer: data.demographics.email, label: 'Email' },
    { custom_module_id: 'demographics_address', answer: JSON.stringify(data.demographics.address), label: 'Address' },
    { custom_module_id: 'demographics_emergency_contact', answer: JSON.stringify(data.demographics.emergencyContact), label: 'Emergency Contact' }
  );

  // Medical History
  formAnswers.push(
    { custom_module_id: 'medical_primary_care_physician', answer: data.medicalHistory.primaryCarePhysician, label: 'Primary Care Physician' },
    { custom_module_id: 'medical_insurance', answer: JSON.stringify(data.medicalHistory.insurance), label: 'Insurance Information' },
    { custom_module_id: 'medical_allergies', answer: data.medicalHistory.allergies.join(', '), label: 'Allergies' },
    { custom_module_id: 'medical_medications', answer: data.medicalHistory.medications.join(', '), label: 'Current Medications' },
    { custom_module_id: 'medical_conditions', answer: data.medicalHistory.medicalConditions.join(', '), label: 'Medical Conditions' },
    { custom_module_id: 'medical_surgical_history', answer: data.medicalHistory.surgicalHistory.join(', '), label: 'Surgical History' },
    { custom_module_id: 'medical_family_history', answer: data.medicalHistory.familyHistory, label: 'Family History' }
  );

  // Current Symptoms
  formAnswers.push(
    { custom_module_id: 'symptoms_chief_complaint', answer: data.currentSymptoms.chiefComplaint, label: 'Chief Complaint' },
    { custom_module_id: 'symptoms_details', answer: JSON.stringify(data.currentSymptoms.symptoms), label: 'Symptom Details' },
    { custom_module_id: 'vital_signs', answer: JSON.stringify(data.currentSymptoms.vitalSigns), label: 'Vital Signs' }
  );

  return {
    user_id: userId,
    custom_module_form_id: formId,
    finished: true,
    form_answers: formAnswers
  };
}

/**
 * Transform RefillTracker data to medication records
 */
export function transformRefillTrackerToMedications(
  refillRecords: RefillRecord[],
  userId: string
): MedicationInput[] {
  return refillRecords.map(record => ({
    name: record.medication,
    active: record.status !== 'overdue',
    user_id: userId,
    start_date: record.lastRefill,
    end_date: record.nextRefill,
    directions: `Last refill: ${record.lastRefill}, Next refill: ${record.nextRefill}`,
  }));
}

/**
 * Generate form answers for RefillTracker data
 */
export function transformRefillTrackerToHealthie(
  refillRecords: RefillRecord[],
  userId: string,
  formId: string = 'refill_tracker_form'
): CreateFormAnswerGroupInput {
  const formAnswers: FormAnswerInput[] = [];

  refillRecords.forEach((record, index) => {
    formAnswers.push(
      { custom_module_id: `refill_${index}_patient`, answer: record.patientName, label: `Patient ${index + 1}` },
      { custom_module_id: `refill_${index}_medication`, answer: record.medication, label: `Medication ${index + 1}` },
      { custom_module_id: `refill_${index}_last_refill`, answer: record.lastRefill, label: `Last Refill ${index + 1}` },
      { custom_module_id: `refill_${index}_next_refill`, answer: record.nextRefill, label: `Next Refill ${index + 1}` },
      { custom_module_id: `refill_${index}_status`, answer: record.status, label: `Status ${index + 1}` }
    );
  });

  // Add summary statistics
  const overdueCount = refillRecords.filter(r => r.status === 'overdue').length;
  const dueSoonCount = refillRecords.filter(r => r.status === 'due-soon').length;
  const okCount = refillRecords.filter(r => r.status === 'ok').length;

  formAnswers.push(
    { custom_module_id: 'refill_summary_overdue', answer: overdueCount.toString(), label: 'Overdue Count' },
    { custom_module_id: 'refill_summary_due_soon', answer: dueSoonCount.toString(), label: 'Due Soon Count' },
    { custom_module_id: 'refill_summary_ok', answer: okCount.toString(), label: 'OK Count' },
    { custom_module_id: 'refill_summary_total', answer: refillRecords.length.toString(), label: 'Total Records' }
  );

  return {
    user_id: userId,
    custom_module_form_id: formId,
    finished: true,
    form_answers: formAnswers
  };
}