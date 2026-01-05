Kwench Bot API

  Endpoint

  POST https://kwench-bot.ebeloded.workers.dev/api/chat

  Authentication

  Bearer token authentication using an API key generated via the /apikey Slack command.

  Authorization: Bearer kwench_<key>

  Request

  Content-Type: application/json

  {
    "message": "Book me a meeting room for tomorrow at 2pm"
  }

  | Field   | Type   | Required | Description              |
  | ------- | ------ | -------- | ------------------------ |
  | message | string | Yes      | The user's message/query |

  Response

  Success (200):
  {
    "response": "I've booked Meeting Room A for you tomorrow (January 2nd) from 2:00 PM to 3:00 PM.",
    "toolStatus": "Creating your booking..."
  }

  | Field      | Type   | Description                                                             |
  | ---------- | ------ | ----------------------------------------------------------------------- |
  | response   | string | The AI assistant's response (markdown formatted)                        |
  | toolStatus | string | Optional. Status message when a tool was called (e.g., booking created) |

  Error Responses:

  | Status | Body                                                | Description             |
  | ------ | --------------------------------------------------- | ----------------------- |
  | 400    | {"error": "Missing \"message\" field"}              | Request missing message |
  | 401    | {"error": "Missing Authorization header"}           | No auth header          |
  | 401    | {"error": "Invalid Authorization header format..."} | Malformed header        |
  | 401    | {"error": "API key not found or has been revoked"}  | Invalid/revoked key     |
  | 500    | {"error": "<message>"}                              | Server error            |

  Example (HTTPie)

  http POST https://kwench-bot.ebeloded.workers.dev/api/chat \
    Authorization:"Bearer kwench_ABC123..." \
    message="What meeting rooms are available tomorrow morning?"

  Capabilities

  The bot can:
  - Check availability of meeting rooms, phone booths, resident booths
  - Create bookings with date/time specifications
  - List user's existing bookings
  - Cancel bookings
  - Answer questions about workspace resources

  Notes

  - Conversation history is maintained per-user (24hr TTL)
  - Responses are markdown-formatted (Slack-style)
  - The API key is tied to the user's Slack identity and Optix account
