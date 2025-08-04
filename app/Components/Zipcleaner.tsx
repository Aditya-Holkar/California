"use client";

import React, { useState } from "react";

interface CityData {
  city: string;
  county: string;
  region: "Northern" | "Southern";
  zipCodes: string[];
}

interface CaliforniaAreas {
  "Incorporated Cities": CityData[];
  "Census-Designated Places (CDP)": CityData[];
}

export default function ZipCleaner() {
  const [updatedJson, setUpdatedJson] = useState<CaliforniaAreas | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json: CaliforniaAreas = JSON.parse(text);
      const cleaned = removeDuplicateZipCodes(json);
      setUpdatedJson(cleaned);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert(
        "Error parsing JSON. Please upload a valid CaliforniaAreas JSON file."
      );
    }
  };

  const removeDuplicateZipCodes = (data: CaliforniaAreas): CaliforniaAreas => {
    const map = new Map<
      string,
      { index: number; source: keyof CaliforniaAreas; zipCodes: Set<string> }
    >();
    const updatedData: CaliforniaAreas = {
      "Incorporated Cities": [...data["Incorporated Cities"]],
      "Census-Designated Places (CDP)": [
        ...data["Census-Designated Places (CDP)"],
      ],
    };

    const process = (list: CityData[], source: keyof CaliforniaAreas) => {
      list.forEach((cityData, index) => {
        const key = `${cityData.city}|${cityData.county}`;
        const currentZips = new Set(cityData.zipCodes);

        if (map.has(key)) {
          const prev = map.get(key)!;
          const overlap = [...currentZips].filter((zip) =>
            prev.zipCodes.has(zip)
          );
          if (overlap.length > 0) {
            updatedData[prev.source][prev.index].zipCodes = updatedData[
              prev.source
            ][prev.index].zipCodes.filter((zip) => !overlap.includes(zip));
          }
        }

        map.set(key, { index, source, zipCodes: currentZips });
      });
    };

    process(updatedData["Incorporated Cities"], "Incorporated Cities");
    process(
      updatedData["Census-Designated Places (CDP)"],
      "Census-Designated Places (CDP)"
    );

    return updatedData;
  };

  const downloadJson = () => {
    if (!updatedJson) return;
    const blob = new Blob([JSON.stringify(updatedJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "updatedCaliforniaAreas.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>California ZIP Cleaner</h2>
      <input type="file" accept=".ts,.json" onChange={handleFileUpload} />
      {updatedJson && (
        <>
          <p>
            ✅ File processed successfully. You can now download the updated
            file.
          </p>
          <button
            onClick={downloadJson}
            style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}
          >
            Download Cleaned JSON
          </button>
        </>
      )}
    </div>
  );
}
