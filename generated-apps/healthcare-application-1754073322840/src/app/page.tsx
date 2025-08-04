'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { RefillTracker } from '../components/widgets';
import { CREATE_FORM_ANSWER_GROUP } from '../lib/graphql-mutations';
import type { RefillRecord } from '../components/widgets';
import type { CreateFormAnswerGroupInput } from '../lib/healthie';

interface RefillTrackerDashboardProps {
  practiceId: string;
}

const RefillTrackerDashboard: React.FC<RefillTrackerDashboardProps> = ({ practiceId }) => {
  // State management
  const [refillData, setRefillData] = useState<RefillRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Apollo mutation for saving refill status updates
  const [createFormAnswerGroup] = useMutation(CREATE_FORM_ANSWER_GROUP);

  // Handle refill data changes
  const handleRefillChange = useCallback((updatedRefills: RefillRecord[]) => {
    setRefillData(updatedRefills);
    
    // Clear any previous errors
    if (error) {
      setError('');
    }
  }, [error]);

  // Submit refill status updates to Healthie
  const handleSubmitRefillUpdates = async () => {
    setIsLoading(true);
    
    try {
      // Map refill data to Healthie form structure
      const formAnswers = refillData.map(refill => ({
        custom_module_id: `refill_${refill.patientId}`,
        answer: JSON.stringify({
          medicationName: refill.medicationName,
          lastFillDate: refill.lastFillDate,
          nextRefillDue: refill.nextRefillDue,
          status: refill.status,
          daysSupply: refill.daysSupply
        }),
        label: `Medication Refill Status - ${refill.medicationName}`
      }));

      const response = await createFormAnswerGroup({
        variables: {
          input: {
            custom_module_form_id: 'practice_refill_tracker',
            finished: true,
            form_answers: formAnswers
          } as CreateFormAnswerGroupInput
        }
      });

      console.log('Refill updates saved successfully:', response);
    } catch (err) {
      console.error('Failed to save refill updates:', err);
      setError('Failed to save refill updates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary statistics
  const refillSummary = {
    total: refillData.length,
    dueSoon: refillData.filter(r => r.status === 'due-soon').length,
    overdue: refillData.filter(r => r.status === 'overdue').length,
    active: refillData.filter(r => r.status === 'active').length
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Practice Medication Refill Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor and manage patient medication refills across the practice
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold">Total Prescriptions</h3>
          <p className="text-2xl font-bold text-blue-600">{refillSummary.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold">Due Soon</h3>
          <p className="text-2xl font-bold text-yellow-600">{refillSummary.dueSoon}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold">Overdue</h3>
          <p className="text-2xl font-bold text-red-600">{refillSummary.overdue}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-md">
          <h3 className="text-lg font-semibold">Active</h3>
          <p className="text-2xl font-bold text-green-600">{refillSummary.active}</p>
        </div>
      </div>

      {/* Refill Tracker Widget */}
      <div className="mb-8">
        <RefillTracker
          onChange={handleRefillChange}
          value={refillData}
          className="border border-gray-200 rounded-lg p-4"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleSubmitRefillUpdates}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                   disabled:opacity-50 disabled:cursor-not-allowed"
          aria-busy={isLoading}
        >
          {isLoading ? 'Saving Updates...' : 'Save Refill Updates'}
        </button>
      </div>
    </div>
  );
};

export default RefillTrackerDashboard;