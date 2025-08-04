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

interface UserData {
	email: string;
	clinicName: string;
	emr: string;
	specialty: string;
	isLoggedIn: boolean;
}

export default function MyApps() {
	const router = useRouter();
	const [userData, setUserData] = useState<UserData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [projects, setProjects] = useState<GeneratedProject[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isLoadingProjects, setIsLoadingProjects] = useState(true);

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

	// Load generated projects (with demo data for hackathon)
	useEffect(() => {
		const loadProjects = async () => {
			if (!userData) return;

			try {
				setIsLoadingProjects(true);
				setError(null);
				
				// Simulate loading delay for demo
				await new Promise(resolve => setTimeout(resolve, 1500));
				
				// Mock demo data for hackathon presentation
				const mockProjects: GeneratedProject[] = [
					{
						id: 'demo-patient-intake-001',
						name: 'Primary Care Patient Intake',
						path: '/Users/beakalteshome/src/healthcare-hack/carecanvas-ai/generated-apps/primary-care-patient-intake',
						port: 3001,
						status: 'running',
						url: 'http://localhost:3001',
						createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
					},
					{
						id: 'demo-mental-health-002',
						name: 'Mental Health Assessment Form',
						path: '/Users/beakalteshome/src/healthcare-hack/carecanvas-ai/generated-apps/mental-health-assessment',
						port: 3002,
						status: 'running',
						url: 'http://localhost:3002',
						createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
					},
					{
						id: 'demo-pediatric-003',
						name: 'Pediatric Wellness Check',
						path: '/Users/beakalteshome/src/healthcare-hack/carecanvas-ai/generated-apps/pediatric-wellness-check',
						port: 3003,
						status: 'running',
						url: 'http://localhost:3003',
						createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
					},
					{
						id: 'demo-cardiology-004',
						name: 'Cardiology Pre-Visit Form',
						path: '/Users/beakalteshome/src/healthcare-hack/carecanvas-ai/generated-apps/cardiology-pre-visit',
						status: 'stopped',
						createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
					},
					{
						id: 'demo-dermatology-005',
						name: 'Dermatology Intake & Photo Upload',
						path: '/Users/beakalteshome/src/healthcare-hack/carecanvas-ai/generated-apps/dermatology-intake',
						port: 3005,
						status: 'running',
						url: 'http://localhost:3005',
						createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
					}
				];

				// Also try to load real projects and merge with demo data
				try {
					const response = await fetch('/api/projects');
					const data = await response.json();
					
					if (data.success && data.projects.length > 0) {
						const realProjects = data.projects.map((project: any) => ({
							...project,
							createdAt: new Date(project.createdAt)
						}));
						// Merge real projects with demo projects
						setProjects([...realProjects, ...mockProjects.slice(realProjects.length)]);
					} else {
						setProjects(mockProjects);
					}
				} catch {
					// If API fails, just use mock data
					setProjects(mockProjects);
				}
			} catch (err) {
				console.error('Failed to load projects:', err);
				setError(err instanceof Error ? err.message : 'Failed to load your apps');
			} finally {
				setIsLoadingProjects(false);
			}
		};

		loadProjects();
	}, [userData]);

	const handleLogout = () => {
		localStorage.removeItem('userData');
		router.push('/signup');
	};

	const handleDeleteProject = async (projectId: string) => {
		if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
			return;
		}

		try {
			const response = await fetch(`/api/projects/${projectId}`, {
				method: 'DELETE'
			});
			
			const data = await response.json();
			if (data.success) {
				// Remove from local state
				setProjects(prev => prev.filter(project => project.id !== projectId));
			} else {
				throw new Error(data.error || 'Failed to delete project');
			}
		} catch (err) {
			console.error('Failed to delete project:', err);
			alert('Failed to delete project. Please try again.');
		}
	};

	const handleStopProject = async (projectId: string) => {
		try {
			const response = await fetch(`/api/projects/${projectId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'stop' })
			});
			
			const data = await response.json();
			if (data.success) {
				// Update project status in local state
				setProjects(prev => prev.map(project => 
					project.id === projectId 
						? { ...project, status: 'stopped', url: undefined }
						: project
				));
			} else {
				throw new Error(data.error || 'Failed to stop project');
			}
		} catch (err) {
			console.error('Failed to stop project:', err);
			alert('Failed to stop project. Please try again.');
		}
	};

	const getStatusColor = (status: GeneratedProject['status']) => {
		switch (status) {
			case 'running': return 'text-green-600 bg-green-100';
			case 'stopped': return 'text-gray-600 bg-gray-100';
			case 'error': return 'text-red-600 bg-red-100';
			case 'creating':
			case 'installing':
			case 'starting': return 'text-yellow-600 bg-yellow-100';
			default: return 'text-gray-600 bg-gray-100';
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
								<a href="/" className="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
								<a href="/my-apps" className="text-blue-600 font-medium">My Apps</a>
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

			{/* Main Content */}
			<div className="py-12 px-4">
				<div className="max-w-6xl mx-auto">
					{/* Page Header */}
					<div className="mb-8">
						<h1 className="text-3xl font-bold text-gray-900 mb-4">My Apps</h1>
						<p className="text-gray-600">
							Manage your healthcare applications and download them for local deployment.
						</p>
					</div>

					{/* Error Display */}
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

					{/* Loading State */}
					{isLoadingProjects && (
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
							<div className="text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
								<p className="text-gray-600">Loading your projects...</p>
							</div>
						</div>
					)}

					{/* Empty State */}
					{!isLoadingProjects && projects.length === 0 && (
						<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
							<div className="text-center">
								<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">No apps yet</h3>
								<p className="text-gray-600 mb-6">
									You haven't created any healthcare applications yet.
								</p>
								<a
									href="/"
									className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								>
									<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
									</svg>
									Create Your First App
								</a>
							</div>
						</div>
					)}

					{/* Projects List */}
					{!isLoadingProjects && projects.length > 0 && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{projects.map((project) => (
								<div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1">
											<h3 className="text-lg font-semibold text-gray-900 mb-2">
												{project.name}
											</h3>
											<div className="flex items-center mb-2">
												<span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(project.status)}`}>
													{project.status.charAt(0).toUpperCase() + project.status.slice(1)}
												</span>
												{project.port && (
													<span className="text-xs text-gray-500 ml-2">
														Port {project.port}
													</span>
												)}
											</div>
											<p className="text-sm text-gray-500">
												Created {project.createdAt.toLocaleDateString()}
											</p>
										</div>
										<div className="flex items-center space-x-2">
											{project.status === 'running' && project.url && (
												<a
													href={project.url}
													target="_blank"
													rel="noopener noreferrer"
													className="p-2 text-gray-400 hover:text-green-600 transition-colors"
													title="Open App"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
													</svg>
												</a>
											)}
											{project.status === 'running' && (
												<button
													onClick={() => handleStopProject(project.id)}
													className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
													title="Stop Project"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
													</svg>
												</button>
											)}
											<button
												onClick={() => handleDeleteProject(project.id)}
												className="p-2 text-gray-400 hover:text-red-600 transition-colors"
												title="Delete Project"
											>
												<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
											</button>
										</div>
									</div>
									
									<div className="space-y-2">
										{project.url && (
											<div className="flex items-center text-sm text-blue-600">
												<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
												</svg>
												<a href={project.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
													{project.url}
												</a>
											</div>
										)}
										{project.error && (
											<div className="text-sm text-red-600 bg-red-50 p-2 rounded">
												<strong>Error:</strong> {project.error}
											</div>
										)}
										<div className="flex items-center justify-between text-xs text-gray-500">
											<span className="bg-gray-100 px-2 py-1 rounded-full">
												{project.path}
											</span>
											<div className="flex items-center">
												<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
													<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
												</svg>
												{project.createdAt.toLocaleTimeString()}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}

					{/* Create New App CTA */}
					{!isLoadingProjects && projects.length > 0 && (
						<div className="mt-8 text-center">
							<a
								href="/"
								className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								<svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
								</svg>
								Create New App
							</a>
						</div>
					)}
				</div>
			</div>
		</div>
	);
} 