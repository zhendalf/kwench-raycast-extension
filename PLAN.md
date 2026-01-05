# KWENCH Raycast AI Extension

## Overview

A Raycast AI Extension that integrates with the KWENCH bot API for workspace management. Users interact via natural language in Raycast AI Chat, Quick AI, or through a traditional list-based command.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Raycast AI Extension                       │
├─────────────────────────────────────────────────────────────┤
│  Preferences                                                 │
│  └── API Key (password field, stored securely)              │
├─────────────────────────────────────────────────────────────┤
│  AI Tools                                                    │
│  └── chat - Send messages to KWENCH bot                     │
├─────────────────────────────────────────────────────────────┤
│  Commands (fallback UI)                                      │
│  └── Ask KWENCH - List-based chat interface                 │
├─────────────────────────────────────────────────────────────┤
│  API Layer                                                   │
│  └── kwench.ts - API client for KWENCH bot                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              KWENCH Bot API                                  │
│  POST https://kwench-bot.ebeloded.workers.dev/api/chat      │
│  Authorization: Bearer kwench_<key>                          │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
kwench/
├── package.json           # Manifest with tools, commands, preferences, AI config
├── src/
│   ├── ask.tsx           # List-based command (fallback UI)
│   ├── api/
│   │   └── kwench.ts     # API client
│   ├── tools/
│   │   └── chat.ts       # AI tool for chat integration
│   └── types.ts          # TypeScript interfaces
└── assets/
    └── extension-icon.png
```

## User Flows

### AI Chat Flow (Primary)
1. User opens Raycast AI Chat
2. Types `@kwench` followed by request
3. Raycast AI invokes the `chat` tool
4. Tool calls KWENCH API with the message
5. Response displayed in AI Chat

### List Command Flow (Fallback)
1. User invokes "Ask KWENCH" command
2. API key validated on launch
3. User types message in search bar
4. Message sent to KWENCH API
5. Response displayed in detail panel
6. Conversation history persisted locally

## API Reference

See `KWENCH_BOT.md` for full API documentation.
