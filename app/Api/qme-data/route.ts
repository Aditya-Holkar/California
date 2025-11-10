/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/qme-data/route.ts
import { NextResponse } from "next/server";

interface CSVRow {
  [key: string]: string;
}

export async function POST(request: Request) {
  try {
    const { sheetUrl } = await request.json();

    if (!sheetUrl) {
      return NextResponse.json(
        { error: "Sheet URL is required" },
        { status: 400 }
      );
    }

    // Ensure the URL has output=csv parameter
    let csvUrl = sheetUrl;
    if (!csvUrl.includes("output=csv")) {
      csvUrl = sheetUrl.includes("?")
        ? `${sheetUrl}&output=csv`
        : `${sheetUrl}?output=csv`;
    }

    console.log("Fetching from:", csvUrl);

    const response = await fetch(csvUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "text/csv,application/csv",
      },
      // Add timeout for production
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(
        "Sheet response status:",
        response.status,
        response.statusText
      );

      if (response.status === 403) {
        throw new Error(
          "Sheet access forbidden. Please ensure the sheet is published to web: File > Share > Publish to web > CSV format"
        );
      } else if (response.status === 404) {
        throw new Error("Sheet not found. Please check the URL.");
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    const csvData = await response.text();

    // Check if we got HTML instead of CSV (common auth issue)
    if (
      csvData.includes("<html") ||
      csvData.includes("Google Docs") ||
      csvData.trim().startsWith("<!DOCTYPE")
    ) {
      throw new Error(
        'Sheet returned authentication page. Please ensure the sheet is publicly accessible via "Publish to web".'
      );
    }

    // Check if CSV is empty
    if (csvData.trim().length === 0) {
      return NextResponse.json({ data: [], message: "Sheet is empty" });
    }

    const rows = csvData.split("\n").filter((row) => row.trim().length > 0);
    if (rows.length < 2) {
      return NextResponse.json({ data: [], message: "No data rows found" });
    }

    const headers = rows[0]
      .split(",")
      .map((h) => h.trim().replace(/^"|"$/g, ""));
    const data: CSVRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const values = row.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const rowData: CSVRow = {};

      headers.forEach((header, index) => {
        rowData[header] = values[index] || "";
      });

      // Only add row if it has some data
      if (Object.values(rowData).some((val) => val && val.trim() !== "")) {
        data.push(rowData);
      }
    }

    return NextResponse.json(
      {
        data,
        message: `Loaded ${data.length} cases successfully`,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error: any) {
    console.error("API Error:", error);

    let errorMessage = "Failed to fetch sheet data";
    if (error.name === "TimeoutError") {
      errorMessage = "Request timeout - sheet took too long to respond";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        help: "Ensure your Google Sheet is published: File > Share > Publish to web > Entire Document > CSV",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export const runtime = "edge";
