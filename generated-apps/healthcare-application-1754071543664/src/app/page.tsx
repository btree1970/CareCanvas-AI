'use client'

import React, { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { PatientIntakeForm } from '../components/widgets';
import { CREATE_FORM_ANSWER_GROUP } from '../lib/graphql-mutations';
import type { PatientIntakeData } from '../components/widgets';
import type { CreateFormAnswerGroupInput } from '../lib/healthie';

const PrimaryCarePatienceIntake: React.FC = () => {
  const [formData, setFormData] = useState<PatientIntakeData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createFormAnswerGroup] = useMutation(CREATE_FORM_ANSWER_GROUP);

  // Validation functions
  const validateForm = (data: PatientIntakeData): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Required field validation
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
    if (data.phone && !/^[\d\s\-\(\)\+]{10,}$/.test(data.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    return newErrors;
  };

  const handleFormChange = useCallback((data: PatientIntakeData) => {
    setFormData(data);
    // Clear errors when user makes changes
    setErrors({});
  }, []);

  const formatFormDataForHealthie = (data: PatientIntakeData) => {
    // Map our form fields to Healthie Patient Intake Form field IDs
    const fieldMapping: Record<string, string> = {
      firstName: '18920922', // Name
      lastName: '18920922', // Name (combined with firstName)
      dateOfBirth: '18920924', // Date of Birth
      phone: '18920925', // Phone
      gender: '18920927', // Gender
      chiefComplaint: '18920935', // Main concerns/reason for seeking care
      primaryCarePhysician: '18920934', // Primary Care Physician
    };

    const formAnswers = [];

    // Handle name field (combine first and last name)
    if (data.firstName || data.lastName) {
      formAnswers.push({
        custom_module_id: '18920922',
        answer: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        label: 'Name'
      });
    }

    // Handle other mapped fields
    Object.entries(fieldMapping).forEach(([key, moduleId]) => {
      if (key !== 'firstName' && key !== 'lastName' && data[key as keyof PatientIntakeData]) {
        const value = data[key as keyof PatientIntakeData];
        formAnswers.push({
          custom_module_id: moduleId,
          answer: Array.isArray(value) ? value.join(', ') : String(value),
          label: key.replace(/([A-Z])/g, ' $1').toLowerCase()
        });
      }
    });

    // Handle address if present
    if (data.address) {
      const addressString = `${data.address.street || ''}, ${data.address.city || ''}, ${data.address.state || ''} ${data.address.zipCode || ''}`.trim();
      if (addressString && addressString !== ', ,') {
        formAnswers.push({
          custom_module_id: '18920926', // Address
          answer: addressString,
          label: 'Address'
        });
      }
    }

    // Handle emergency contact if present
    if (data.emergencyContact && (data.emergencyContact.name || data.emergencyContact.phone)) {
      const emergencyString = `${data.emergencyContact.name || ''} - ${data.emergencyContact.phone || ''}`.trim();
      if (emergencyString && emergencyString !== ' -') {
        formAnswers.push({
          custom_module_id: '18920938', // Emergency Contact
          answer: emergencyString,
          label: 'Emergency Contact'
        });
      }
    }

    return formAnswers;
  };

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
        user_id: '3625476',
        custom_module_form_id: '2198271',
        finished: true,
        form_answers: formatFormDataForHealthie(formData)
      };

      const response = await createFormAnswerGroup({
        variables: { input }
      });

      if (response.data?.createFormAnswerGroup?.messages?.length) {
        throw new Error(response.data.createFormAnswerGroup.messages[0].message);
      }

      // Success handling
      alert('Form submitted successfully!');
      setFormData({});

    } catch (error) {
      console.error('Form submission error:', error);
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
          Please complete all required fields for your primary care registration.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PatientIntakeForm
          value={formData}
          onChange={handleFormChange}
          className="space-y-4"
        />

        {/* Error display */}
        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md" role="alert">
            <ul className="list-disc pl-4">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field} className="text-red-600">{message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-busy={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrimaryCarePatienceIntake;