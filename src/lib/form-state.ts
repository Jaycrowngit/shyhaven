/** What a Server Action returns to a form via `useActionState`. */
export interface FormState {
  error?: string;
  fields?: Record<string, string>;
  success?: string;
}

export const initialFormState: FormState = {};
