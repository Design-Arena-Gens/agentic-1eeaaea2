"use client";

import { useEffect, useState } from "react";

import AppointmentForm, {
  type AppointmentRequest,
  type FormState
} from "../components/AppointmentForm";
import StatusTimeline, {
  type TimelineEntry
} from "../components/StatusTimeline";

export default function Home() {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([
    {
      id: "init",
      label: "Ready",
      status: "done",
      description: "Provide appointment details to start a call."
    }
  ]);
  const [formState, setFormState] = useState<FormState>({
    submitting: false,
    error: null,
    result: null
  });

  useEffect(() => {
    setTimeline((entries) =>
      entries.length
        ? entries
        : [
            {
              id: "init",
              label: "Ready",
              status: "done",
              description: "Provide appointment details to start a call."
            }
          ]
    );
  }, []);

  const handleSubmit = async (payload: AppointmentRequest) => {
    setFormState({ submitting: true, error: null, result: null });
    setTimeline([
      {
        id: "collecting",
        label: "Collecting details",
        status: "active",
        description: "Crafting call script and preparing the assistant."
      }
    ]);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody?.message ?? "Failed to initiate the appointment call."
        );
      }

      const result = await response.json();
      setFormState({
        submitting: false,
        error: null,
        result
      });
      setTimeline([
        {
          id: "script",
          label: "Script finalized",
          status: "done",
          description:
            result?.script ??
            "Assistant prepared a call script based on your preferences."
        },
        {
          id: "call",
          label: "Call status",
          status: result?.call?.status === "completed" ? "done" : "active",
          description:
            result?.call?.status === "simulated"
              ? "Simulated call created. Configure telephony credentials to enable live calling."
              : `Call ${result?.call?.status ?? "initiated"}.`
        },
        {
          id: "summary",
          label: "Summary",
          status: "pending",
          description:
            result?.summary ??
            "Waiting for the assistant to return the appointment summary."
        }
      ]);
    } catch (error) {
      setFormState({
        submitting: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while submitting your request.",
        result: null
      });
      setTimeline((prev) => [
        {
          id: "collecting",
          label: "Collecting details",
          status: "error",
          description:
            error instanceof Error ? error.message : "Submission failed."
        },
        ...prev.filter((entry) => entry.id !== "collecting")
      ]);
    }
  };

  return (
    <main className="page-root">
      <div className="page-shell">
        <header className="page-header">
          <h1>
            CallSmith <span>AI</span>
          </h1>
          <p>
            Provide the appointment details and our AI assistant will place the
            call, negotiate times, and confirm the booking for you.
          </p>
        </header>
        <section className="page-content">
          <AppointmentForm onSubmit={handleSubmit} state={formState} />
          <StatusTimeline entries={timeline} />
        </section>
      </div>
    </main>
  );
}
