/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/test/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      message: "POST request received!",
      receivedData: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid JSON in request body",
      },
      { status: 400 }
    );
  }
}
