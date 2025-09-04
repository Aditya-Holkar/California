/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import styles from "../../styles/ZipDashboard.module.css";

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
  [key: string]: any;
};

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];

const ROWS_PER_PAGE = 5;

const ZipDashboard = () => {
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [fullScreenChart, setFullScreenChart] = useState<{
    title: string;
    type: string;
    data: { name: string; value: number }[];
  } | null>(null);

  // Upload Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
      });
      setExcelData(jsonData);
      setSelectedRows(new Set());
      setCurrentPage(1);
    };
    reader.readAsArrayBuffer(file);
  };

  // Filtering
  const filteredData = excelData.filter((row) =>
    Object.entries(filters).every(
      ([key, value]) =>
        !value || String(row[key]).toLowerCase().includes(value.toLowerCase())
    )
  );

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
    if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  // Count values for chart
  const getCounts = (key: keyof ExcelRow) => {
    const counts: Record<string, number> = {};
    excelData.forEach((row) => {
      const value = row[key] || "Unknown";
      counts[value] = (counts[value] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // Render charts
  const renderChart = (
    data: { name: string; value: number }[],
    type: string
  ) => {
    switch (type) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case "donut":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                label
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  // Row selection
  const toggleRowSelection = (index: number) => {
    const actualIndex = (currentPage - 1) * ROWS_PER_PAGE + index;
    const newSet = new Set(selectedRows);
    if (newSet.has(actualIndex)) newSet.delete(actualIndex);
    else newSet.add(actualIndex);
    setSelectedRows(newSet);
  };

  const toggleSelectAll = () => {
    const pageIndexes = paginatedData.map(
      (_, i) => (currentPage - 1) * ROWS_PER_PAGE + i
    );
    const allSelected = pageIndexes.every((i) => selectedRows.has(i));

    const newSet = new Set(selectedRows);
    if (allSelected) pageIndexes.forEach((i) => newSet.delete(i));
    else pageIndexes.forEach((i) => newSet.add(i));
    setSelectedRows(newSet);
  };

  // Export selected rows
  const exportSelectedRows = () => {
    if (selectedRows.size === 0) return;
    const selectedData = sortedData.filter((_, i) => selectedRows.has(i));
    const ws = XLSX.utils.json_to_sheet(selectedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected Data");
    XLSX.writeFile(wb, "selected_rows.xlsx");
  };

  // Sorting handler
  const handleSort = (key: string) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>ZIP Code Dashboard</h1>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className={styles.uploadInput}
      />

      {excelData.length > 0 && (
        <>
          {/* Filters */}
          <div className={styles.filters}>
            {Object.keys(excelData[0]).map((key) => {
              const uniqueValues = Array.from(
                new Set(excelData.map((row) => row[key]))
              );
              return (
                <div key={key} className={styles.filterGroup}>
                  <label>{key}: </label>
                  <select
                    onChange={(e) =>
                      setFilters({ ...filters, [key]: e.target.value })
                    }
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

          {/* Export Button */}
          <button
            className={styles.exportButton}
            onClick={exportSelectedRows}
            disabled={selectedRows.size === 0}
          >
            Export Selected Rows
          </button>

          {/* Data Table */}
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={paginatedData.every((_, i) =>
                      selectedRows.has((currentPage - 1) * ROWS_PER_PAGE + i)
                    )}
                    onChange={toggleSelectAll}
                  />
                </th>
                {Object.keys(excelData[0]).map((key) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    style={{ cursor: "pointer" }}
                  >
                    {key}{" "}
                    {sortConfig?.key === key
                      ? sortConfig.direction === "asc"
                        ? "↑"
                        : "↓"
                      : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => {
                const actualIndex = (currentPage - 1) * ROWS_PER_PAGE + idx;
                return (
                  <tr key={actualIndex}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(actualIndex)}
                        onChange={() => toggleRowSelection(idx)}
                      />
                    </td>
                    {Object.values(row).map((cell, i) => (
                      <td key={i}>{cell}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>

          {/* Dashboards */}
          <div className={styles.visualizationSection}>
            {Object.keys(excelData[0]).map((col) => {
              const chartData = getCounts(col as keyof ExcelRow);
              return (
                <div key={col} className={styles.chartContainer}>
                  <div className={styles.chartHeader}>
                    <h3>{col} Distribution</h3>
                    <select
                      onChange={(e) =>
                        setFullScreenChart({
                          title: `${col} Distribution`,
                          type: e.target.value,
                          data: chartData,
                        })
                      }
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Select Chart
                      </option>
                      <option value="pie">Pie</option>
                      <option value="donut">Donut</option>
                      <option value="bar">Bar</option>
                      <option value="line">Line</option>
                    </select>
                  </div>
                  {renderChart(chartData, "pie")}
                </div>
              );
            })}
          </div>

          {/* Full Screen Modal */}
          {fullScreenChart && (
            <div className={styles.fullScreenOverlay}>
              <div className={styles.fullScreenContent}>
                <h2>{fullScreenChart.title}</h2>
                {renderChart(fullScreenChart.data, fullScreenChart.type)}
                <button
                  className={styles.closeButton}
                  onClick={() => setFullScreenChart(null)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ZipDashboard;
