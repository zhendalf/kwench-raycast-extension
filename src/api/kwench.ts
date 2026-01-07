import {
  ChatRequest,
  ChatResponse,
  ChatErrorResponse,
  ValidateResponse,
  ValidateSuccessResponse,
  BookingsResponse,
} from "../types";

const BASE_URL = "https://kwench-bot.ebeloded.workers.dev/api";

/**
 * Custom error class for KWENCH API errors
 */
export class KwenchApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
  ) {
    super(message);
    this.name = "KwenchApiError";
  }
}

/**
 * Validate an API key and get user information
 *
 * @param apiKey - The KWENCH API key to validate
 * @returns User information if valid
 * @throws KwenchApiError if the key is invalid
 */
export async function validateApiKey(apiKey: string): Promise<ValidateSuccessResponse> {
  const response = await fetch(`${BASE_URL}/validate`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = (await response.json()) as ValidateResponse;

  if (!data.valid) {
    throw new KwenchApiError(data.message, 401, data.error);
  }

  return data;
}

/**
 * Send a message to the KWENCH bot
 *
 * @param message - The user's message
 * @param apiKey - The KWENCH API key
 * @returns The bot's response
 * @throws KwenchApiError if the request fails
 */
export async function sendMessage(message: string, apiKey: string): Promise<ChatResponse> {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ message } satisfies ChatRequest),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ChatErrorResponse;
    throw new KwenchApiError(errorData.error || `Request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<ChatResponse>;
}

/**
 * Get user's upcoming bookings
 *
 * @param apiKey - The KWENCH API key
 * @returns List of upcoming bookings
 * @throws KwenchApiError if the request fails
 */
export async function getBookings(apiKey: string): Promise<BookingsResponse> {
  const response = await fetch(`${BASE_URL}/bookings`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ChatErrorResponse;
    throw new KwenchApiError(errorData.error || `Request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<BookingsResponse>;
}

/**
 * Get user-friendly error message based on error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof KwenchApiError) {
    // Handle validation-specific error codes
    if (error.errorCode) {
      switch (error.errorCode) {
        case "MISSING_HEADER":
          return "API key is missing. Please configure it in extension preferences.";
        case "INVALID_FORMAT":
          return "API key format is invalid. It should start with 'kwench_'.";
        case "KEY_NOT_FOUND":
          return "API key not found or has been revoked. Please generate a new one.";
      }
    }

    // Handle HTTP status codes
    switch (error.statusCode) {
      case 400:
        return "Invalid request. Please enter a message.";
      case 401:
        return "Invalid API key. Please check your API key in extension preferences.";
      case 500:
        return "Server error. Please try again later.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}
