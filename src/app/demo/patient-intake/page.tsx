'use client';

import { useState } from 'react';
import { PatientIntakeForm, PatientIntakeData } from '@/components/widgets/PatientIntakeForm';

export default function PatientIntakeDemo() {
	const [formData, setFormData] = useState<PatientIntakeData | null>(null);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const handleFormChange = (data: PatientIntakeData) => {
		setFormData(data);
		console.log('Form data updated:', data);
	};

	const handleSubmit = () => {
		if (formData) {
			console.log('Final form data:', formData);
			setIsSubmitted(true);
		}
	};

	const handleReset = () => {
		setFormData(null);
		setIsSubmitted(false);
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				{/* Form Demo */}
				<div className="mb-8">
					<PatientIntakeForm
						onChange={handleFormChange}
						value={formData}
						className="w-full"
					/>
				</div>
				<div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold text-gray-900 mb-2">Demo Controls</h2>
							<p className="text-sm text-gray-600">
								{isSubmitted ? 'Form submitted successfully!' : 'Fill out the form below to see it in action'}
							</p>
						</div>
						<div className="flex space-x-3">
							<button
								onClick={handleSubmit}
								disabled={!formData || isSubmitted}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
							>
								Submit Form
							</button>
							<button
								onClick={handleReset}
								className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
							>
								Reset Demo
							</button>
						</div>
					</div>
				</div>

			</div>
		</div>
	);
} 