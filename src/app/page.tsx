'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface GeneratedProject {
	id: string;
	name: string;
	path: string;
	port?: number;
	status: 'creating' | 'installing' | 'starting' | 'running' | 'stopped' | 'error';
	url?: string;
	error?: string;
	createdAt: Date;
}

interface GeneratedForm {
	formSpec: {
		title: string;
		description?: string;
		fields: Array<{
			id: string;
			type: string;
			label: string;
			required: boolean;
		}>;
	};
	deploymentPackage: Record<string, string>;
	localProject?: GeneratedProject;
}

interface UserData {
	email: string;
	clinicName: string;
	emr: string;
	specialty: string;
	isLoggedIn: boolean;
}

export default function Home() {
	const router = useRouter();
	const [userData, setUserData] = useState<UserData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [prompt, setPrompt] = useState('');
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<GeneratedForm | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deployingLocally, setDeployingLocally] = useState(false);

	// Check authentication on component mount
	useEffect(() => {
		const checkAuth = () => {
			try {
				const storedUserData = localStorage.getItem('userData');
				if (storedUserData) {
					const user = JSON.parse(storedUserData);
					if (user.isLoggedIn) {
						setUserData(user);
					} else {
						router.push('/signup');
					}
				} else {
					router.push('/signup');
				}
			} catch (error) {
				console.error('Auth check error:', error);
				router.push('/signup');
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, [router]);

	const handleLogout = () => {
		localStorage.removeItem('userData');
		router.push('/signup');
	};

	const generateForm = async (deployLocally: boolean = false) => {
		if (!prompt.trim()) return;

		setLoading(true);
		setError(null);
		setResult(null);
		setDeployingLocally(deployLocally);

		try {
			const response = await fetch('/api/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ prompt, deployLocally }),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || data.details || 'Failed to generate form');
			}

			setResult(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error occurred');
		} finally {
			setLoading(false);
			setDeployingLocally(false);
		}
	};

	const deployExistingForm = async () => {
		if (!result) return;

		setDeployingLocally(true);
		setError(null);

		try {
			const response = await fetch('/api/projects', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: result.formSpec.title,
					deploymentPackage: result.deploymentPackage,
				}),
			});

			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || data.details || 'Failed to deploy locally');
			}

			// Update result with local project info
			setResult(prev => prev ? { ...prev, localProject: data.project } : null);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Unknown error occurred');
		} finally {
			setDeployingLocally(false);
		}
	};

	// Show loading state while checking authentication
	if (isLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	// Don't render the main content if user is not authenticated
	if (!userData) {
		return null;
	}

	return (
		<div className="min-h-screen bg-white">
			{/* Header Section */}
			<div className="bg-gray-100 border-b border-gray-200">
				<div className="max-w-6xl mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						{/* Logo/Brand */}
						<div className="flex items-center">
							<div className="text-2xl font-bold">
								<span className="text-gray-800">CareCanvas</span>
								<span className="text-blue-600">.ai</span>
							</div>
						</div>
						
						{/* Navigation and User Info */}
						<div className="flex items-center space-x-6">
							<nav className="flex items-center space-x-6">
								<a href="/" className="text-blue-600 transition-colors">Home</a>
								<a href="/my-apps" className="text-gray-700 hover:text-blue-600 transition-colors">My Apps</a>
							</nav>
							
							{/* User Menu */}
							<div className="flex items-center space-x-3">
								<div className="text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200">
									<span className="font-medium">{userData.clinicName}</span>
									<span className="mx-2 text-gray-400">•</span>
									<span>{userData.specialty}</span>
								</div>
								<button
									onClick={handleLogout}
									className="text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg"
								>
									Sign Out
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Hero Section */}
			<div className="bg-white py-16">
				<div className="max-w-5xl mx-auto px-4 text-center">
					{/* Main Headline */}
					<h1 className="text-5xl font-bold mb-8">
						<span className="text-gray-800">Create Healthcare Apps with </span>
						<span className="text-blue-600">AI</span>
					</h1>
					
					{/* Tagline */}
					<p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
						CareCanvas AI is a free tool that generates EHR-integrated healthcare applications with natural language.
					</p>
					
					{/* Feature Highlights */}
					<div className="flex flex-wrap justify-center gap-6 mb-12">
						<div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
							<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
							Accurate & Quick Apps
						</div>
						<div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
							<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
							</svg>
							Integrates with Healthie
						</div>
						<div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full border border-blue-200">
							<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							HIPAA Compliant
						</div>
					</div>
					
					{/* Interactive Hint */}
					<p className="text-base text-gray-500 mb-12">
						Describe your healthcare application and get a complete, deployable solution. Try{' '}
						<button
							onClick={() => setPrompt("Build a new patient intake form for a primary care office to collect demographics, medical history, and current symptoms")}
							className="text-blue-600 hover:text-blue-800 underline font-medium"
						>
							"PCP office intake form"
						</button>{' '}
						✨
					</p>
					
					{/* Input Bar */}
					<div className="max-w-3xl mx-auto">
						<div className="relative">
							<textarea
								placeholder="Describe your healthcare application, or paste medical requirements..."
								className="w-full pl-8 pr-16 py-6 text-md bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:ring-inset focus:bg-white outline-none resize-none shadow-sm"
								rows={3}
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
							/>
							<button
								onClick={() => generateForm(false)}
								disabled={loading || deployingLocally || !prompt.trim()}
								className="absolute right-4 bottom-4 w-10 h-10 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-400 transition-colors shadow-sm"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="py-12 px-4">
				<div className="max-w-4xl mx-auto">

					{error && (
						<div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
							<div className="flex items-start">
								<div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
									<svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
								</div>
								<div className="text-red-800">
									<h3 className="font-medium text-lg">Error</h3>
									<p className="mt-2 text-sm">{error}</p>
								</div>
							</div>
						</div>
					)}

					{result && (
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
							<div className="mb-8">
								<div className="flex items-center mb-4">
									<div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
										<svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									</div>
									<h2 className="text-2xl font-bold text-gray-900">
										Generated Form: {result.formSpec.title}
									</h2>
								</div>

								{result.formSpec.description && (
									<p className="text-gray-600 mb-6">{result.formSpec.description}</p>
								)}
							</div>

							<div className="mb-8">
								<h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
									<span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
									Form Fields
								</h3>
								<div className="space-y-3">
									{result.formSpec.fields.map((field) => (
										<div key={field.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
											<div>
												<span className="font-medium text-gray-900">{field.label}</span>
												<span className="ml-2 text-sm text-gray-500">({field.type})</span>
											</div>
											{field.required && (
												<span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full border border-red-200">Required</span>
											)}
										</div>
									))}
								</div>
							</div>

							<div className="border-t pt-8">
								<h3 className="text-lg font-medium text-gray-900 flex items-center mb-6">
									<span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
									{result.localProject ? 'Local Deployment' : 'Next Steps'}
								</h3>

								{result.localProject ? (
									<div className="space-y-6">
										{/* Local Project Status */}
										<div className={`rounded-xl p-6 border ${result.localProject.status === 'running'
												? 'bg-green-50 border-green-200'
												: result.localProject.status === 'error'
													? 'bg-red-50 border-red-200'
													: 'bg-yellow-50 border-yellow-200'
											}`}>
											<div className="flex items-center justify-between mb-4">
												<div className="flex items-center">
													<div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
														result.localProject.status === 'running' ? 'bg-green-100' :
														result.localProject.status === 'error' ? 'bg-red-100' :
														'bg-yellow-100'
													}`}>
														<svg className={`w-5 h-5 ${
															result.localProject.status === 'running' ? 'text-green-600' :
															result.localProject.status === 'error' ? 'text-red-600' :
															'text-yellow-600'
														}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
														</svg>
													</div>
													<h4 className="font-semibold text-lg">
														{result.localProject.status === 'running' ? 'Running Locally' :
															result.localProject.status === 'error' ? 'Deployment Failed' :
																'Setting Up...'}
													</h4>
												</div>
												<span className={`text-sm px-3 py-1 rounded-full border ${
													result.localProject.status === 'running' ? 'bg-green-100 text-green-800 border-green-200' :
													result.localProject.status === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
													'bg-yellow-100 text-yellow-800 border-yellow-200'
												}`}>
													{result.localProject.status}
												</span>
											</div>

											{result.localProject.url && (
												<div className="mb-4">
													<a
														href={result.localProject.url}
														target="_blank"
														rel="noopener noreferrer"
														className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
													>
														<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
														</svg>
														Open App ({result.localProject.url})
													</a>
												</div>
											)}

											{result.localProject.error && (
												<div className="text-red-700 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
													<strong>Error:</strong> {result.localProject.error}
												</div>
											)}

											<div className="text-sm text-gray-600 space-y-1">
												<div><strong>Project:</strong> {result.localProject.name}</div>
												<div><strong>Port:</strong> {result.localProject.port || 'Not assigned'}</div>
												<div><strong>Created:</strong> {new Date(result.localProject.createdAt).toLocaleTimeString()}</div>
											</div>
										</div>
									</div>
								) : (
									<div className="space-y-6">
										<div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
											<div className="flex items-center mb-4">
												<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
													<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
												</div>
												<p className="text-blue-800 font-medium text-lg">
													Your form has been generated!
												</p>
											</div>
											<p className="text-blue-700 text-sm mb-4">
												The complete deployment package includes all necessary files with healthcare widgets and Healthie integration.
											</p>

											<button
												onClick={deployExistingForm}
												disabled={deployingLocally}
												className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
											>
												{deployingLocally ? 'Deploying...' : '🚀 Run Locally'}
											</button>
										</div>

										<div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
											<h4 className="font-medium mb-4 flex items-center">
												<span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
												What's Included:
											</h4>
											<ul className="text-sm text-gray-600 space-y-2">
												<li className="flex items-start">
													<span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
													Complete Next.js application with TypeScript
												</li>
												<li className="flex items-start">
													<span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
													Healthcare-specific UI components and widgets
												</li>
												<li className="flex items-start">
													<span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
													Healthie GraphQL integration for form submission
												</li>
												<li className="flex items-start">
													<span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
													HIPAA-compliant security patterns
												</li>
												<li className="flex items-start">
													<span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
													Mobile-responsive design with accessibility features
												</li>
											</ul>
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					<div className="mt-0 text-center text-sm text-gray-500">
						<p>
							Integrates with Healthie • HIPAA Compliant
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
