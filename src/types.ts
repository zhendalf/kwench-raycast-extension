/**
 * Extension preferences from package.json
 */
export interface Preferences {
  apiKey: string;
}

/**
 * Successful response from API key validation
 */
export interface ValidateSuccessResponse {
  valid: true;
  /** User's display name from Optix, null if not linked */
  user: string | null;
  /** Whether user has Optix account (booking features available) */
  hasOptixAccount: boolean;
}

/**
 * Error response from API key validation
 */
export interface ValidateErrorResponse {
  valid: false;
  /** Error code: MISSING_HEADER, INVALID_FORMAT, KEY_NOT_FOUND */
  error: "MISSING_HEADER" | "INVALID_FORMAT" | "KEY_NOT_FOUND";
  /** Human-readable error message */
  message: string;
}

/**
 * Union type for validation response
 */
export type ValidateResponse = ValidateSuccessResponse | ValidateErrorResponse;

/**
 * Request body for KWENCH chat API
 */
export interface ChatRequest {
  message: string;
}

/**
 * Successful response from KWENCH chat API
 */
export interface ChatResponse {
  /** The AI assistant's response (markdown formatted) */
  response: string;
  /** Optional status message when a tool was called */
  toolStatus?: string;
}

/**
 * Error response from KWENCH chat API
 */
export interface ChatErrorResponse {
  error: string;
}

/**
 * Form values for the chat input
 */
export interface ChatFormValues {
  message: string;
}

/**
 * A booking from the KWENCH system
 */
export interface Booking {
  /** Unique booking ID */
  booking_id: string;
  /** Booking title */
  title: string;
  /** Resource name (e.g., "Meeting Room A") */
  resource: string;
  /** Formatted date (e.g., "Today", "Tomorrow", "Tue, Jan 15") */
  date: string;
  /** Formatted time range (e.g., "2:00 PM - 3:00 PM") */
  timeRange: string;
  /** Booking status */
  status: "Approved" | "Pending" | "Rejected";
}

/**
 * Response from bookings API
 */
export interface BookingsResponse {
  bookings: Booking[];
  count: number;
  message?: string;
}
