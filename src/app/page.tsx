'use client';

import { useState } from 'react';

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

export default function Home() {
	const [prompt, setPrompt] = useState('');
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<GeneratedForm | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [deployingLocally, setDeployingLocally] = useState(false);

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

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						CareCanvas AI
					</h1>
					<p className="text-xl text-gray-600 mb-6">
						Generate healthcare applications in seconds with natural language
					</p>

					{/* Quick Examples */}
					<div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
						{[
							"Create a patient intake form with demographics and symptoms",
							"Build a pediatric pain assessment with interactive body mapping",
							"Generate a PHQ-9 depression screening with auto-scoring",
							"Make an ADHD evaluation form for children"
						].map((example, index) => (
							<button
								key={index}
								onClick={() => setPrompt(example)}
								className="text-sm px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
							>
								{example}
							</button>
						))}
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-8 mb-8">
					<div className="mb-6">
						<label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
							Describe the form you want to create
						</label>
						<textarea
							id="prompt"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder="e.g., Create a patient intake form with name, email, symptoms, and medical history..."
							className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
						/>
					</div>

					<div className="flex gap-3">
						<button
							onClick={() => generateForm(false)}
							disabled={loading || deployingLocally || !prompt.trim()}
							className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
						>
							{loading && !deployingLocally ? 'Generating...' : 'Generate Form'}
						</button>

						<button
							onClick={() => generateForm(true)}
							disabled={loading || deployingLocally || !prompt.trim()}
							className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
						>
							{deployingLocally ? 'Deploying...' : 'Generate & Run Locally'}
						</button>
					</div>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
						<div className="flex">
							<div className="text-red-800">
								<h3 className="font-medium">Error</h3>
								<p className="mt-1 text-sm">{error}</p>
							</div>
						</div>
					</div>
				)}

				{result && (
					<div className="bg-white rounded-lg shadow-lg p-8">
						<h2 className="text-2xl font-bold text-gray-900 mb-4">
							Generated Form: {result.formSpec.title}
						</h2>

						{result.formSpec.description && (
							<p className="text-gray-600 mb-6">{result.formSpec.description}</p>
						)}

						<div className="mb-8">
							<h3 className="text-lg font-semibold text-gray-800 mb-4">Form Fields</h3>
							<div className="space-y-3">
								{result.formSpec.fields.map((field) => (
									<div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div>
											<span className="font-medium text-gray-900">{field.label}</span>
											<span className="ml-2 text-sm text-gray-500">({field.type})</span>
										</div>
										{field.required && (
											<span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
										)}
									</div>
								))}
							</div>
						</div>

						<div className="border-t pt-6">
							<h3 className="text-lg font-semibold text-gray-800 mb-4">
								{result.localProject ? 'Local Deployment' : 'Next Steps'}
							</h3>

							{result.localProject ? (
								<div className="space-y-4">
									{/* Local Project Status */}
									<div className={`rounded-lg p-4 border-l-4 ${result.localProject.status === 'running'
											? 'bg-green-50 border-green-500'
											: result.localProject.status === 'error'
												? 'bg-red-50 border-red-500'
												: 'bg-yellow-50 border-yellow-500'
										}`}>
										<div className="flex items-center justify-between mb-2">
											<h4 className="font-semibold">
												{result.localProject.status === 'running' ? '✅ Running Locally' :
													result.localProject.status === 'error' ? '❌ Deployment Failed' :
														'⏳ Setting Up...'}
											</h4>
											<span className="text-sm px-2 py-1 rounded bg-white border">
												{result.localProject.status}
											</span>
										</div>

										{result.localProject.url && (
											<div className="mb-3">
												<a
													href={result.localProject.url}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
												>
													🌐 Open App ({result.localProject.url})
												</a>
											</div>
										)}

										{result.localProject.error && (
											<div className="text-red-700 text-sm">
												<strong>Error:</strong> {result.localProject.error}
											</div>
										)}

										<div className="text-sm text-gray-600">
											<strong>Project:</strong> {result.localProject.name}<br />
											<strong>Port:</strong> {result.localProject.port || 'Not assigned'}<br />
											<strong>Created:</strong> {new Date(result.localProject.createdAt).toLocaleTimeString()}
										</div>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									<div className="bg-blue-50 rounded-lg p-4">
										<p className="text-blue-800 mb-2">
											<strong>Your form has been generated!</strong>
										</p>
										<p className="text-blue-700 text-sm mb-3">
											The complete deployment package includes all necessary files with healthcare widgets and Healthie integration.
										</p>

										<button
											onClick={deployExistingForm}
											disabled={deployingLocally}
											className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
										>
											{deployingLocally ? 'Deploying...' : '🚀 Run Locally'}
										</button>
									</div>

									<div className="bg-gray-50 rounded-lg p-4">
										<h4 className="font-medium mb-2">What's Included:</h4>
										<ul className="text-sm text-gray-600 space-y-1">
											<li>• Complete Next.js application with TypeScript</li>
											<li>• Healthcare-specific UI components and widgets</li>
											<li>• Healthie GraphQL integration for form submission</li>
											<li>• HIPAA-compliant security patterns</li>
											<li>• Mobile-responsive design with accessibility features</li>
										</ul>
									</div>
								</div>
							)}
						</div>
					</div>
				)}

				<div className="mt-12 text-center text-sm text-gray-500">
					<p>
						Integrates with Healthie • HIPAA Compliant
					</p>
				</div>
			</div>
		</div>
	);
}
