import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

async function proxy(request: NextRequest, params: { path?: string[] }) {
  const pathParts = params.path ?? [];
  const backendPath = pathParts.join("/");

  if (!backendPath) {
    return NextResponse.json(
      { error: "Missing backend path. Use /api/python/<endpoint>." },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const query = url.search || "";
  const target = `${BACKEND_URL}/api/${backendPath}${query}`;

  try {
    const headers = new Headers();
    const contentType = request.headers.get("content-type");

    if (contentType) {
      headers.set("content-type", contentType);
    }

    const init: RequestInit = {
      method: request.method,
      headers,
      cache: "no-store",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const response = await fetch(target, init);
    const responseText = await response.text();

    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType);
    }

    return new NextResponse(responseText, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Python API proxy error:", error);
    return NextResponse.json(
      { error: "Python backend unavailable" },
      { status: 503 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxy(request, params);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxy(request, params);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxy(request, params);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxy(request, params);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  return proxy(request, params);
}
