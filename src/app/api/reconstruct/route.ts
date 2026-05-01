/**
 * Room Reconstruction API Route
 * Proxies reconstruction requests to the Python backend.
 * Falls back to a client-side demo if backend is unavailable.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Forward to Python backend
    const response = await fetch(`${BACKEND_URL}/api/reconstruct`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Reconstruction proxy error:", error);

    // If backend is down, return a signal to use client-side demo
    return NextResponse.json(
      {
        error: "Backend unavailable",
        fallback: true,
        message:
          "The AI backend is not running. Use the demo room to explore the 3D walkthrough.",
      },
      { status: 503 }
    );
  }
}
