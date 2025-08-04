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