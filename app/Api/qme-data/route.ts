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

    // Use the URL as-is
    const csvUrl = sheetUrl.includes("output=csv")
      ? sheetUrl
      : `${sheetUrl}${sheetUrl.includes("?") ? "&" : "?"}output=csv`;

    console.log("Fetching from:", csvUrl);

    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvData = await response.text();

    if (csvData.includes("<html") || csvData.trim().length === 0) {
      throw new Error(
        "Invalid response - sheet may not be published correctly"
      );
    }

    const rows = csvData.split("\n").filter((row) => row.trim().length > 0);
    if (rows.length < 2) {
      return NextResponse.json({ data: [], message: "No data found in sheet" });
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

    // Return debug information
    return NextResponse.json({
      data,
      headers, // Send back the actual headers from your sheet
      sampleRow: data[0] || {}, // Send first row for debugging
      message: `Loaded ${data.length} cases successfully`,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export const runtime = "edge";
