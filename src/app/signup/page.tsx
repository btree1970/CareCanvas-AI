'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface SignupForm {
	email: string;
	password: string;
	confirmPassword: string;
	clinicName: string;
	emr: string;
	specialty: string;
}

const EMR_OPTIONS = [
	{ value: 'healthie', label: 'Healthie' },
	{ value: 'simplepractice', label: 'SimplePractice' },
	{ value: 'zanda', label: 'Zanda' }
];

const SPECIALTY_OPTIONS = [
	{ value: 'PCP', label: 'Primary Care (PCP)' },
	{ value: 'Cardiology', label: 'Cardiology' },
	{ value: 'Dermatology', label: 'Dermatology' },
	{ value: 'Orthopedics', label: 'Orthopedics' },
	{ value: 'Pediatrics', label: 'Pediatrics' },
	{ value: 'OBGYN', label: 'OB/GYN' },
	{ value: 'Neurology', label: 'Neurology' },
	{ value: 'Psychiatry', label: 'Psychiatry' },
	{ value: 'Oncology', label: 'Oncology' },
	{ value: 'Other', label: 'Other' }
];

export default function SignupPage() {
	const router = useRouter();
	const { signUp, loading } = useAuth();
	const [formData, setFormData] = useState<SignupForm>({
		email: '',
		password: '',
		confirmPassword: '',
		clinicName: '',
		emr: 'healthie',
		specialty: ''
	});
	const [errors, setErrors] = useState<Partial<SignupForm>>({});
	const [authError, setAuthError] = useState<string>('');
	const [isSuccess, setIsSuccess] = useState(false);

	const validateForm = (): boolean => {
		const newErrors: Partial<SignupForm> = {};

		if (!formData.email) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Please enter a valid email';
		}

		if (!formData.password) {
			newErrors.password = 'Password is required';
		} else if (formData.password.length < 8) {
			newErrors.password = 'Password must be at least 8 characters';
		}

		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}

		if (!formData.clinicName) {
			newErrors.clinicName = 'Clinic name is required';
		}

		if (!formData.specialty) {
			newErrors.specialty = 'Please select a specialty';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!validateForm()) {
			return;
		}

		setAuthError('');

		try {
			// Sign up using auth context - include clinic data in user metadata
			const { user } = await signUp(
				formData.email, 
				formData.password,
				formData.clinicName // Use clinic name as the name field
			);
			
			if (user) {
				// Store additional signup data for later use (EMR, specialty)
				const signupData = {
					emr: formData.emr,
					specialty: formData.specialty,
					clinicName: formData.clinicName
				};
				localStorage.setItem('signupData', JSON.stringify(signupData));

				// Show success message instead of redirecting
				setIsSuccess(true);
			} else {
				setAuthError('Signup failed. Please try again.');
			}
		} catch (error) {
			console.error('Signup error:', error);
			setAuthError(error instanceof Error ? error.message : 'Signup failed. Please try again.');
		}
	};

	const handleInputChange = (field: keyof SignupForm, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: undefined }));
		}
	};

	// If signup was successful, show confirmation message
	if (isSuccess) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
				<div className="max-w-md w-full space-y-8">
					{/* Header */}
					<div className="text-center">
						<div className="flex justify-center mb-6">
							<div className="text-3xl font-bold">
								<span className="text-gray-800">CareCanvas</span>
								<span className="text-blue-600">.ai</span>
							</div>
						</div>
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Check your email
						</h2>
						<p className="text-gray-600 mb-6">
							We've sent a confirmation link to <strong>{formData.email}</strong>
						</p>
					</div>

					{/* Success Message */}
					<div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
						<div className="text-green-600 text-5xl mb-4">✓</div>
						<h3 className="text-lg font-semibold text-green-800 mb-2">
							Account Created Successfully!
						</h3>
						<p className="text-green-700 mb-4">
							Please check your email and click the confirmation link to complete your registration.
						</p>
						<p className="text-sm text-green-600">
							Once confirmed, you can <a href="/login" className="font-medium underline hover:text-green-800">sign in to your account</a>.
						</p>
					</div>

					{/* Resend Email */}
					<div className="text-center">
						<p className="text-sm text-gray-600">
							Didn't receive an email?{' '}
							<button 
								onClick={() => {
									// Here you could implement resend functionality
									alert('Resend functionality would be implemented here');
								}}
								className="text-blue-600 hover:text-blue-800 font-medium"
							>
								Resend confirmation
							</button>
						</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white flex items-center justify-center py-12 px-4">
			<div className="max-w-md w-full space-y-8">
				{/* Header */}
				<div className="text-center">
					<div className="flex justify-center mb-6">
						<div className="text-3xl font-bold">
							<span className="text-gray-800">CareCanvas</span>
							<span className="text-blue-600">.ai</span>
						</div>
					</div>
					<h2 className="text-3xl font-bold text-gray-900 mb-2">
						Create your account
					</h2>
					<p className="text-gray-600">
						Get started with AI-powered healthcare applications
					</p>
				</div>

				{/* Signup Form */}
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Email */}
					<div>
						<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
							Email address
						</label>
						<input
							id="email"
							type="email"
							value={formData.email}
							onChange={(e) => handleInputChange('email', e.target.value)}
							className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
								errors.email ? 'border-red-300' : 'border-gray-300'
							}`}
							placeholder="Enter your email"
						/>
						{errors.email && (
							<p className="mt-1 text-sm text-red-600">{errors.email}</p>
						)}
					</div>

					{/* Password */}
					<div>
						<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={formData.password}
							onChange={(e) => handleInputChange('password', e.target.value)}
							className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
								errors.password ? 'border-red-300' : 'border-gray-300'
							}`}
							placeholder="Create a password"
						/>
						{errors.password && (
							<p className="mt-1 text-sm text-red-600">{errors.password}</p>
						)}
					</div>

					{/* Confirm Password */}
					<div>
						<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
							Confirm password
						</label>
						<input
							id="confirmPassword"
							type="password"
							value={formData.confirmPassword}
							onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
							className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
								errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
							}`}
							placeholder="Confirm your password"
						/>
						{errors.confirmPassword && (
							<p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
						)}
					</div>

					{/* Clinic Name */}
					<div>
						<label htmlFor="clinicName" className="block text-sm font-medium text-gray-700 mb-2">
							Clinic name
						</label>
						<input
							id="clinicName"
							type="text"
							value={formData.clinicName}
							onChange={(e) => handleInputChange('clinicName', e.target.value)}
							className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
								errors.clinicName ? 'border-red-300' : 'border-gray-300'
							}`}
							placeholder="Enter your clinic name"
						/>
						{errors.clinicName && (
							<p className="mt-1 text-sm text-red-600">{errors.clinicName}</p>
						)}
					</div>

					{/* EMR Selection */}
					<div>
						<label htmlFor="emr" className="block text-sm font-medium text-gray-700 mb-2">
							Electronic Medical Record (EMR)
						</label>
						<select
							id="emr"
							value={formData.emr}
							onChange={(e) => handleInputChange('emr', e.target.value)}
							className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						>
							{EMR_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						<p className="mt-1 text-xs text-gray-500">
							Currently supporting Healthie integration. More EMRs coming soon.
						</p>
					</div>

					{/* Medical Specialty */}
					<div>
						<label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
							Medical specialty
						</label>
						<select
							id="specialty"
							value={formData.specialty}
							onChange={(e) => handleInputChange('specialty', e.target.value)}
							className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
								errors.specialty ? 'border-red-300' : 'border-gray-300'
							}`}
						>
							<option value="">Select a specialty</option>
							{SPECIALTY_OPTIONS.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						{errors.specialty && (
							<p className="mt-1 text-sm text-red-600">{errors.specialty}</p>
						)}
					</div>

					{/* Auth Error */}
					{authError && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-3">
							<p className="text-sm text-red-700">{authError}</p>
						</div>
					)}

					{/* Submit Button */}
					<button
						type="submit"
						disabled={loading}
						className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
					>
						{loading ? 'Creating account...' : 'Create account'}
					</button>
				</form>

				{/* Login Link */}
				<div className="text-center">
					<p className="text-sm text-gray-600">
						Already have an account?{' '}
						<a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
							Sign in
						</a>
					</p>
				</div>
			</div>
		</div>
	);
} 