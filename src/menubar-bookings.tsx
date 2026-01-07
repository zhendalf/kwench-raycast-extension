import {
  MenuBarExtra,
  Icon,
  getPreferenceValues,
  openExtensionPreferences,
  launchCommand,
  LaunchType,
} from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { getBookings, getErrorMessage } from "./api/kwench";
import { Preferences, Booking } from "./types";

function getStatusIcon(status: Booking["status"]): Icon {
  switch (status) {
    case "Approved":
      return Icon.CheckCircle;
    case "Pending":
      return Icon.Clock;
    case "Rejected":
      return Icon.XMarkCircle;
    default:
      return Icon.Calendar;
  }
}

/**
 * Parse a time string like "2:00 PM" into a Date object for today
 */
function parseTimeToday(timeStr: string): Date {
  const now = new Date();
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return now;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const isPM = match[3].toUpperCase() === "PM";

  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;

  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Get menu bar title showing time until next booking or time remaining
 */
function getMenuBarTitle(bookings: Booking[]): string | undefined {
  const now = new Date();
  const todayBookings = bookings.filter((b) => b.date === "Today");

  for (const booking of todayBookings) {
    const [startStr, endStr] = booking.timeRange.split(" - ");
    const startTime = parseTimeToday(startStr);
    const endTime = parseTimeToday(endStr);

    const msUntilStart = startTime.getTime() - now.getTime();
    const msUntilEnd = endTime.getTime() - now.getTime();

    // Currently running: show time left
    if (msUntilStart <= 0 && msUntilEnd > 0) {
      const minutesLeft = Math.ceil(msUntilEnd / 60000);
      if (minutesLeft >= 60) {
        const hours = Math.floor(minutesLeft / 60);
        const mins = minutesLeft % 60;
        return mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
      }
      return `${minutesLeft}m left`;
    }

    // Starting within an hour: show time until start
    if (msUntilStart > 0 && msUntilStart <= 60 * 60 * 1000) {
      const minutesUntil = Math.ceil(msUntilStart / 60000);
      return `in ${minutesUntil}m`;
    }
  }

  return undefined;
}

function groupBookingsByDate(bookings: Booking[]): Map<string, Booking[]> {
  const grouped = new Map<string, Booking[]>();

  for (const booking of bookings) {
    const existing = grouped.get(booking.date) || [];
    grouped.set(booking.date, [...existing, booking]);
  }

  return grouped;
}

export default function MenuBarBookings() {
  const preferences = getPreferenceValues<Preferences>();

  const { data, isLoading, error } = useCachedPromise(
    async (apiKey: string) => {
      const response = await getBookings(apiKey);
      return response.bookings;
    },
    [preferences.apiKey],
    {
      keepPreviousData: true,
    },
  );

  // No API key configured
  if (!preferences.apiKey) {
    return (
      <MenuBarExtra icon={Icon.Calendar} tooltip="KWENCH - API Key Required">
        <MenuBarExtra.Item title="API Key Required" icon={Icon.Key} />
        <MenuBarExtra.Item
          title="Open Extension Preferences"
          icon={Icon.Gear}
          onAction={() => openExtensionPreferences()}
        />
      </MenuBarExtra>
    );
  }

  // Error state
  if (error) {
    const errorMsg = getErrorMessage(error);
    return (
      <MenuBarExtra icon={Icon.Calendar} tooltip="KWENCH - Error">
        <MenuBarExtra.Item title="Error Loading Bookings" icon={Icon.ExclamationMark} />
        <MenuBarExtra.Item title={errorMsg || "Unknown error"} />
        <MenuBarExtra.Separator />
        <MenuBarExtra.Item
          title="Open Extension Preferences"
          icon={Icon.Gear}
          onAction={() => openExtensionPreferences()}
        />
      </MenuBarExtra>
    );
  }

  const bookings = data || [];
  const bookingCount = bookings.length;

  // Show time until next booking or time remaining for current booking
  const title = getMenuBarTitle(bookings);

  // No bookings
  if (bookings.length === 0) {
    return (
      <MenuBarExtra icon={Icon.Calendar} title={title} isLoading={isLoading} tooltip="KWENCH - No Upcoming Bookings">
        <MenuBarExtra.Item title="No Upcoming Bookings" icon={Icon.Calendar} />
        <MenuBarExtra.Separator />
        <MenuBarExtra.Item
          title="Ask KWENCH"
          icon={Icon.Message}
          shortcut={{ modifiers: ["cmd"], key: "n" }}
          onAction={() => launchCommand({ name: "ask", type: LaunchType.UserInitiated })}
        />
      </MenuBarExtra>
    );
  }

  // Group bookings by date
  const groupedBookings = groupBookingsByDate(bookings);

  return (
    <MenuBarExtra
      icon={Icon.Calendar}
      title={title}
      isLoading={isLoading}
      tooltip={`KWENCH - ${bookingCount} Booking${bookingCount !== 1 ? "s" : ""}`}
    >
      {Array.from(groupedBookings.entries()).map(([date, dateBookings]) => (
        <MenuBarExtra.Section key={date} title={date}>
          {dateBookings.map((booking) => (
            <MenuBarExtra.Item
              key={booking.booking_id}
              icon={getStatusIcon(booking.status)}
              title={booking.resource}
              subtitle={booking.timeRange}
              onAction={() => launchCommand({ name: "ask", type: LaunchType.UserInitiated })}
            />
          ))}
        </MenuBarExtra.Section>
      ))}
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title="Ask KWENCH"
        icon={Icon.Message}
        shortcut={{ modifiers: ["cmd"], key: "n" }}
        onAction={() => launchCommand({ name: "ask", type: LaunchType.UserInitiated })}
      />
    </MenuBarExtra>
  );
}
