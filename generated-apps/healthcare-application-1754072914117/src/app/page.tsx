'use client'

import React, { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { PatientIntakeForm } from '../components/widgets';
import { CREATE_FORM_ANSWER_GROUP } from '../lib/graphql-mutations';
import type { PatientIntakeData } from '../components/widgets';
import type { CreateFormAnswerGroupInput } from '../lib/healthie';

const NewPatientIntakeForm: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState<PatientIntakeData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Healthie mutation
  const [createFormAnswerGroup] = useMutation(CREATE_FORM_ANSWER_GROUP);

  // Validation functions
  const validateForm = (data: PatientIntakeData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.firstName?.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!data.lastName?.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!data.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    }
    if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Valid email is required';
    }
    if (!data.phone?.trim() || !/^[\d\s\-\(\)\+]{10,}$/.test(data.phone)) {
      errors.phone = 'Valid phone number is required';
    }
    if (!data.medications?.length) {
      errors.medications = 'Please list current medications or indicate none';
    }
    if (!data.allergies?.length) {
      errors.allergies = 'Please list allergies or indicate none';
    }
    if (!data.chiefComplaint?.trim()) {
      errors.chiefComplaint = 'Chief complaint is required';
    }

    return errors;
  };

  // Handle form changes
  const handleFormChange = useCallback((data: PatientIntakeData) => {
    setFormData(data);
    setErrors({});
  }, []);

  // Prepare form data for Healthie submission
  const prepareFormAnswers = (data: PatientIntakeData) => {
    return Object.entries(data).map(([key, value]) => ({
      custom_module_id: `intake_${key}`,
      answer: Array.isArray(value) ? value.join(', ') : String(value),
      label: key.replace(/([A-Z])/g, ' $1').toLowerCase() // Convert camelCase to spaces
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const input: CreateFormAnswerGroupInput = {
        custom_module_form_id: 'primary_care_intake_form',
        finished: true,
        form_answers: prepareFormAnswers(formData)
      };

      const response = await createFormAnswerGroup({
        variables: { input }
      });

      // Handle successful submission
      if (response.data?.createFormAnswerGroup?.form_answer_group) {
        alert('Form submitted successfully');
        setFormData({}); // Reset form
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({
        submit: 'Failed to submit form. Please try again or contact support.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          New Patient Registration
        </h1>
        <p className="text-gray-600">
          Please complete all required fields for your medical record.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PatientIntakeForm
          value={formData}
          onChange={handleFormChange}
          className="space-y-4"
        />

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <ul className="list-disc list-inside text-red-600">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPatientIntakeForm;