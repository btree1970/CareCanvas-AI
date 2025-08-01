import { PatientIntakeForm } from "./PatientIntakeForm";
import { RefillTracker } from "./RefillTracker";
// Re-export for external use
export { PatientIntakeForm, RefillTracker };
export { default as PatientIntakeFormDefault } from "./PatientIntakeForm";
export { default as RefillTrackerDefault } from "./RefillTracker";
// Export types
export type { RefillRecord } from "./RefillTracker";
// Widget Registry for LLM Context
export const WIDGET_REGISTRY = {
  PatientIntakeForm: {
    description:
      "Comprehensive patient intake form for primary care offices collecting demographics, medical history, and current symptoms",
    props: {
      onChange: "(data: PatientIntakeData) => void",
      value: "Partial<PatientIntakeData> (optional)",
      className: "string (optional)",
      readOnly: "boolean (optional)",
    },
    use_cases: [
      "Primary care patient registration",
      "New patient intake and onboarding",
      "Comprehensive medical history collection",
      "Insurance and demographic information gathering",
    ],
    clinical_features: [
      "Demographics collection (name, DOB, contact info)",
      "Medical history (allergies, medications, conditions)",
      "Current symptoms assessment",
      "Vital signs documentation",
      "Emergency contact information",
    ],
    healthie_integration:
      "Maps to Healthie patient profile and medical history fields",
    compliance: "HIPAA-compliant data collection and storage",
  },
  RefillTracker: {
    description:
      "Practice-wide medication refill tracker that monitors active prescriptions and flags those approaching or past their expected refill date",
    props: {
      onChange: "(data: RefillRecord[]) => void",
      value: "RefillRecord[] (optional)",
      className: "string (optional)",
      readOnly: "boolean (optional)",
    },
    use_cases: [
      "Medication management and refill tracking",
      "Practice-wide prescription monitoring",
      "Patient medication adherence tracking",
      "Pharmacy coordination and communication",
    ],
    clinical_features: [
      "Real-time refill status monitoring",
      "Color-coded status indicators (overdue, due soon, OK)",
      "Patient medication history tracking",
      "Summary statistics and alerts",
    ],
    healthie_integration:
      "Maps to Healthie medication and prescription management",
    compliance: "HIPAA-compliant medication data handling",
  },
};
// Widget Component Map for Dynamic Loading
export const WIDGET_COMPONENTS = {
  PatientIntakeForm,
  RefillTracker,
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
${Object.entries(info.props)
  .map(([prop, type]) => `- ${prop}: ${type}`)
  .join("\n")}
**Use Cases:**
${info.use_cases.map((useCase) => `- ${useCase}`).join("\n")}
**Healthcare Integration:**
- ${info.healthie_integration}
${"clinical_coding" in info ? `- Clinical Coding: ${info.clinical_coding}` : ""}
${"compliance" in info ? `- Compliance: ${info.compliance}` : ""}
**Accessibility:** ${
        "accessibility" in info
          ? info.accessibility
          : "Standard accessibility features"
      }
`;
    })
    .join("\n---\n");
}
