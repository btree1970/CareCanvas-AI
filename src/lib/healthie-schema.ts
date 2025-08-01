// Healthie GraphQL Schema Subset for CareCanvas AI
// Based on Healthie API documentation and MCP exploration

export const HEALTHIE_SCHEMA = {
	// Core Mutations for Form Handling
	mutations: {
		createFormAnswerGroup: {
			description: 'Submit completed forms to Healthie',
			input: 'createFormAnswerGroupInput',
			returns: 'createFormAnswerGroupPayload',
			example: `
        mutation SubmitForm($input: createFormAnswerGroupInput!) {
          createFormAnswerGroup(input: $input) {
            form_answer_group {
              id
              finished
              created_at
              form_answers {
                id
                answer
                custom_module_id
                label
              }
            }
            messages {
              field
              message
            }
          }
        }
      `,
			variables_example: {
				input: {
					user_id: "patient_123",
					custom_module_form_id: "intake_form_456",
					finished: true,
					form_answers: [
						{
							custom_module_id: "name_field",
							answer: "John Doe",
							label: "Full Name"
						}
					]
				}
			}
		},

		createUser: {
			description: 'Create new patient or provider accounts',
			input: 'createUserInput',
			returns: 'createUserPayload',
			use_cases: ['Patient registration', 'Provider onboarding']
		},

		createAppointment: {
			description: 'Schedule appointments between patients and providers',
			input: 'createAppointmentInput',
			returns: 'createAppointmentPayload',
			use_cases: ['Appointment booking', 'Telehealth scheduling']
		},

		sendMessage: {
			description: 'Send secure messages between patients and providers',
			input: 'sendMessageInput',
			returns: 'sendMessagePayload',
			use_cases: ['Patient-provider communication', 'Clinical consultations']
		}
	},

	// Core Types
	types: {
		FormAnswerGroup: {
			description: 'A completed form with metadata and answers',
			fields: {
				id: 'ID! - Unique identifier',
				finished: 'Boolean! - Whether form is complete',
				created_at: 'String! - Submission timestamp',
				updated_at: 'String - Last modification time',
				user_id: 'String - Patient who filled the form',
				custom_module_form: 'CustomModuleForm - Form template used',
				form_answers: '[FormAnswer!]! - Individual field responses',
				appointment: 'Appointment - Associated appointment if any',
				metadata: 'String - JSON metadata up to 128k chars'
			}
		},

		FormAnswer: {
			description: 'Individual answer to a form field',
			fields: {
				id: 'ID! - Unique identifier',
				answer: 'String - The response value',
				custom_module_id: 'String - Field identifier',
				label: 'String - Human-readable field name',
				metadata: 'String - Additional field metadata',
				form_answer_group: 'FormAnswerGroup - Parent form'
			}
		},

		CustomModuleForm: {
			description: 'Form template/schema definition',
			fields: {
				id: 'ID! - Template identifier',
				name: 'String - Form name',
				description: 'String - Form purpose description',
				form_answer_groups: '[FormAnswerGroup!]! - Completed instances',
				custom_modules: '[CustomModule!]! - Form fields/questions',
				external_id: 'String - Third-party system ID'
			}
		},

		User: {
			description: 'Patient or provider account',
			fields: {
				id: 'ID! - User identifier',
				email: 'String - Login email',
				first_name: 'String - Given name',
				last_name: 'String - Family name',
				phone_number: 'String - Primary phone',
				date_of_birth: 'String - Birth date (YYYY-MM-DD)',
				user_type: 'String - patient/provider role',
				timezone: 'String - User timezone',
				avatar_url: 'String - Profile picture URL'
			}
		},

		Appointment: {
			description: 'Scheduled patient-provider meeting',
			fields: {
				id: 'ID! - Appointment identifier',
				start_time: 'String - ISO datetime start',
				end_time: 'String - ISO datetime end',
				appointment_type: 'AppointmentType - Visit category',
				user: 'User - Patient',
				provider: 'User - Healthcare provider',
				location: 'String - Physical or virtual location',
				status: 'String - scheduled/completed/cancelled',
				form_answer_groups: '[FormAnswerGroup!] - Associated forms'
			}
		}
	},

	// Input Types for Mutations
	inputs: {
		createFormAnswerGroupInput: {
			description: 'Parameters for form submission',
			fields: {
				user_id: 'String! - Patient identifier (required)',
				custom_module_form_id: 'String! - Form template ID (required)',
				finished: 'Boolean - Mark as complete (default: true)',
				form_answers: '[FormAnswerInput] - Field responses',
				appointment_id: 'ID - Link to appointment',
				metadata: 'String - JSON metadata (max 128k chars)',
				external_id: 'String - Third-party reference ID',
				date: 'String - Form completion date',
				time: 'String - Form completion time'
			}
		},

		FormAnswerInput: {
			description: 'Individual field response',
			fields: {
				custom_module_id: 'String! - Field identifier (required)',
				answer: 'String! - Response value (required)',
				label: 'String - Human-readable field name',
				metadata: 'String - Additional field data',
				user_id: 'String - Override respondent ID'
			}
		}
	},

	// Authentication & Headers
	authentication: {
		method: 'Basic Authentication',
		headers: {
			'Authorization': 'Basic <base64_encoded_api_key>',
			'AuthorizationSource': 'API',
			'Content-Type': 'application/json'
		},
		api_endpoint: 'https://api.gethealthie.com/graphql',
		sandbox_endpoint: 'https://staging-api.gethealthie.com/graphql'
	},

	// Common Patterns & Best Practices
	patterns: {
		form_submission: {
			description: 'Standard pattern for submitting healthcare forms',
			steps: [
				'1. Collect form data from user interface',
				'2. Map UI fields to Healthie custom_module_ids',
				'3. Validate required fields and data formats',
				'4. Construct FormAnswerInput array',
				'5. Submit via createFormAnswerGroup mutation',
				'6. Handle success/error responses',
				'7. Show confirmation or error to user'
			],
			error_handling: [
				'Check for GraphQL errors in response',
				'Validate field-level messages array',
				'Handle network/timeout errors gracefully',
				'Provide user-friendly error messages',
				'Allow form retry on recoverable errors'
			]
		},

		patient_registration: {
			description: 'New patient onboarding workflow',
			steps: [
				'1. Collect demographic information',
				'2. Create user account via createUser mutation',
				'3. Submit intake forms via createFormAnswerGroup',
				'4. Schedule initial appointment if needed',
				'5. Send welcome communication'
			]
		},

		clinical_assessment: {
			description: 'Validated assessment tool submission',
			steps: [
				'1. Present assessment questions to user',
				'2. Calculate scores using validated algorithms',
				'3. Determine risk levels and recommendations',
				'4. Submit both responses and calculated results',
				'5. Trigger clinical alerts if indicated',
				'6. Schedule follow-up if needed'
			]
		}
	},

	// Field Mapping Guidelines
	field_mapping: {
		common_fields: {
			patient_name: 'maps to User.first_name + User.last_name',
			email: 'maps to User.email',
			phone: 'maps to User.phone_number',
			date_of_birth: 'maps to User.date_of_birth',
			avatar_selection: 'maps to User.avatar_url or custom field',
			pain_location: 'maps to custom field with SNOMED codes',
			assessment_scores: 'maps to custom fields with score metadata',
			appointment_notes: 'maps to Appointment notes or custom field'
		},

		custom_module_mapping: {
			description: 'How to map form fields to Healthie custom modules',
			convention: 'Use descriptive custom_module_id like "patient_chief_complaint"',
			examples: {
				'pain_scale_1_10': 'Pain intensity rating field',
				'symptoms_description': 'Free text symptom description',
				'phq9_total_score': 'PHQ-9 depression screening total',
				'medication_list_current': 'Current medications list',
				'emergency_contact_name': 'Emergency contact information'
			}
		}
	},

	// Data Validation Rules
	validation: {
		required_fields: [
			'user_id must be valid Healthie user ID',
			'custom_module_form_id must exist in Healthie',
			'form_answers array cannot be empty for finished forms'
		],

		data_formats: {
			dates: 'YYYY-MM-DD format required',
			times: 'HH:MM format or ISO datetime',
			phone_numbers: 'E.164 format preferred (+1234567890)',
			email: 'Valid email format required',
			metadata: 'Valid JSON string, max 128,000 characters'
		},

		constraints: {
			answer_length: 'Form answers should be reasonable length',
			metadata_size: 'Metadata field limited to 128k characters',
			form_submission: 'Cannot resubmit finished forms without new instance'
		}
	}
};

// Helper function to generate Healthie integration code examples
export function generateHealthieIntegrationExamples(): string {
	return `
## HEALTHIE INTEGRATION EXAMPLES

### Basic Form Submission
\`\`\`typescript
const submitToHealthie = async (formData: any) => {
  const mutation = \`
    mutation SubmitForm($input: createFormAnswerGroupInput!) {
      createFormAnswerGroup(input: $input) {
        form_answer_group { id finished }
        messages { field message }
      }
    }
  \`;

  const variables = {
    input: {
      user_id: currentUser.healthieId,
      custom_module_form_id: "patient_intake_v2",
      finished: true,
      form_answers: Object.entries(formData).map(([field, value]) => ({
        custom_module_id: field,
        answer: String(value),
        label: getFieldLabel(field)
      }))
    }
  };

  const response = await healthieClient.mutate({ mutation, variables });
  return response.data.createFormAnswerGroup;
};
\`\`\`

### Clinical Assessment Submission
\`\`\`typescript
const submitAssessment = async (responses: Record<string, number>, result: AssessmentResult) => {
  const formAnswers = [
    // Individual question responses
    ...Object.entries(responses).map(([questionId, score]) => ({
      custom_module_id: \`phq9_\${questionId}\`,
      answer: String(score),
      label: getQuestionText(questionId)
    })),
    
    // Calculated results
    {
      custom_module_id: "phq9_total_score",
      answer: String(result.totalScore),
      label: "PHQ-9 Total Score",
      metadata: JSON.stringify({
        interpretation: result.interpretation,
        riskLevel: result.riskLevel,
        recommendations: result.clinicalRecommendations
      })
    }
  ];

  await submitToHealthie({ form_answers: formAnswers });
};
\`\`\`

### Error Handling Pattern
\`\`\`typescript
try {
  const result = await submitToHealthie(formData);
  
  if (result.messages && result.messages.length > 0) {
    // Handle field-level validation errors
    const errors = result.messages.reduce((acc, msg) => {
      acc[msg.field] = msg.message;
      return acc;
    }, {});
    setFieldErrors(errors);
  } else {
    // Success
    showSuccessMessage("Form submitted successfully!");
    router.push("/confirmation");
  }
} catch (error) {
  // Handle network or GraphQL errors
  showErrorMessage("Unable to submit form. Please try again.");
  logSecurely("form_submission_error", { error: error.message });
}
\`\`\`
`;
}

// Generate Healthie schema documentation for LLM context
export function generateHealthieSchemaDoc(): string {
	return `
# HEALTHIE GRAPHQL INTEGRATION

## AUTHENTICATION
${JSON.stringify(HEALTHIE_SCHEMA.authentication, null, 2)}

## KEY MUTATIONS
${Object.entries(HEALTHIE_SCHEMA.mutations).map(([name, info]) => `
### ${name}
${info.description}
**Example:**
${info.example || 'See documentation'}
`).join('\n')}

## CORE TYPES
${Object.entries(HEALTHIE_SCHEMA.types).map(([name, type]) => `
### ${name}
${type.description}
**Fields:**
${Object.entries(type.fields).map(([field, desc]) => `- ${field}: ${desc}`).join('\n')}
`).join('\n')}

## INTEGRATION PATTERNS
${Object.entries(HEALTHIE_SCHEMA.patterns).map(([name, pattern]) => `
### ${name}
${pattern.description}
**Steps:**
${pattern.steps.map(step => `${step}`).join('\n')}
`).join('\n')}

## FIELD MAPPING
${JSON.stringify(HEALTHIE_SCHEMA.field_mapping, null, 2)}

${generateHealthieIntegrationExamples()}
`;
}
