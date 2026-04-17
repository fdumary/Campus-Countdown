import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { fetchGoogleCalendarEvents } from "../services/googleCalendar";

export function useGoogleCalendar(setEvents) {
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleMessage, setGoogleMessage] = useState({ type: "idle", text: "" });

  const importFromGoogle = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    onSuccess: async (tokenResponse) => {
      setGoogleBusy(true);
      setGoogleMessage({ type: "idle", text: "Importing events..." });
      try {
        const imported = await fetchGoogleCalendarEvents(tokenResponse.access_token);
        setEvents((prev) => [...prev, ...imported]);
        setGoogleMessage({
          type: "success",
          text: `${imported.length} event${imported.length !== 1 ? "s" : ""} imported from Google Calendar.`,
        });
      } catch (e) {
        setGoogleMessage({ type: "error", text: e.message || "Could not import events." });
      } finally {
        setGoogleBusy(false);
      }
    },
    onError: () => setGoogleMessage({ type: "error", text: "Google sign-in failed. Try again." }),
  });

  return { googleBusy, googleMessage, importFromGoogle };
}
