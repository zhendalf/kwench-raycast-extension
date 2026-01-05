import { getPreferenceValues } from "@raycast/api";
import { sendMessage } from "../api/kwench";
import { Preferences } from "../types";

type Input = {
  /**
   * The message to send to KWENCH bot. Use natural language like "book a meeting room tomorrow at 2pm" or "what rooms are available this afternoon".
   */
  message: string;
};

/**
 * Send a message to the KWENCH bot to manage workspace bookings.
 * KWENCH can book meeting rooms, phone booths, and resident booths,
 * check availability, list your bookings, and cancel reservations.
 */
export default async function tool(input: Input): Promise<string> {
  const preferences = getPreferenceValues<Preferences>();

  if (!preferences.apiKey) {
    return "Error: API key not configured. Please set your KWENCH API key in the extension preferences (get it via /apikey command in Slack).";
  }

  try {
    const result = await sendMessage(input.message, preferences.apiKey);

    let response = result.response;

    if (result.toolStatus) {
      response = `${result.toolStatus}\n\n${response}`;
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return "An unexpected error occurred while communicating with KWENCH.";
  }
}
