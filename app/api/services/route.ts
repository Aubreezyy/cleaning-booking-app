import { NextResponse } from "next/server";
import { getServices } from "@/lib/google-sheets";

export const runtime = "nodejs";

export async function GET() {
  try {
    const services = await getServices();
    services.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
    return NextResponse.json({ services });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
