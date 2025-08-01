// Healthcare Domain Knowledge for CareCanvas AI
export const HEALTHCARE_KNOWLEDGE = {
  // Common Healthcare Workflows
  workflows: {
    patient_intake: {
      steps: ["Demographics", "Chief Complaint", "Medical History", "Insurance", "Consent"],
      typical_fields: ["name", "dob", "phone", "email", "emergency_contact", "symptoms", "pain_level", "allergies", "medications", "insurance_id"]
    },
    clinical_assessment: {
      steps: ["Screening Questions", "Scoring", "Risk Assessment", "Recommendations"],
      validated_tools: ["PHQ-9", "GAD-7", "ADHD-RS", "Beck Depression Inventory", "Mini Mental State"]
    },
    telehealth_intake: {
      steps: ["Tech Check", "Consent", "Symptoms", "Medical History"],
      special_requirements: ["camera_test", "audio_test", "privacy_confirmation"]
    },
    pediatric_intake: {
      age_considerations: {
        "0-2": "Parent/guardian completes all forms",
        "3-7": "Visual aids, simple language, parent assistance", 
        "8-12": "Age-appropriate questions, parent oversight",
        "13-17": "Confidentiality considerations, parent/teen sections"
      }
    }
  },

  // Clinical Assessment Tools
  assessments: {
    "PHQ-9": {
      description: "Patient Health Questionnaire-9 for depression screening",
      questions: 9,
      scoring: "0-4 scale per question, total 0-27",
      interpretation: {
        "0-4": "Minimal depression",
        "5-9": "Mild depression", 
        "10-14": "Moderate depression",
        "15-19": "Moderately severe depression",
        "20-27": "Severe depression"
      },
      healthie_mapping: "phq_9_assessment"
    },
    "GAD-7": {
      description: "Generalized Anxiety Disorder 7-item scale",
      questions: 7,
      scoring: "0-3 scale per question, total 0-21",
      interpretation: {
        "0-4": "Minimal anxiety",
        "5-9": "Mild anxiety",
        "10-14": "Moderate anxiety", 
        "15-21": "Severe anxiety"
      },
      healthie_mapping: "gad_7_assessment"
    },
    "Vanderbilt-ADHD": {
      description: "ADHD screening for children and adolescents",
      versions: ["Parent", "Teacher", "Self-report (adolescents)"],
      domains: ["Inattention", "Hyperactivity/Impulsivity", "Combined"],
      age_range: "6-18 years",
      healthie_mapping: "adhd_vanderbilt_assessment"
    }
  },

  // Medical Terminology & Fields
  medical_fields: {
    demographics: ["full_name", "date_of_birth", "gender", "preferred_pronouns", "race_ethnicity", "primary_language"],
    contact: ["phone_primary", "phone_secondary", "email", "address", "emergency_contact_name", "emergency_contact_phone"],
    medical_history: ["current_medications", "allergies", "past_surgeries", "family_history", "social_history"],
    symptoms: ["chief_complaint", "symptom_onset", "pain_scale", "symptom_severity", "associated_symptoms"],
    mental_health: ["mood", "anxiety_level", "sleep_pattern", "appetite", "energy_level", "concentration"],
    insurance: ["insurance_provider", "member_id", "group_number", "subscriber_name", "effective_date"]
  },

  // HIPAA Compliance Requirements
  hipaa_requirements: {
    data_handling: [
      "No PHI in console.log statements",
      "Encrypted data transmission (HTTPS)",
      "Secure storage practices",
      "Access logging and audit trails",
      "Data minimization principles"
    ],
    ui_requirements: [
      "Clear privacy notices",
      "Explicit consent checkboxes", 
      "Session timeout warnings",
      "Secure logout functionality",
      "No auto-fill for sensitive fields"
    ],
    required_disclosures: [
      "HIPAA Privacy Notice",
      "Data sharing agreements",
      "Third-party integrations disclosure",
      "Patient rights information"
    ]
  },

  // Healthcare UI/UX Patterns
  ui_patterns: {
    accessibility: {
      wcag_requirements: "WCAG 2.1 AA compliance",
      considerations: ["Screen reader compatibility", "High contrast mode", "Keyboard navigation", "Mobile accessibility"]
    },
    patient_facing: {
      design_principles: ["Simple language", "Progressive disclosure", "Visual progress indicators", "Mobile-first"],
      color_psychology: ["Blue for trust", "Green for health", "Avoid red for non-urgent items"]
    },
    provider_facing: {
      design_principles: ["Information density", "Quick access to critical data", "Workflow optimization", "Multi-tasking support"]
    },
    pediatric: {
      design_considerations: ["Large buttons", "Colorful interfaces", "Gamification elements", "Age-appropriate imagery"]
    }
  },

  // Common Healthcare App Types
  app_types: {
    patient_intake: {
      description: "Collects patient information before appointments",
      typical_pages: ["Demographics", "Medical History", "Insurance", "Symptoms"],
      completion_time: "5-15 minutes"
    },
    clinical_assessment: {
      description: "Validated screening tools and questionnaires", 
      features: ["Auto-scoring", "Risk stratification", "Clinical recommendations"],
      completion_time: "10-30 minutes"
    },
    appointment_booking: {
      description: "Schedule appointments with healthcare providers",
      features: ["Provider selection", "Time slot booking", "Telehealth setup"],
      integration: "Calendar systems, video platforms"
    },
    patient_portal: {
      description: "Comprehensive patient dashboard",
      features: ["Lab results", "Messaging", "Appointment history", "Medical records"],
      security: "Multi-factor authentication required"
    },
    symptom_tracker: {
      description: "Monitor symptoms and health metrics over time",
      features: ["Daily logging", "Trend analysis", "Medication correlation"],
      data_viz: "Charts, graphs, trend lines"
    }
  }
};

// Widget Library for Healthcare Applications
export const HEALTHCARE_WIDGETS = {
  "PatientDemographics": {
    description: "Standard patient demographic form with validation",
    fields: ["name", "dob", "gender", "phone", "email", "address"],
    validation: "Real-time validation with healthcare-specific rules",
    healthie_integration: "Maps to Healthie user profile fields"
  },
  "AvatarPicker": {
    description: "Age and culturally appropriate avatar selection",
    props: ["ageGroup", "culturalRepresentation", "accessibility"],
    use_cases: ["Pediatric forms", "Mental health assessments", "Patient engagement"],
    healthie_mapping: "custom_avatar_field"
  },
  "PainMap": {
    description: "Interactive body diagram for pain location and intensity",
    features: ["Drag-and-drop pain markers", "Intensity scaling", "Multiple pain types"],
    medical_coding: "Maps to SNOMED CT body location codes",
    healthie_mapping: "body_location_snomed"
  },
  "AssessmentScale": {
    description: "Validated clinical assessment questionnaires",
    supported_scales: ["PHQ-9", "GAD-7", "Beck-Depression", "Mini-Mental"],
    features: ["Auto-scoring", "Risk flagging", "Clinical interpretation"],
    healthie_mapping: "assessment_scores"
  },
  "MedicationList": {
    description: "Medication tracking with drug interaction checking",
    features: ["Drug name autocomplete", "Dosage validation", "Interaction warnings"],
    data_source: "FDA drug database integration",
    healthie_mapping: "current_medications"
  },
  "InsuranceCapture": {
    description: "Insurance card scanning and verification",
    features: ["Card photo capture", "OCR text extraction", "Real-time verification"],
    compliance: "HIPAA-compliant image handling",
    healthie_mapping: "insurance_information"
  },
  "ConsentForm": {
    description: "Digital consent and signature capture", 
    features: ["Electronic signatures", "Consent versioning", "Audit trails"],
    legal_compliance: "E-SIGN Act compliant",
    healthie_mapping: "consent_documents"
  },
  "AppointmentScheduler": {
    description: "Healthcare appointment booking interface",
    features: ["Provider availability", "Appointment types", "Telehealth options"],
    integrations: ["Calendar systems", "Video platforms", "Reminder systems"],
    healthie_mapping: "appointment_bookings"
  }
};