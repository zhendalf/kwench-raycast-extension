import {
  ActionPanel,
  Action,
  List,
  Icon,
  LocalStorage,
  getPreferenceValues,
  openExtensionPreferences,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { validateApiKey, sendMessage, getErrorMessage } from "./api/kwench";
import { Preferences, ValidateSuccessResponse } from "./types";

const STORAGE_KEY = "kwench-exchanges";

interface Exchange {
  id: string;
  question: string;
  response: string;
  toolStatus?: string;
  error?: string;
  isLoading: boolean;
}

export default function AskKwench() {
  const [searchText, setSearchText] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [userInfo, setUserInfo] = useState<ValidateSuccessResponse | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const preferences = getPreferenceValues<Preferences>();

  // Load history from LocalStorage
  useEffect(() => {
    LocalStorage.getItem<string>(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored) as Exchange[];
          // Reset loading state for any that were loading when saved
          setExchanges(parsed.map((ex) => ({ ...ex, isLoading: false })));
        }
      })
      .finally(() => setIsLoadingHistory(false));
  }, []);

  // Save exchanges to LocalStorage when they change
  useEffect(() => {
    if (!isLoadingHistory && exchanges.length > 0) {
      LocalStorage.setItem(STORAGE_KEY, JSON.stringify(exchanges));
    }
  }, [exchanges, isLoadingHistory]);

  useEffect(() => {
    if (!preferences.apiKey) {
      setValidationError("no-api-key");
      setIsValidating(false);
      return;
    }

    validateApiKey(preferences.apiKey)
      .then((user) => {
        setUserInfo(user);
        setIsValidating(false);
      })
      .catch((error) => {
        const message = getErrorMessage(error);
        setValidationError(message);
        setIsValidating(false);
      });
  }, [preferences.apiKey]);

  const handleSubmit = useCallback(async () => {
    const message = searchText.trim();
    if (!message) return;

    const id = Date.now().toString();
    const newExchange: Exchange = {
      id,
      question: message,
      response: "",
      isLoading: true,
    };

    setSearchText("");
    setExchanges((prev) => [newExchange, ...prev]);
    setSelectedId(id);

    try {
      const result = await sendMessage(message, preferences.apiKey);
      setExchanges((prev) =>
        prev.map((ex) =>
          ex.id === id ? { ...ex, response: result.response, toolStatus: result.toolStatus, isLoading: false } : ex,
        ),
      );
    } catch (err) {
      setExchanges((prev) =>
        prev.map((ex) => (ex.id === id ? { ...ex, error: getErrorMessage(err), isLoading: false } : ex)),
      );
    }
  }, [searchText, preferences.apiKey]);

  const handleClearHistory = useCallback(async () => {
    setExchanges([]);
    await LocalStorage.removeItem(STORAGE_KEY);
  }, []);

  const isAnyLoading = exchanges.some((ex) => ex.isLoading);
  const greeting = userInfo?.user ? `Hi ${userInfo.user}!` : "Hi there!";

  // No API key - show in empty view
  if (validationError === "no-api-key") {
    return (
      <List>
        <List.EmptyView
          title="API Key Required"
          description="Configure your KWENCH API key in extension preferences. Get it via /apikey in Slack."
          icon={Icon.Key}
          actions={
            <ActionPanel>
              <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  // Invalid API key
  if (validationError) {
    return (
      <List>
        <List.EmptyView
          title="Invalid API Key"
          description={validationError}
          icon={Icon.ExclamationMark}
          actions={
            <ActionPanel>
              <Action title="Open Extension Preferences" onAction={openExtensionPreferences} />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  // No exchanges yet - show welcome
  if (exchanges.length === 0) {
    return (
      <List
        isLoading={isValidating || isLoadingHistory}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        searchBarPlaceholder="Type your message..."
        filtering={false}
      >
        <List.EmptyView
          title={greeting}
          description="How can I help you today? Book rooms, check availability, manage reservations."
          icon={Icon.Message}
          actions={
            <ActionPanel>
              <Action title="Send Message" icon={Icon.Message} onAction={handleSubmit} />
              <Action
                title="Open Extension Preferences"
                icon={Icon.Gear}
                shortcut={{ modifiers: ["cmd"], key: "," }}
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  // Build detail markdown for selected exchange
  const selected = exchanges.find((ex) => ex.id === selectedId) || exchanges[0];
  let markdown = `**You:** ${selected.question}\n\n---\n\n`;
  if (selected.error) {
    markdown += `⚠️ **Error:** ${selected.error}`;
  } else if (selected.response) {
    if (selected.toolStatus) {
      markdown += `> ${selected.toolStatus}\n\n`;
    }
    markdown += selected.response;
  } else {
    markdown += "_Thinking..._";
  }

  return (
    <List
      isLoading={isValidating || isLoadingHistory || isAnyLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Type your message..."
      filtering={false}
      isShowingDetail
      selectedItemId={selectedId || undefined}
      onSelectionChange={setSelectedId}
    >
      {exchanges.map((exchange) => (
        <List.Item
          key={exchange.id}
          id={exchange.id}
          title={exchange.question}
          icon={exchange.isLoading ? Icon.CircleProgress : exchange.error ? Icon.ExclamationMark : Icon.Message}
          detail={
            <List.Item.Detail
              markdown={
                exchange.id === selected.id
                  ? markdown
                  : `**You:** ${exchange.question}\n\n---\n\n${exchange.error ? `⚠️ **Error:** ${exchange.error}` : exchange.response || "_Thinking..._"}`
              }
            />
          }
          actions={
            <ActionPanel>
              <Action title="Send Message" icon={Icon.Message} onAction={handleSubmit} />
              <Action
                title="Clear History"
                icon={Icon.Trash}
                shortcut={{ modifiers: ["cmd", "shift"], key: "backspace" }}
                onAction={handleClearHistory}
              />
              <Action
                title="Open Extension Preferences"
                icon={Icon.Gear}
                shortcut={{ modifiers: ["cmd"], key: "," }}
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
