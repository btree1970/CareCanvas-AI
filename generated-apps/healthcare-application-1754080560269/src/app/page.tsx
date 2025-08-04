'use client'

import React, { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { PatientIntakeForm } from '../components/widgets';
import { CREATE_FORM_ANSWER_GROUP } from '../lib/graphql-mutations';
import type { PatientIntakeData } from '../components/widgets';
import type { CreateFormAnswerGroupInput } from '../lib/healthie';

const PrimaryCareIntakeForm: React.FC = () => {
  // Form state
  const [formData, setFormData] = useState<Partial<PatientIntakeData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Healthie integration
  const [createFormAnswerGroup] = useMutation(CREATE_FORM_ANSWER_GROUP);

  // Validation functions
  const validateForm = (data: Partial<PatientIntakeData>): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!data.firstName?.trim()) newErrors.firstName = 'First name is required';
    if (!data.lastName?.trim()) newErrors.lastName = 'Last name is required';
    if (!data.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!data.email?.trim()) newErrors.email = 'Email is required';
    if (!data.phone?.trim()) newErrors.phone = 'Phone number is required';
    
    // Array field validation
    if (!data.allergies?.length) newErrors.allergies = 'Please list any allergies or indicate none';
    if (!data.medications?.length) newErrors.medications = 'Please list current medications or indicate none';
    if (!data.medicalConditions?.length) newErrors.medicalConditions = 'Please list medical conditions or indicate none';

    // Email format validation
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone format validation
    if (data.phone && !/^\d{10}$/.test(data.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    return newErrors;
  };

  // Handle form changes
  const handleFormChange = useCallback((data: Partial<PatientIntakeData>) => {
    setFormData(data);
    // Clear errors as user types
    setErrors({});
  }, []);

  // Convert form data to Healthie format
  const prepareHealthieData = (data: Partial<PatientIntakeData>): CreateFormAnswerGroupInput => {
    return {
      custom_module_form_id: 'primary_care_intake_form',
      finished: true,
      form_answers: Object.entries(data).map(([key, value]) => ({
        custom_module_id: key,
        answer: Array.isArray(value) ? value.join(', ') : String(value),
        label: key.replace(/([A-Z])/g, ' $1').toLowerCase() // Convert camelCase to readable label
      }))
    };
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate form
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const healthieData = prepareHealthieData(formData);
      const response = await createFormAnswerGroup({
        variables: { input: healthieData }
      });

      if (response.data?.createFormAnswerGroup?.messages?.length) {
        throw new Error(response.data.createFormAnswerGroup.messages[0].message);
      }

      // Success handling
      alert('Form submitted successfully!');
      setFormData({});
      
    } catch (error) {
      console.error('Submission error:', error);
      setErrors({
        submit: 'There was an error submitting your form. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          New Patient Registration
        </h1>
        <p className="text-gray-600">
          Please complete all required fields to register as a new patient.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main intake form widget */}
        <PatientIntakeForm
          value={formData}
          onChange={handleFormChange}
          className="space-y-4"
        />

        {/* Error display */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <ul className="list-disc list-inside text-red-600">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-live="polite"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrimaryCareIntakeForm;