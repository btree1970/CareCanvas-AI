'use client'

import React, { useState, useEffect } from 'react';

interface AssessmentQuestion {
	id: string;
	text: string;
	options: Array<{
		value: number;
		label: string;
		description?: string;
	}>;
}

interface AssessmentResult {
	totalScore: number;
	subscoreBreakdown?: Record<string, number>;
	interpretation: string;
	riskLevel: 'minimal' | 'mild' | 'moderate' | 'severe';
	clinicalRecommendations: string[];
}

interface AssessmentScaleProps {
	scaleType: 'PHQ-9' | 'GAD-7' | 'ADHD-Vanderbilt' | 'Beck-Depression';
	onChange: (responses: Record<string, number>, result: AssessmentResult) => void;
	value?: Record<string, number>;
	className?: string;
}

// Clinical assessment scales data
const ASSESSMENT_SCALES = {
	'PHQ-9': {
		title: 'Patient Health Questionnaire-9 (PHQ-9)',
		description: 'Depression screening questionnaire',
		timeframe: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
		questions: [
			{ id: 'phq1', text: 'Little interest or pleasure in doing things' },
			{ id: 'phq2', text: 'Feeling down, depressed, or hopeless' },
			{ id: 'phq3', text: 'Trouble falling or staying asleep, or sleeping too much' },
			{ id: 'phq4', text: 'Feeling tired or having little energy' },
			{ id: 'phq5', text: 'Poor appetite or overeating' },
			{ id: 'phq6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
			{ id: 'phq7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
			{ id: 'phq8', text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual' },
			{ id: 'phq9', text: 'Thoughts that you would be better off dead or of hurting yourself in some way' },
		],
		options: [
			{ value: 0, label: 'Not at all', description: '0 days' },
			{ value: 1, label: 'Several days', description: '1-6 days' },
			{ value: 2, label: 'More than half the days', description: '7+ days' },
			{ value: 3, label: 'Nearly every day', description: '11+ days' },
		],
		scoring: {
			ranges: [
				{ min: 0, max: 4, interpretation: 'Minimal depression', riskLevel: 'minimal' as const },
				{ min: 5, max: 9, interpretation: 'Mild depression', riskLevel: 'mild' as const },
				{ min: 10, max: 14, interpretation: 'Moderate depression', riskLevel: 'moderate' as const },
				{ min: 15, max: 19, interpretation: 'Moderately severe depression', riskLevel: 'severe' as const },
				{ min: 20, max: 27, interpretation: 'Severe depression', riskLevel: 'severe' as const },
			]
		}
	},
	'GAD-7': {
		title: 'Generalized Anxiety Disorder 7-item (GAD-7)',
		description: 'Anxiety screening questionnaire',
		timeframe: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
		questions: [
			{ id: 'gad1', text: 'Feeling nervous, anxious or on edge' },
			{ id: 'gad2', text: 'Not being able to stop or control worrying' },
			{ id: 'gad3', text: 'Worrying too much about different things' },
			{ id: 'gad4', text: 'Trouble relaxing' },
			{ id: 'gad5', text: 'Being so restless that it is hard to sit still' },
			{ id: 'gad6', text: 'Becoming easily annoyed or irritable' },
			{ id: 'gad7', text: 'Feeling afraid as if something awful might happen' },
		],
		options: [
			{ value: 0, label: 'Not at all' },
			{ value: 1, label: 'Several days' },
			{ value: 2, label: 'More than half the days' },
			{ value: 3, label: 'Nearly every day' },
		],
		scoring: {
			ranges: [
				{ min: 0, max: 4, interpretation: 'Minimal anxiety', riskLevel: 'minimal' as const },
				{ min: 5, max: 9, interpretation: 'Mild anxiety', riskLevel: 'mild' as const },
				{ min: 10, max: 14, interpretation: 'Moderate anxiety', riskLevel: 'moderate' as const },
				{ min: 15, max: 21, interpretation: 'Severe anxiety', riskLevel: 'severe' as const },
			]
		}
	}
};

export function AssessmentScale({
	scaleType,
	onChange,
	value = {},
	className = ''
}: AssessmentScaleProps) {
	const [responses, setResponses] = useState<Record<string, number>>(value);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [showResults, setShowResults] = useState(false);

	const scale = ASSESSMENT_SCALES[scaleType];
	const questions = scale.questions.map(q => ({
		...q,
		options: scale.options
	}));

	const calculateResult = (responses: Record<string, number>): AssessmentResult => {
		const totalScore = Object.values(responses).reduce((sum, score) => sum + score, 0);

		const scoreRange = scale.scoring.ranges.find(range =>
			totalScore >= range.min && totalScore <= range.max
		);

		const interpretation = scoreRange?.interpretation || 'Score out of range';
		const riskLevel = scoreRange?.riskLevel || 'minimal';

		// Generate clinical recommendations based on score
		let clinicalRecommendations: string[] = [];

		switch (riskLevel) {
			case 'minimal':
				clinicalRecommendations = [
					'Continue current wellness practices',
					'Monitor symptoms if they change',
					'Consider preventive mental health resources'
				];
				break;
			case 'mild':
				clinicalRecommendations = [
					'Consider counseling or therapy',
					'Monitor symptoms regularly',
					'Discuss with healthcare provider',
					'Consider lifestyle modifications'
				];
				break;
			case 'moderate':
				clinicalRecommendations = [
					'Strongly recommend professional evaluation',
					'Consider therapy and/or medication',
					'Monitor symptoms closely',
					'Safety planning if indicated'
				];
				break;
			case 'severe':
				clinicalRecommendations = [
					'Immediate professional evaluation recommended',
					'Consider intensive treatment options',
					'Safety assessment required',
					'Follow-up care essential'
				];

				// Special handling for PHQ-9 question 9 (suicidal ideation)
				if (scaleType === 'PHQ-9' && responses.phq9 > 0) {
					clinicalRecommendations.unshift('URGENT: Suicidal ideation detected - immediate safety evaluation required');
				}
				break;
		}

		return {
			totalScore,
			interpretation,
			riskLevel,
			clinicalRecommendations
		};
	};

	useEffect(() => {
		if (Object.keys(responses).length === questions.length) {
			const result = calculateResult(responses);
			onChange(responses, result);
		}
	}, [responses, onChange, questions.length]);

	const handleResponseChange = (questionId: string, value: number) => {
		const newResponses = { ...responses, [questionId]: value };
		setResponses(newResponses);

		// Auto-advance to next question
		if (currentQuestionIndex < questions.length - 1) {
			setTimeout(() => {
				setCurrentQuestionIndex(prev => prev + 1);
			}, 300);
		} else {
			// Show results when all questions are answered
			setTimeout(() => {
				setShowResults(true);
			}, 500);
		}
	};

	const currentQuestion = questions[currentQuestionIndex];
	const isComplete = Object.keys(responses).length === questions.length;
	const progress = ((currentQuestionIndex + (responses[currentQuestion?.id] !== undefined ? 1 : 0)) / questions.length) * 100;

	if (showResults && isComplete) {
		const result = calculateResult(responses);

		return (
			<div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
				<div className="mb-8">
					<div className="flex items-center mb-3">
						<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
							<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<h3 className="text-xl font-semibold text-gray-900">
							Assessment Complete
						</h3>
					</div>
				</div>

				<div className="space-y-6">
					{/* Score Display */}
					<div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
						<div className="text-4xl font-bold text-blue-600 mb-2">
							{result.totalScore} / {questions.length * 3}
						</div>
						<div className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${
							result.riskLevel === 'minimal' ? 'bg-green-100 text-green-800 border-green-200' :
							result.riskLevel === 'mild' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
							result.riskLevel === 'moderate' ? 'bg-orange-100 text-orange-800 border-orange-200' :
							'bg-red-100 text-red-800 border-red-200'
						}`}>
							{result.interpretation}
						</div>
					</div>

					{/* Clinical Recommendations */}
					<div className="space-y-4">
						<h4 className="text-lg font-medium text-gray-900 flex items-center">
							<span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
							Clinical Recommendations
						</h4>
						<div className="space-y-3">
							{result.clinicalRecommendations.map((rec, index) => (
								<div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
									<div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
									<p className="text-sm text-gray-700">{rec}</p>
								</div>
							))}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 pt-4">
						<button
							onClick={() => {
								setShowResults(false);
								setCurrentQuestionIndex(0);
								setResponses({});
							}}
							className="flex-1 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
						>
							Retake Assessment
						</button>
						<button
							onClick={() => {
								// Handle save or export
							}}
							className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
						>
							Save Results
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`}>
			<div className="mb-8">
				<div className="flex items-center mb-3">
					<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
						<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
						</svg>
					</div>
					<h3 className="text-xl font-semibold text-gray-900">
						{scale.title}
					</h3>
				</div>
				<p className="text-sm text-gray-600 mb-4">
					{scale.description}
				</p>

				{/* Progress Bar */}
				<div className="mb-6">
					<div className="flex justify-between text-sm text-gray-600 mb-2">
						<span>Progress</span>
						<span>{Math.round(progress)}%</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
							style={{ width: `${progress}%` }}
						></div>
					</div>
				</div>

				<p className="text-sm text-gray-700 font-medium mb-6">
					{scale.timeframe}
				</p>
			</div>

			{currentQuestion && (
				<div className="space-y-6">
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="text-sm text-gray-500">
								Question {currentQuestionIndex + 1} of {questions.length}
							</div>
							<div className="text-sm text-gray-500">
								{Math.round((currentQuestionIndex / questions.length) * 100)}% complete
							</div>
						</div>
						<h4 className="text-lg font-medium text-gray-900 leading-relaxed">
							{currentQuestion.text}
						</h4>
					</div>

					<div className="space-y-3">
						{currentQuestion.options.map((option) => (
							<button
								key={option.value}
								onClick={() => handleResponseChange(currentQuestion.id, option.value)}
								className={`
                  w-full text-left p-4 rounded-lg border transition-all duration-200
                  ${responses[currentQuestion.id] === option.value
										? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
										: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
									}
                `}
							>
								<div className="flex items-center justify-between">
									<div>
										<div className="font-medium text-gray-900">{option.label}</div>
										{option.description && (
											<div className="text-sm text-gray-500 mt-1">{option.description}</div>
										)}
									</div>
									{responses[currentQuestion.id] === option.value && (
										<div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
											<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
											</svg>
										</div>
									)}
								</div>
							</button>
						))}
					</div>

					{/* Navigation */}
					<div className="flex justify-between pt-4">
						<button
							onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
							disabled={currentQuestionIndex === 0}
							className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Previous
						</button>
						<div className="text-sm text-gray-500">
							{currentQuestionIndex + 1} of {questions.length}
						</div>
					</div>
				</div>
			)}

		</div>
	);
}

export default AssessmentScale;
