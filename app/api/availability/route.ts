import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";
import { getService } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("service_id");

  if (!date || !serviceId) {
    return NextResponse.json(
      { error: "date and service_id are required" },
      { status: 400 }
    );
  }

  try {
    const service = await getService(serviceId);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }
    const slots = await getAvailableSlots(date, service.duration_minutes);
    return NextResponse.json({ slots });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
