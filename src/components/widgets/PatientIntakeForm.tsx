'use client';

import React, { useState, useEffect } from 'react';

export interface PatientIntakeData {
	// Demographics
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

	// Medical History
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

	// Current Symptoms
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
}

interface PatientIntakeFormProps {
	onChange: (data: PatientIntakeData) => void;
	value?: Partial<PatientIntakeData>;
	className?: string;
	readOnly?: boolean;
}

const DEFAULT_FORM_DATA: PatientIntakeData = {
	firstName: '',
	lastName: '',
	dateOfBirth: '',
	gender: '',
	phone: '',
	email: '',
	address: {
		street: '',
		city: '',
		state: '',
		zipCode: ''
	},
	emergencyContact: {
		name: '',
		relationship: '',
		phone: ''
	},
	primaryCarePhysician: '',
	insurance: {
		provider: '',
		policyNumber: '',
		groupNumber: ''
	},
	allergies: [],
	medications: [],
	medicalConditions: [],
	surgicalHistory: [],
	familyHistory: '',
	chiefComplaint: '',
	symptoms: {
		description: '',
		onset: '',
		severity: 'mild',
		duration: '',
		triggers: '',
		alleviatingFactors: ''
	},
	vitalSigns: {
		bloodPressure: '',
		heartRate: '',
		temperature: '',
		weight: '',
		height: ''
	}
};

export function PatientIntakeForm({
	onChange,
	value = {},
	className = '',
	readOnly = false
}: PatientIntakeFormProps) {
	const [formData, setFormData] = useState<PatientIntakeData>({
		...DEFAULT_FORM_DATA,
		...value
	});

	useEffect(() => {
		onChange(formData);
	}, [formData, onChange]);

	const updateField = (field: keyof PatientIntakeData, value: any) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}));
	};

	const updateNestedField = (parentField: keyof PatientIntakeData, childField: string, value: any) => {
		setFormData(prev => ({
			...prev,
			[parentField]: {
				...prev[parentField],
				[childField]: value
			}
		}));
	};

	const addArrayItem = (field: keyof PatientIntakeData, item: string) => {
		setFormData(prev => {
			const currentArray = prev[field] as string[];
			return {
				...prev,
				[field]: [...currentArray, item]
			};
		});
	};

	const updateArrayItem = (field: keyof PatientIntakeData, index: number, value: string) => {
		setFormData(prev => {
			const currentArray = prev[field] as string[];
			return {
				...prev,
				[field]: currentArray.map((item, i) => i === index ? value : item)
			};
		});
	};

	const removeArrayItem = (field: keyof PatientIntakeData, index: number) => {
		setFormData(prev => {
			const currentArray = prev[field] as string[];
			return {
				...prev,
				[field]: currentArray.filter((_, i) => i !== index)
			};
		});
	};

	return (
		<div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
			<div className="mb-8">
				<div className="flex items-center mb-3">
					<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
						<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
					</div>
					<h3 className="text-xl font-semibold text-gray-900">
						Patient Intake Form
					</h3>
				</div>
				<p className="text-sm text-gray-600 mb-4">
					Complete patient demographic and medical information
				</p>
			</div>
			
			<div className="space-y-8">
				{/* Demographics Section */}
				<div className="space-y-6">
					<div className="mb-4">
						<h4 className="text-lg font-medium text-gray-900">Demographics</h4>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
							<input
								type="text"
								value={formData.firstName}
								onChange={(e) => updateField('firstName', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
							<input
								type="text"
								value={formData.lastName}
								onChange={(e) => updateField('lastName', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
							<input
								type="date"
								value={formData.dateOfBirth}
								onChange={(e) => updateField('dateOfBirth', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
							<select
								value={formData.gender}
								onChange={(e) => updateField('gender', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="">Select gender</option>
								<option value="male">Male</option>
								<option value="female">Female</option>
								<option value="other">Other</option>
								<option value="prefer-not-to-say">Prefer not to say</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
							<input
								type="tel"
								value={formData.phone}
								onChange={(e) => updateField('phone', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
							<input
								type="email"
								value={formData.email}
								onChange={(e) => updateField('email', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
					</div>

					{/* Address */}
					<div className="mt-6">
						<h5 className="text-md font-medium text-gray-800 mb-3">Address</h5>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="md:col-span-2">
								<label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
								<input
									type="text"
									value={formData.address.street}
									onChange={(e) => updateNestedField('address', 'street', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">City</label>
								<input
									type="text"
									value={formData.address.city}
									onChange={(e) => updateNestedField('address', 'city', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">State</label>
								<input
									type="text"
									value={formData.address.state}
									onChange={(e) => updateNestedField('address', 'state', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
								<input
									type="text"
									value={formData.address.zipCode}
									onChange={(e) => updateNestedField('address', 'zipCode', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
						</div>
					</div>

					{/* Emergency Contact */}
					<div className="mt-6">
						<h5 className="text-md font-medium text-gray-800 mb-3">Emergency Contact</h5>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
								<input
									type="text"
									value={formData.emergencyContact.name}
									onChange={(e) => updateNestedField('emergencyContact', 'name', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
								<input
									type="text"
									value={formData.emergencyContact.relationship}
									onChange={(e) => updateNestedField('emergencyContact', 'relationship', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
								<input
									type="tel"
									value={formData.emergencyContact.phone}
									onChange={(e) => updateNestedField('emergencyContact', 'phone', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
						</div>
					</div>
				</div>

				{/* Medical History Section */}
				<div className="space-y-6">
					<div className="mb-4">
						<h4 className="text-lg font-medium text-gray-900">Medical History</h4>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Primary Care Physician</label>
							<input
								type="text"
								value={formData.primaryCarePhysician}
								onChange={(e) => updateField('primaryCarePhysician', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
					</div>

					{/* Insurance */}
					<div className="mt-6">
						<h5 className="text-md font-medium text-gray-800 mb-3">Insurance Information</h5>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
								<input
									type="text"
									value={formData.insurance.provider}
									onChange={(e) => updateNestedField('insurance', 'provider', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
								<input
									type="text"
									value={formData.insurance.policyNumber}
									onChange={(e) => updateNestedField('insurance', 'policyNumber', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Group Number</label>
								<input
									type="text"
									value={formData.insurance.groupNumber}
									onChange={(e) => updateNestedField('insurance', 'groupNumber', e.target.value)}
									disabled={readOnly}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
						</div>
					</div>

					{/* Allergies */}
					<div className="mt-6">
						<h5 className="text-md font-medium text-gray-800 mb-3">Allergies</h5>
						<div className="space-y-2">
							{formData.allergies.map((allergy, index) => (
								<div key={index} className="flex items-center space-x-2">
									<input
										type="text"
										value={allergy}
										onChange={(e) => updateArrayItem('allergies', index, e.target.value)}
										disabled={readOnly}
										className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
									{!readOnly && (
										<button
											type="button"
											onClick={() => removeArrayItem('allergies', index)}
											className="text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									)}
								</div>
							))}
							{!readOnly && (
								<button
									type="button"
									onClick={() => addArrayItem('allergies', '')}
									className="text-blue-600 hover:text-blue-800 text-sm"
								>
									+ Add Allergy
								</button>
							)}
						</div>
					</div>

					{/* Current Medications */}
					<div className="mt-6">
						<h5 className="text-md font-medium text-gray-800 mb-3">Current Medications</h5>
						<div className="space-y-2">
							{formData.medications.map((medication, index) => (
								<div key={index} className="flex items-center space-x-2">
									<input
										type="text"
										value={medication}
										onChange={(e) => updateArrayItem('medications', index, e.target.value)}
										disabled={readOnly}
										className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
									{!readOnly && (
										<button
											type="button"
											onClick={() => removeArrayItem('medications', index)}
											className="text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									)}
								</div>
							))}
							{!readOnly && (
								<button
									type="button"
									onClick={() => addArrayItem('medications', '')}
									className="text-blue-600 hover:text-blue-800 text-sm"
								>
									+ Add Medication
								</button>
							)}
						</div>
					</div>

					{/* Medical Conditions */}
					<div className="mt-6">
						<h5 className="text-md font-medium text-gray-800 mb-3">Medical Conditions</h5>
						<div className="space-y-2">
							{formData.medicalConditions.map((condition, index) => (
								<div key={index} className="flex items-center space-x-2">
									<input
										type="text"
										value={condition}
										onChange={(e) => updateArrayItem('medicalConditions', index, e.target.value)}
										disabled={readOnly}
										className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
									{!readOnly && (
										<button
											type="button"
											onClick={() => removeArrayItem('medicalConditions', index)}
											className="text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									)}
								</div>
							))}
							{!readOnly && (
								<button
									type="button"
									onClick={() => addArrayItem('medicalConditions', '')}
									className="text-blue-600 hover:text-blue-800 text-sm"
								>
									+ Add Medical Condition
								</button>
							)}
						</div>
					</div>

					{/* Surgical History */}
					<div className="mt-6">
						<h5 className="text-md font-medium text-gray-800 mb-3">Surgical History</h5>
						<div className="space-y-2">
							{formData.surgicalHistory.map((surgery, index) => (
								<div key={index} className="flex items-center space-x-2">
									<input
										type="text"
										value={surgery}
										onChange={(e) => updateArrayItem('surgicalHistory', index, e.target.value)}
										disabled={readOnly}
										className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
									{!readOnly && (
										<button
											type="button"
											onClick={() => removeArrayItem('surgicalHistory', index)}
											className="text-red-600 hover:text-red-800"
										>
											Remove
										</button>
									)}
								</div>
							))}
							{!readOnly && (
								<button
									type="button"
									onClick={() => addArrayItem('surgicalHistory', '')}
									className="text-blue-600 hover:text-blue-800 text-sm"
								>
									+ Add Surgery
								</button>
							)}
						</div>
					</div>

					{/* Family History */}
					<div className="mt-6">
						<h5 className="text-md font-medium text-gray-800 mb-3">Family History</h5>
						<textarea
							value={formData.familyHistory}
							onChange={(e) => updateField('familyHistory', e.target.value)}
							disabled={readOnly}
							rows={3}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="Please describe any relevant family medical history..."
						/>
					</div>
				</div>

				{/* Current Symptoms Section */}
				<div className="space-y-6">
					<div className="mb-4">
						<h4 className="text-lg font-medium text-gray-900">Current Symptoms</h4>
					</div>
					
					{/* Chief Complaint */}
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint *</label>
						<textarea
							value={formData.chiefComplaint}
							onChange={(e) => updateField('chiefComplaint', e.target.value)}
							disabled={readOnly}
							rows={2}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="What brings you in today?"
						/>
					</div>

					{/* Symptom Details */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Onset</label>
							<input
								type="text"
								value={formData.symptoms.onset}
								onChange={(e) => updateNestedField('symptoms', 'onset', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="When did symptoms start?"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
							<select
								value={formData.symptoms.severity}
								onChange={(e) => updateNestedField('symptoms', 'severity', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="mild">Mild</option>
								<option value="moderate">Moderate</option>
								<option value="severe">Severe</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
							<input
								type="text"
								value={formData.symptoms.duration}
								onChange={(e) => updateNestedField('symptoms', 'duration', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="How long have symptoms lasted?"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Triggers</label>
							<input
								type="text"
								value={formData.symptoms.triggers}
								onChange={(e) => updateNestedField('symptoms', 'triggers', e.target.value)}
								disabled={readOnly}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="What makes symptoms worse?"
							/>
						</div>
					</div>

					<div className="mt-4">
						<label className="block text-sm font-medium text-gray-700 mb-1">Alleviating Factors</label>
						<input
							type="text"
							value={formData.symptoms.alleviatingFactors}
							onChange={(e) => updateNestedField('symptoms', 'alleviatingFactors', e.target.value)}
							disabled={readOnly}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="What makes symptoms better?"
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

export default PatientIntakeForm; 