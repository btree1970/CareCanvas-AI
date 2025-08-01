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
			<div className={`assessment-results ${className}`}>
				<div className="bg-white border border-gray-200 rounded-lg p-6">
					<div className="text-center mb-6">
						<h3 className="text-xl font-semibold text-gray-800 mb-2">
							Assessment Complete
						</h3>
						<div className="text-3xl font-bold text-blue-600 mb-2">
							{result.totalScore} / {questions.length * 3}
						</div>
						<p className="text-lg text-gray-600">{result.interpretation}</p>
					</div>

					<div className="mb-6">
						<div className={`
              p-4 rounded-lg border-l-4 
              ${result.riskLevel === 'minimal' ? 'bg-green-50 border-green-500' : ''}
              ${result.riskLevel === 'mild' ? 'bg-yellow-50 border-yellow-500' : ''}
              ${result.riskLevel === 'moderate' ? 'bg-orange-50 border-orange-500' : ''}
              ${result.riskLevel === 'severe' ? 'bg-red-50 border-red-500' : ''}
            `}>
							<h4 className="font-semibold mb-2">Clinical Recommendations:</h4>
							<ul className="space-y-1">
								{result.clinicalRecommendations.map((rec, index) => (
									<li key={index} className="flex items-start">
										<span className="text-sm mr-2">•</span>
										<span className="text-sm">{rec}</span>
									</li>
								))}
							</ul>
						</div>
					</div>

					<div className="text-center">
						<button
							onClick={() => {
								setShowResults(false);
								setCurrentQuestionIndex(0);
								setResponses({});
							}}
							className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800"
						>
							Retake Assessment
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={`assessment-scale ${className}`}>
			<div className="mb-6">
				<h3 className="text-lg font-semibold text-gray-800 mb-2">
					{scale.title}
				</h3>
				<p className="text-sm text-gray-600 mb-4">
					{scale.description}
				</p>

				{/* Progress Bar */}
				<div className="mb-4">
					<div className="flex justify-between text-sm text-gray-600 mb-2">
						<span>Progress</span>
						<span>{Math.round(progress)}%</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2">
						<div
							className="bg-blue-600 h-2 rounded-full transition-all duration-300"
							style={{ width: `${progress}%` }}
						></div>
					</div>
				</div>

				<p className="text-sm text-gray-700 font-medium mb-4">
					{scale.timeframe}
				</p>
			</div>

			{currentQuestion && (
				<div className="bg-white border border-gray-200 rounded-lg p-6">
					<div className="mb-4">
						<div className="text-sm text-gray-500 mb-2">
							Question {currentQuestionIndex + 1} of {questions.length}
						</div>
						<h4 className="text-lg font-medium text-gray-800">
							{currentQuestion.text}
						</h4>
					</div>

					<div className="space-y-3">
						{currentQuestion.options.map((option) => (
							<button
								key={option.value}
								onClick={() => handleResponseChange(currentQuestion.id, option.value)}
								className={`
                  w-full text-left p-4 rounded-lg border transition-all
                  ${responses[currentQuestion.id] === option.value
										? 'border-blue-500 bg-blue-50'
										: 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
									}
                `}
							>
								<div className="flex items-center">
									<div className={`
                    w-4 h-4 rounded-full border-2 mr-3
                    ${responses[currentQuestion.id] === option.value
											? 'border-blue-500 bg-blue-500'
											: 'border-gray-300'
										}
                  `}>
										{responses[currentQuestion.id] === option.value && (
											<div className="w-full h-full rounded-full bg-white transform scale-50"></div>
										)}
									</div>
									<div>
										<div className="font-medium">{option.label}</div>
										{option.description && (
											<div className="text-sm text-gray-500">{option.description}</div>
										)}
									</div>
								</div>
							</button>
						))}
					</div>

					{/* Navigation */}
					<div className="flex justify-between mt-6">
						<button
							onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
							disabled={currentQuestionIndex === 0}
							className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>

						{currentQuestionIndex < questions.length - 1 ? (
							<button
								onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
								disabled={responses[currentQuestion.id] === undefined}
								className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Next
							</button>
						) : (
							<button
								onClick={() => setShowResults(true)}
								disabled={!isComplete}
								className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								View Results
							</button>
						)}
					</div>
				</div>
			)}

			{/* Question Overview */}
			<div className="mt-6">
				<h4 className="text-sm font-medium text-gray-700 mb-3">Question Overview</h4>
				<div className="grid grid-cols-3 md:grid-cols-5 gap-2">
					{questions.map((_, index) => (
						<button
							key={index}
							onClick={() => setCurrentQuestionIndex(index)}
							className={`
                w-full aspect-square rounded-lg text-sm font-medium transition-all
                ${responses[questions[index].id] !== undefined
									? 'bg-green-500 text-white'
									: index === currentQuestionIndex
										? 'bg-blue-500 text-white'
										: 'bg-gray-200 text-gray-600 hover:bg-gray-300'
								}
              `}
						>
							{index + 1}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}

export default AssessmentScale;
