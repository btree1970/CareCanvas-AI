// CareCanvas AI Healthcare Widget Library
import { PainMap } from './PainMap';
import { PatientDemographics } from './PatientDemographics';
import { PatientIntakeForm } from './PatientIntakeForm';
import { RefillTracker } from './RefillTracker';

// Re-export for external use
export { PainMap, PatientDemographics, PatientIntakeForm, RefillTracker };

// For default exports compatibility
// export { default as AvatarPickerDefault } from './AvatarPicker';
export { default as PainMapDefault } from './PainMap';
export { default as PatientDemographicsDefault } from './PatientDemographics';
export { default as PatientIntakeFormDefault } from './PatientIntakeForm';
export { default as RefillTrackerDefault } from './RefillTracker';

// Export types
export type { RefillRecord } from './RefillTracker';
export type { PatientIntakeData } from './PatientIntakeForm';

// Widget Registry for LLM Context
export const WIDGET_REGISTRY = {
	AvatarPicker: {
		description: 'Age-appropriate avatar selection for patient engagement',
		props: {
			ageGroup: 'infant | child | teen | adult',
			onChange: '(avatarId: string) => void',
			value: 'string (optional)',
			className: 'string (optional)'
		},
		use_cases: [
			'Pediatric forms for children 3-17',
			'Patient engagement and personalization',
			'Mental health assessments',
			'Telehealth intake forms'
		],
		healthie_integration: 'Maps to custom avatar field in patient profile',
		accessibility: 'WCAG 2.1 AA compliant with keyboard navigation'
	},

	PainMap: {
		description: 'Interactive body diagram for pain location and intensity mapping',
		props: {
			onChange: '(painPoints: PainPoint[]) => void',
			value: 'PainPoint[] (optional)',
			bodyType: 'adult | child',
			maxPoints: 'number (default: 10)',
			className: 'string (optional)'
		},
		use_cases: [
			'Pain assessments and chronic pain management',
			'Post-surgical follow-ups',
			'Physical therapy evaluations',
			'Emergency department triage'
		],
		clinical_coding: 'Maps to SNOMED CT body location codes',
		healthie_integration: 'Stores pain data with location and intensity',
		accessibility: 'Touch and click interactions with keyboard alternatives'
	},

	PatientDemographics: {
		description: 'Comprehensive patient demographic information collection',
		props: {
			onChange: '(data: PatientDemographics) => void',
			value: 'Partial<PatientDemographics> (optional)',
			required: 'Array of required field names',
			className: 'string (optional)'
		},
		use_cases: [
			'Patient registration and intake',
			'Electronic health record updates',
			'Insurance verification forms',
			'Contact information management'
		],
		validation: 'Built-in validation for phone, email, ZIP codes',
		healthie_integration: 'Maps to Healthie user profile fields',
		compliance: 'HIPAA-compliant data handling and storage'
	},

	PatientIntakeForm: {
		description: 'Comprehensive patient intake form for primary care offices collecting demographics, medical history, and current symptoms',
		props: {
			onChange: '(data: PatientIntakeData) => void',
			value: 'Partial<PatientIntakeData> (optional)',
			className: 'string (optional)',
			readOnly: 'boolean (optional)'
		},
		use_cases: [
			'Primary care patient registration',
			'New patient intake and onboarding',
			'Comprehensive medical history collection',
			'Insurance and demographic information gathering'
		],
		clinical_features: [
			'Demographics collection (name, DOB, contact info)',
			'Medical history (allergies, medications, conditions)',
			'Current symptoms assessment',
			'Vital signs documentation',
			'Emergency contact information'
		],
		healthie_integration: 'Maps to Healthie patient profile and medical history fields',
		compliance: 'HIPAA-compliant data collection and storage'
	},

	RefillTracker: {
		description: 'Practice-wide medication refill tracker that monitors active prescriptions and flags those approaching or past their expected refill date',
		props: {
			onChange: '(data: RefillRecord[]) => void',
			value: 'RefillRecord[] (optional)',
			className: 'string (optional)',
			readOnly: 'boolean (optional)'
		},
		use_cases: [
			'Medication management and refill tracking',
			'Practice-wide prescription monitoring',
			'Patient medication adherence tracking',
			'Pharmacy coordination and communication'
		],
		clinical_features: [
			'Real-time refill status monitoring',
			'Color-coded status indicators (overdue, due soon, OK)',
			'Patient medication history tracking',
			'Summary statistics and alerts'
		],
		healthie_integration: 'Maps to Healthie medication and prescription management',
		compliance: 'HIPAA-compliant medication data handling'
	}
};

// Widget Component Map for Dynamic Loading
export const WIDGET_COMPONENTS = {
	PatientIntakeForm,
	RefillTracker
};

// Helper function to get widget information
export function getWidgetInfo(widgetName: string) {
	return WIDGET_REGISTRY[widgetName as keyof typeof WIDGET_REGISTRY];
}

// Helper function to check if a widget exists
export function isValidWidget(widgetName: string): boolean {
	return widgetName in WIDGET_REGISTRY;
}

// Generate widget documentation for LLM context
export function generateWidgetDocumentation(): string {
	return Object.entries(WIDGET_REGISTRY)
		.map(([name, info]) => {
			return `
## ${name}
${info.description}

**Props:**
${Object.entries(info.props).map(([prop, type]) => `- ${prop}: ${type}`).join('\n')}

**Use Cases:**
${info.use_cases.map(useCase => `- ${useCase}`).join('\n')}

**Healthcare Integration:**
- ${info.healthie_integration}
${'clinical_coding' in info ? `- Clinical Coding: ${info.clinical_coding}` : ''}
${'compliance' in info ? `- Compliance: ${info.compliance}` : ''}

**Accessibility:** ${'accessibility' in info ? info.accessibility : 'Standard accessibility features'}
`;
		})
		.join('\n---\n');
}
