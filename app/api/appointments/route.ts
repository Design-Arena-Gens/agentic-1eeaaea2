import { NextResponse } from "next/server";

import { generateCallPlan } from "../../../lib/ai";
import {
  initiateCall,
  summarizeCallOutcome
} from "../../../lib/call-provider";
import type { AppointmentResponse } from "../../../lib/types";
import {
  sanitizeAppointmentPayload,
  validateAppointmentRequest
} from "../../../lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sanitized = sanitizeAppointmentPayload(
      typeof body === "object" && body !== null ? body : {}
    );
    const parsed = validateAppointmentRequest(sanitized);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message ?? "Invalid request payload."
        },
        { status: 400 }
      );
    }

    const appointment = parsed.data;
    const callPlan = await generateCallPlan(appointment);
    const call = await initiateCall({
      to: appointment.phoneNumber,
      script: callPlan.script,
      voiceProfile: appointment.voiceProfile,
      callbackNumber: appointment.callBackNumber
    });

    const responsePayload: AppointmentResponse = {
      script: callPlan.script,
      call,
      summary:
        callPlan.summary ?? summarizeCallOutcome(appointment, callPlan.script),
      itinerary: callPlan.itinerary,
      metadata: {
        businessName: appointment.businessName,
        requestTimestamp: new Date().toISOString()
      }
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error("[appointments] failed request", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to process appointment request."
      },
      { status: 500 }
    );
  }
}
