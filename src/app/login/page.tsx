'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface LoginForm {
	email: string;
	password: string;
}

export default function LoginPage() {
	const router = useRouter();
	const { signIn, loading } = useAuth();
	const [formData, setFormData] = useState<LoginForm>({
		email: '',
		password: ''
	});
	const [errors, setErrors] = useState<Partial<LoginForm>>({});
	const [authError, setAuthError] = useState<string>('');

	const validateForm = (): boolean => {
		const newErrors: Partial<LoginForm> = {};

		if (!formData.email) {
			newErrors.email = 'Email is required';
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Please enter a valid email';
		}

		if (!formData.password) {
			newErrors.password = 'Password is required';
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
			// Sign in using auth context
			const { user } = await signIn(formData.email, formData.password);
			
			if (user) {
				// AuthProvider handles localStorage and user state
				// Redirect to main dashboard
				router.push('/');
			} else {
				setAuthError('Login failed. Please try again.');
			}
		} catch (error) {
			console.error('Login error:', error);
			setAuthError(error instanceof Error ? error.message : 'Login failed. Please try again.');
		}
	};

	const handleInputChange = (field: keyof LoginForm, value: string) => {
		setFormData(prev => ({ ...prev, [field]: value }));
		if (errors[field]) {
			setErrors(prev => ({ ...prev, [field]: undefined }));
		}
	};

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
						Welcome back
					</h2>
					<p className="text-gray-600">
						Sign in to your account
					</p>
				</div>

				{/* Login Form */}
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
							placeholder="Enter your password"
						/>
						{errors.password && (
							<p className="mt-1 text-sm text-red-600">{errors.password}</p>
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
						{loading ? 'Signing in...' : 'Sign in'}
					</button>
				</form>

				{/* Signup Link */}
				<div className="text-center">
					<p className="text-sm text-gray-600">
						Don't have an account?{' '}
						<a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
							Sign up
						</a>
					</p>
				</div>
			</div>
		</div>
	);
} 