/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie } from "recharts";

type ExcelRow = {
  "ZIP Code": string;
  Office: string;
  "Case Name": string;
  "Case #": string;
  "Case Status": string;
  City: string;
  County: string;
  Region: string;
  "Added On"?: string;
  [key: string]: any; // Allow dynamic properties
};

const FileUpload = ({
  onDataLoaded,
}: {
  onDataLoaded: (data: ExcelRow[]) => void;
}) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
      });
      onDataLoaded(jsonData);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <input
      type="file"
      accept=".xlsx, .xls"
      onChange={handleFileUpload}
      style={{ marginBottom: "20px" }}
    />
  );
};

const DataTable = ({
  data,
  filters,
}: {
  data: ExcelRow[];
  filters: Record<string, string>;
}) => {
  const filteredData = data.filter((row) =>
    Object.entries(filters).every(
      ([key, value]) => !value || row[key] === value
    )
  );

  return (
    <table border={1} cellPadding={5} style={{ marginTop: "20px" }}>
      <thead>
        <tr>
          {Object.keys(data[0] || {}).map((key) => (
            <th key={key}>{key}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {filteredData.map((row, index) => (
          <tr key={index}>
            {Object.values(row).map((cell, i) => (
              <td key={i}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const Dashboard = ({ data }: { data: ExcelRow[] }) => {
  if (!data.length) return null;

  // Get all column names
  const columns = Object.keys(data[0] || {});

  // Count occurrences per column
  const getCounts = (key: string) => {
    const counts: Record<string, number> = {};
    data.forEach((row) => {
      const value = row[key] || "Unknown";
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  };

  return (
    <div>
      <h2>Dashboards</h2>
      {columns.map((col) => {
        const chartData = getCounts(col);

        return (
          <div key={col} style={{ marginBottom: "40px" }}>
            <p style={{ fontWeight: "bold" }}>{col}</p>
            {chartData.length > 10 ? (
              <BarChart width={500} height={300} data={chartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            ) : (
              <PieChart width={400} height={300}>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#82ca9d"
                  label
                />
                <Tooltip />
              </PieChart>
            )}
          </div>
        );
      })}
    </div>
  );
};

const Page = () => {
  const [data, setData] = useState<ExcelRow[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (value) {
        newFilters[key] = value;
      } else {
        delete newFilters[key]; // remove empty filter
      }
      return newFilters;
    });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Excel Dashboard</h1>
      <FileUpload onDataLoaded={setData} />

      {data.length > 0 && (
        <>
          {/* Filter dropdowns */}
          <div style={{ marginBottom: "20px" }}>
            {Object.keys(data[0]).map((key) => {
              const uniqueValues = Array.from(
                new Set(data.map((row) => row[key]))
              );
              return (
                <div key={key} style={{ marginBottom: "10px" }}>
                  <label>{key}: </label>
                  <select
                    onChange={(e) => handleFilterChange(key, e.target.value)}
                  >
                    <option value="">All</option>
                    {uniqueValues.map((val, idx) => (
                      <option key={idx} value={val}>
                        {val}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <DataTable data={data} filters={filters} />

          {/* Dashboards */}
          <Dashboard data={data} />
        </>
      )}
    </div>
  );
};

export default Page;
