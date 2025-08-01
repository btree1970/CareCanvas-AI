import { gql } from '@apollo/client';

// Healthie GraphQL mutation for creating form answer groups
export const CREATE_FORM_ANSWER_GROUP = gql`
  mutation createFormAnswerGroup($input: createFormAnswerGroupInput) {
    createFormAnswerGroup(input: $input) {
      form_answer_group {
        id
        name
        created_at
        finished
        custom_module_form {
          id
          name
        }
        form_answers {
          id
          answer
          custom_module_id
          label
        }
        user {
          id
          full_name
        }
      }
      messages {
        field
        message
      }
    }
  }
`;

// Query to get custom module forms (for reference)
export const GET_CUSTOM_MODULE_FORMS = gql`
  query getCustomModuleForms {
    customModuleForms {
      id
      name
      created_at
      custom_modules {
        id
        label
        mod_type
        required
        position
      }
    }
  }
`;

// Query to get form answer groups
export const GET_FORM_ANSWER_GROUPS = gql`
  query getFormAnswerGroups($userId: ID) {
    formAnswerGroups(userId: $userId) {
      id
      name
      created_at
      finished
      custom_module_form {
        id
        name
      }
      form_answers {
        id
        answer
        custom_module_id
        label
      }
    }
  }
`;

// Medication management mutations
export const CREATE_MEDICATION = gql`
  mutation createMedication($input: createMedicationInput) {
    createMedication(input: $input) {
      medication {
        id
        name
        dosage
        frequency
        directions
        active
        start_date
        end_date
        created_at
      }
      messages {
        field
        message
      }
    }
  }
`;

export const UPDATE_MEDICATION = gql`
  mutation updateMedication($input: updateMedicationInput) {
    updateMedication(input: $input) {
      medication {
        id
        name
        dosage
        frequency
        directions
        active
        start_date
        end_date
        updated_at
      }
      messages {
        field
        message
      }
    }
  }
`;

// Query to get patient medications
export const GET_MEDICATIONS = gql`
  query getMedications($userId: ID) {
    medications(userId: $userId) {
      id
      name
      dosage
      frequency
      directions
      active
      start_date
      end_date
      created_at
      updated_at
    }
  }
`;