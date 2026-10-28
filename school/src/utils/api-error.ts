import { UseFormSetError, FieldValues, Path } from "react-hook-form";
import axios from "axios";

export type DrfErrorResponse = {
  non_field_errors?: string[];
  __all__?: string[]; // Added to capture Django clean() exceptions
  detail?: string;
  [key: string]: string[] | string | any;
};

/**
 * Formats and maps Django Rest Framework (DRF) API validation errors directly
 * into React Hook Form and general component states.
 *
 * This handler processes:
 * - Field-specific errors: Mapped directly to the corresponding form field via `setError`.
 * - Non-field/Global errors: Catches DRF `non_field_errors`, custom exception `detail` keys,
 *   and Django standard `__all__` clean method arrays, routing them to `setNonFieldErrors`.
 * - System/Network exceptions: Handles offline errors, timeouts, and native JavaScript errors.
 *
 * @template TFormValues - The TypeScript interface representing the current form's field structure.
 *
 * @param {unknown} error - The caught error object (typically an AxiosError from a catch block).
 * @param {UseFormSetError<TFormValues>} setError - React Hook Form's standard error placement method.
 * @param {(errors: string[]) => void} [setNonFieldErrors] - Optional state setter to capture form-wide/global banner error strings.
 *
 * @returns {void}
 *
 * @example
 * try {
 *   await api.post('/endpoint/', data);
 * } catch (err) {
 *   handleDrfErrors<MyFormInput>(err, setError, setGeneralErrors);
 * }
 */
export const handleDrfErrors = <TFormValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFormValues>,
  setNonFieldErrors?: (errors: string[]) => void,
): void => {
  if (setNonFieldErrors) setNonFieldErrors([]);

  if (axios.isAxiosError(error) && error.response?.data) {
    const drfErrors = error.response.data as DrfErrorResponse;
    const generalErrors: string[] = [];

    Object.entries(drfErrors).forEach(([key, value]) => {
      const message = Array.isArray(value) ? value.join(" ") : String(value);

      // Explicitly check for '__all__' along with other non-field error formats
      if (key === "non_field_errors" || key === "__all__" || key === "detail") {
        generalErrors.push(message);
      } else {
        setError(key as Path<TFormValues>, {
          type: "server",
          message: message,
        });
      }
    });

    if (generalErrors.length > 0 && setNonFieldErrors) {
      setNonFieldErrors(generalErrors);
    }
  } else if (error instanceof Error) {
    if (setNonFieldErrors) setNonFieldErrors([error.message]);
  } else {
    if (setNonFieldErrors) setNonFieldErrors(["An unexpected error occurred."]);
  }
};
