import axios from "axios";

/**
 * Extracts a safe error message string from an unknown error object,
 * cleanly handling AxiosErrors, standard Errors, and fallback strings.
 */
export function handleApiError(
  error: unknown,
  defaultMessage = "Failed to process request. Please try again."
): string {
  if (axios.isAxiosError(error)) {
    // Attempt to extract error string from standard DRF/API response formats
    return error.response?.data?.error || error.response?.data?.message || defaultMessage;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return defaultMessage;
}
