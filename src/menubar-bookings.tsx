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

  // Show count in menu bar if there are bookings
  const title = bookingCount > 0 ? `${bookingCount}` : undefined;

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
