'use client'

import React, { useState, useEffect } from 'react';

interface PatientDemographics {
	firstName: string;
	lastName: string;
	dateOfBirth: string;
	gender: string;
	preferredPronouns: string;
	phoneNumber: string;
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
		phoneNumber: string;
	};
	primaryLanguage: string;
	raceEthnicity: string;
	maritalStatus: string;
}

interface PatientDemographicsProps {
	onChange: (data: PatientDemographics) => void;
	value?: Partial<PatientDemographics>;
	required?: (keyof PatientDemographics)[];
	className?: string;
}

const GENDER_OPTIONS = [
	{ value: 'male', label: 'Male' },
	{ value: 'female', label: 'Female' },
	{ value: 'non-binary', label: 'Non-binary' },
	{ value: 'other', label: 'Other' },
	{ value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const PRONOUN_OPTIONS = [
	{ value: 'he/him', label: 'He/Him' },
	{ value: 'she/her', label: 'She/Her' },
	{ value: 'they/them', label: 'They/Them' },
	{ value: 'other', label: 'Other' },
];

const LANGUAGE_OPTIONS = [
	{ value: 'english', label: 'English' },
	{ value: 'spanish', label: 'Spanish' },
	{ value: 'mandarin', label: 'Mandarin' },
	{ value: 'french', label: 'French' },
	{ value: 'other', label: 'Other' },
];

const RELATIONSHIP_OPTIONS = [
	{ value: 'spouse', label: 'Spouse/Partner' },
	{ value: 'parent', label: 'Parent' },
	{ value: 'child', label: 'Child' },
	{ value: 'sibling', label: 'Sibling' },
	{ value: 'friend', label: 'Friend' },
	{ value: 'other', label: 'Other' },
];

const US_STATES = [
	'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
	'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
	'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
	'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
	'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function PatientDemographics({
	onChange,
	value = {},
	required = ['firstName', 'lastName', 'dateOfBirth', 'phoneNumber', 'email'],
	className = ''
}: PatientDemographicsProps) {
	const [formData, setFormData] = useState<PatientDemographics>({
		firstName: value.firstName || '',
		lastName: value.lastName || '',
		dateOfBirth: value.dateOfBirth || '',
		gender: value.gender || '',
		preferredPronouns: value.preferredPronouns || '',
		phoneNumber: value.phoneNumber || '',
		email: value.email || '',
		address: {
			street: value.address?.street || '',
			city: value.address?.city || '',
			state: value.address?.state || '',
			zipCode: value.address?.zipCode || '',
		},
		emergencyContact: {
			name: value.emergencyContact?.name || '',
			relationship: value.emergencyContact?.relationship || '',
			phoneNumber: value.emergencyContact?.phoneNumber || '',
		},
		primaryLanguage: value.primaryLanguage || 'english',
		raceEthnicity: value.raceEthnicity || '',
		maritalStatus: value.maritalStatus || '',
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	useEffect(() => {
		onChange(formData);
	}, [formData, onChange]);

	const validateField = (field: string, value: string): string => {
		if (required.includes(field as keyof PatientDemographics) && !value.trim()) {
			return 'This field is required';
		}

		switch (field) {
			case 'email':
				if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
					return 'Please enter a valid email address';
				}
				break;
			case 'phoneNumber':
			case 'emergencyContact.phoneNumber':
				if (value && !/^\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/.test(value)) {
					return 'Please enter a valid phone number';
				}
				break;
			case 'dateOfBirth':
				if (value) {
					const birthDate = new Date(value);
					const today = new Date();
					if (birthDate >= today) {
						return 'Birth date must be in the past';
					}
				}
				break;
			case 'zipCode':
				if (value && !/^\d{5}(-\d{4})?$/.test(value)) {
					return 'Please enter a valid ZIP code';
				}
				break;
		}

		return '';
	};

	const handleInputChange = (field: string, value: string) => {
		const error = validateField(field, value);

		setErrors(prev => ({
			...prev,
			[field]: error
		}));

		if (field.includes('.')) {
			const [parent, child] = field.split('.');
			setFormData(prev => ({
				...prev,
				[parent]: {
					...(prev[parent as keyof PatientDemographics] as any),
					[child]: value
				}
			}));
		} else {
			setFormData(prev => ({
				...prev,
				[field]: value
			}));
		}
	};

	const isRequired = (field: keyof PatientDemographics) => required.includes(field);

	return (
		<div className={`patient-demographics ${className}`}>
			<div className="mb-6">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					Patient Information
				</h3>
				<p className="text-sm text-gray-600">
					Please provide your personal information. Fields marked with * are required.
				</p>
			</div>

			<div className="space-y-6">
				{/* Basic Information */}
				<div className="bg-gray-50 p-4 rounded-lg">
					<h4 className="font-medium text-gray-800 mb-4">Basic Information</h4>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								First Name {isRequired('firstName') && <span className="text-red-500">*</span>}
							</label>
							<input
								type="text"
								value={formData.firstName}
								onChange={(e) => handleInputChange('firstName', e.target.value)}
								className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.firstName ? 'border-red-500' : 'border-gray-300'
									}`}
								placeholder="Enter first name"
							/>
							{errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Last Name {isRequired('lastName') && <span className="text-red-500">*</span>}
							</label>
							<input
								type="text"
								value={formData.lastName}
								onChange={(e) => handleInputChange('lastName', e.target.value)}
								className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-gray-300'
									}`}
								placeholder="Enter last name"
							/>
							{errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Date of Birth {isRequired('dateOfBirth') && <span className="text-red-500">*</span>}
							</label>
							<input
								type="date"
								value={formData.dateOfBirth}
								onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
								className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
									}`}
							/>
							{errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Gender
							</label>
							<select
								value={formData.gender}
								onChange={(e) => handleInputChange('gender', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="">Select gender</option>
								{GENDER_OPTIONS.map(option => (
									<option key={option.value} value={option.value}>{option.label}</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Preferred Pronouns
							</label>
							<select
								value={formData.preferredPronouns}
								onChange={(e) => handleInputChange('preferredPronouns', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="">Select pronouns</option>
								{PRONOUN_OPTIONS.map(option => (
									<option key={option.value} value={option.value}>{option.label}</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Primary Language
							</label>
							<select
								value={formData.primaryLanguage}
								onChange={(e) => handleInputChange('primaryLanguage', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								{LANGUAGE_OPTIONS.map(option => (
									<option key={option.value} value={option.value}>{option.label}</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* Contact Information */}
				<div className="bg-gray-50 p-4 rounded-lg">
					<h4 className="font-medium text-gray-800 mb-4">Contact Information</h4>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Phone Number {isRequired('phoneNumber') && <span className="text-red-500">*</span>}
							</label>
							<input
								type="tel"
								value={formData.phoneNumber}
								onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
								className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
									}`}
								placeholder="(555) 123-4567"
							/>
							{errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Email Address {isRequired('email') && <span className="text-red-500">*</span>}
							</label>
							<input
								type="email"
								value={formData.email}
								onChange={(e) => handleInputChange('email', e.target.value)}
								className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
									}`}
								placeholder="example@email.com"
							/>
							{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
						</div>
					</div>

					{/* Address */}
					<div className="mt-4">
						<h5 className="font-medium text-gray-700 mb-3">Address</h5>
						<div className="grid grid-cols-1 gap-3">
							<input
								type="text"
								value={formData.address.street}
								onChange={(e) => handleInputChange('address.street', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Street address"
							/>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
								<input
									type="text"
									value={formData.address.city}
									onChange={(e) => handleInputChange('address.city', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									placeholder="City"
								/>
								<select
									value={formData.address.state}
									onChange={(e) => handleInputChange('address.state', e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								>
									<option value="">State</option>
									{US_STATES.map(state => (
										<option key={state} value={state}>{state}</option>
									))}
								</select>
								<input
									type="text"
									value={formData.address.zipCode}
									onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
									className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.zipCode ? 'border-red-500' : 'border-gray-300'
										}`}
									placeholder="ZIP code"
								/>
							</div>
							{errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
						</div>
					</div>
				</div>

				{/* Emergency Contact */}
				<div className="bg-gray-50 p-4 rounded-lg">
					<h4 className="font-medium text-gray-800 mb-4">Emergency Contact</h4>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Contact Name
							</label>
							<input
								type="text"
								value={formData.emergencyContact.name}
								onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder="Full name"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Relationship
							</label>
							<select
								value={formData.emergencyContact.relationship}
								onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								<option value="">Select relationship</option>
								{RELATIONSHIP_OPTIONS.map(option => (
									<option key={option.value} value={option.value}>{option.label}</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Phone Number
							</label>
							<input
								type="tel"
								value={formData.emergencyContact.phoneNumber}
								onChange={(e) => handleInputChange('emergencyContact.phoneNumber', e.target.value)}
								className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors['emergencyContact.phoneNumber'] ? 'border-red-500' : 'border-gray-300'
									}`}
								placeholder="(555) 123-4567"
							/>
							{errors['emergencyContact.phoneNumber'] && (
								<p className="text-red-500 text-xs mt-1">{errors['emergencyContact.phoneNumber']}</p>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default PatientDemographics;
