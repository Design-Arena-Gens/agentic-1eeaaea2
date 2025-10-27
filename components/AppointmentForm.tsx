"use client";

import { useMemo, useState } from "react";

import type { AppointmentRequest, AppointmentResponse } from "../lib/types";
import {
  appointmentRequestSchema,
  voiceProfiles
} from "../lib/validators";

export interface FormState {
  submitting: boolean;
  error: string | null;
  result: AppointmentResponse | null;
}

interface AppointmentFormProps {
  onSubmit: (payload: AppointmentRequest) => Promise<void>;
  state: FormState;
}

type FormErrors = Partial<Record<keyof AppointmentRequest, string>>;

const timezoneOptions = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney"
];

const emptyForm: AppointmentRequest = {
  businessName: "",
  phoneNumber: "",
  contactName: "",
  timezone: "America/New_York",
  preferredDate: "",
  preferredTimeWindow: "9am - 12pm",
  reason: "",
  specialInstructions: "",
  voiceProfile: "friendly",
  callBackNumber: "",
  email: ""
};

function buildErrorMap(
  error: FormErrors,
  path: readonly (string | number | symbol)[],
  message: string
) {
  if (!path.length) {
    return error;
  }

  const [rawKey] = path;
  if (typeof rawKey !== "string") {
    return error;
  }

  const key = rawKey as keyof AppointmentRequest;
  return {
    ...error,
    [key]: message
  };
}

const AppointmentForm = ({ onSubmit, state }: AppointmentFormProps) => {
  const [form, setForm] = useState<AppointmentRequest>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});

  const isSubmitDisabled = useMemo(() => {
    if (state.submitting) {
      return true;
    }
    return !form.businessName || !form.phoneNumber || !form.reason;
  }, [form.businessName, form.phoneNumber, form.reason, state.submitting]);

  const handleChange =
    <Key extends keyof AppointmentRequest>(key: Key) =>
    (value: AppointmentRequest[Key]) => {
      setForm((prev) => ({
        ...prev,
        [key]: value ?? ""
      }));
      setErrors((prev) => ({
        ...prev,
        [key]: undefined
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized: AppointmentRequest = {
      ...form,
      contactName: form.contactName?.trim()
        ? form.contactName.trim()
        : undefined,
      specialInstructions: form.specialInstructions?.trim()
        ? form.specialInstructions.trim()
        : undefined,
      callBackNumber: form.callBackNumber?.trim()
        ? form.callBackNumber.trim()
        : undefined,
      email: form.email?.trim() ? form.email.trim() : undefined
    };
    const parsed = appointmentRequestSchema.safeParse(normalized);
    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.reduce<FormErrors>(
        (acc, issue) => buildErrorMap(acc, issue.path, issue.message),
        {}
      );
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await onSubmit(parsed.data);
  };

  const callScript = state.result?.script;
  const callSummary = state.result?.summary;

  return (
    <form className="card form-card" onSubmit={handleSubmit}>
      <h2>Appointment request</h2>
      <div className="form-grid">
        <label className="form-field">
          <span className="label">Business / Clinic name</span>
          <input
            value={form.businessName}
            onChange={(event) => handleChange("businessName")(event.target.value)}
            placeholder="Sunrise Dental Clinic"
            required
          />
          {errors.businessName ? (
            <span className="field-error">{errors.businessName}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span className="label">Phone number to call</span>
          <input
            value={form.phoneNumber}
            onChange={(event) => handleChange("phoneNumber")(event.target.value)}
            placeholder="+1 555 123 4567"
            required
          />
          {errors.phoneNumber ? (
            <span className="field-error">{errors.phoneNumber}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span className="label">Contact person (optional)</span>
          <input
            value={form.contactName ?? ""}
            onChange={(event) => handleChange("contactName")(event.target.value)}
            placeholder="Receptionist or staff member name"
          />
          {errors.contactName ? (
            <span className="field-error">{errors.contactName}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span className="label">Preferred date</span>
          <input
            type="date"
            value={form.preferredDate}
            onChange={(event) => handleChange("preferredDate")(event.target.value)}
            required
          />
          {errors.preferredDate ? (
            <span className="field-error">{errors.preferredDate}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span className="label">Preferred time window</span>
          <input
            value={form.preferredTimeWindow}
            onChange={(event) =>
              handleChange("preferredTimeWindow")(event.target.value)
            }
            placeholder="Anytime after 2pm"
            required
          />
          {errors.preferredTimeWindow ? (
            <span className="field-error">{errors.preferredTimeWindow}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span className="label">Timezone</span>
          <select
            value={form.timezone}
            onChange={(event) => handleChange("timezone")(event.target.value)}
            required
          >
            {timezoneOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          {errors.timezone ? (
            <span className="field-error">{errors.timezone}</span>
          ) : null}
        </label>
        <label className="form-field form-field-wide">
          <span className="label">Purpose of the appointment</span>
          <textarea
            value={form.reason}
            onChange={(event) => handleChange("reason")(event.target.value)}
            placeholder="Schedule a 45 minute consultation about Invisalign treatment."
            rows={3}
            required
          />
          {errors.reason ? (
            <span className="field-error">{errors.reason}</span>
          ) : null}
        </label>
        <label className="form-field form-field-wide">
          <span className="label">Special instructions (optional)</span>
          <textarea
            value={form.specialInstructions ?? ""}
            onChange={(event) =>
              handleChange("specialInstructions")(event.target.value)
            }
            placeholder="Ask if Dr. Smith is available. Mention I can come any time after 2pm."
            rows={3}
          />
          {errors.specialInstructions ? (
            <span className="field-error">{errors.specialInstructions}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span className="label">Voice tone</span>
          <select
            value={form.voiceProfile}
            onChange={(event) =>
              handleChange("voiceProfile")(event.target.value as AppointmentRequest["voiceProfile"])
            }
          >
            {voiceProfiles.map((profile) => (
              <option key={profile} value={profile}>
                {profile.charAt(0).toUpperCase() + profile.slice(1)}
              </option>
            ))}
          </select>
          {errors.voiceProfile ? (
            <span className="field-error">{errors.voiceProfile}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span className="label">Callback number (optional)</span>
          <input
            value={form.callBackNumber ?? ""}
            onChange={(event) =>
              handleChange("callBackNumber")(event.target.value)
            }
            placeholder="+1 555 987 6543"
          />
          {errors.callBackNumber ? (
            <span className="field-error">{errors.callBackNumber}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span className="label">Email for confirmations (optional)</span>
          <input
            type="email"
            value={form.email ?? ""}
            onChange={(event) => handleChange("email")(event.target.value)}
            placeholder="you@example.com"
          />
          {errors.email ? (
            <span className="field-error">{errors.email}</span>
          ) : null}
        </label>
      </div>

      <div className="form-footer">
        <button type="submit" disabled={isSubmitDisabled}>
          {state.submitting ? "Placing call…" : "Call for me"}
        </button>
        {state.error ? <span className="field-error">{state.error}</span> : null}
      </div>

      {callScript ? (
        <section className="form-result">
          <h3>Call script</h3>
          <pre>{callScript}</pre>
        </section>
      ) : null}

      {callSummary ? (
        <section className="form-result">
          <h3>Appointment summary</h3>
          <p>{callSummary}</p>
        </section>
      ) : null}
    </form>
  );
};

export type { AppointmentRequest } from "../lib/types";

export default AppointmentForm;
