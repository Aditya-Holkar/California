import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Declare the response variable properly
    const fetchResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
    });

    if (!fetchResponse.ok) {
      throw new Error(`HTTP error! status: ${fetchResponse.status}`);
    }

    const html = await fetchResponse.text();

    // Convert headers to a plain object
    const headersObject: Record<string, string> = {};
    fetchResponse.headers.forEach((value, key) => {
      headersObject[key] = value;
    });

    return new Response(
      JSON.stringify({
        html,
        headers: headersObject,
        status: fetchResponse.status,
        finalUrl: fetchResponse.url,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching URL:", error);
    return NextResponse.json(
      {
        error: "Error fetching URL",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
