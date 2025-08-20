/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "../styles/Zip.module.css";

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
};

type SortConfig = {
  key: keyof ExcelRow;
  direction: "ascending" | "descending";
};

type ZipDashboardProps = {
  onUpload: (data: ExcelRow[]) => void;
  excelData: ExcelRow[];
};

type PieChartType = "office" | "county" | "region";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export default function ZipDashboard({
  onUpload,
  excelData,
}: ZipDashboardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState<Partial<ExcelRow>>({});
  const [activePieFilter, setActivePieFilter] = useState<{
    type: PieChartType;
    value: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prepare data for pie charts
  const officeData = useMemo(() => {
    const officeCounts = excelData.reduce((acc, row) => {
      acc[row.Office] = (acc[row.Office] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(officeCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [excelData]);

  const countyData = useMemo(() => {
    const countyCounts = excelData.reduce((acc, row) => {
      acc[row.County] = (acc[row.County] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(countyCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [excelData]);

  const regionData = useMemo(() => {
    const regionCounts = excelData.reduce((acc, row) => {
      acc[row.Region] = (acc[row.Region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(regionCounts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [excelData]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (data) {
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

          // Validate the data structure
          if (jsonData.length > 0) {
            const firstRow = jsonData[0];
            const requiredFields = ["ZIP Code", "City", "County", "Region"];

            const isValid = requiredFields.every((field) =>
              Object.keys(firstRow).includes(field)
            );

            if (!isValid) {
              setError("Uploaded file doesn't match the required format");
              return;
            }
          }

          onUpload(jsonData);
          setFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } catch (err) {
        setError("Error processing the file. Please check the format.");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle pie chart click
  const handlePieClick = (type: PieChartType, value: string) => {
    // If clicking the same segment again, remove the filter
    if (
      activePieFilter &&
      activePieFilter.type === type &&
      activePieFilter.value === value
    ) {
      setActivePieFilter(null);
      setFilters({});
    } else {
      // Set the active filter based on pie chart type
      setActivePieFilter({ type, value });

      // Set the filter based on the pie chart type
      let filterKey: keyof ExcelRow;
      switch (type) {
        case "office":
          filterKey = "Office";
          break;
        case "county":
          filterKey = "County";
          break;
        case "region":
          filterKey = "Region";
          break;
        default:
          return;
      }

      setFilters({ [filterKey]: value });
    }

    // Reset to first page when applying new filter
    setCurrentPage(1);
  };

  // Handle legend click
  const handleLegendClick = (type: PieChartType) => (e: any) => {
    // Extract the value from the clicked legend item
    const value = e.value;
    handlePieClick(type, value);
  };

  // Custom legend component with click handlers
  const renderCustomLegend = (props: any, type: PieChartType) => {
    const { payload } = props;

    return (
      <div className={styles.customLegend}>
        {payload.map((entry: any, index: number) => {
          const isActive =
            activePieFilter &&
            activePieFilter.type === type &&
            activePieFilter.value === entry.value;

          return (
            <div
              key={`legend-${index}`}
              className={`${styles.legendItem} ${
                isActive ? styles.activeLegend : ""
              }`}
              onClick={() => handlePieClick(type, entry.value)}
              style={{ color: entry.color }}
            >
              <div
                className={styles.legendColorBox}
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.value}</span>
              <span className={styles.legendCount}>
                {" "}
                ({entry.payload.value})
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Sorting functionality
  const requestSort = (key: keyof ExcelRow) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Filtering functionality
  const handleFilterChange = (key: keyof ExcelRow, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }));
    setCurrentPage(1);

    // Clear pie filter if user manually changes a filter
    if (
      activePieFilter &&
      key === getFilterKeyFromPieType(activePieFilter.type)
    ) {
      setActivePieFilter(null);
    }
  };

  // Helper function to get filter key from pie type
  const getFilterKeyFromPieType = (type: PieChartType): keyof ExcelRow => {
    switch (type) {
      case "office":
        return "Office";
      case "county":
        return "County";
      case "region":
        return "Region";
    }
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (key: keyof ExcelRow) => {
    const values = new Set(excelData.map((item) => item[key]));
    return Array.from(values).filter(Boolean).sort();
  };

  // Process data with sorting and filtering
  const processedData = useMemo(() => {
    let filteredData = [...excelData];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filteredData = filteredData.filter((item) =>
          String(item[key as keyof ExcelRow])
            .toLowerCase()
            .includes(value.toLowerCase())
        );
      }
    });

    // Apply sorting
    if (sortConfig) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [excelData, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / rowsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Row selection
  const toggleRowSelection = (index: number) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(index)) {
      newSelectedRows.delete(index);
    } else {
      newSelectedRows.add(index);
    }
    setSelectedRows(newSelectedRows);
  };

  const selectAllRows = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      const newSelectedRows = new Set(
        Array.from({ length: paginatedData.length }, (_, i) => i)
      );
      setSelectedRows(newSelectedRows);
    }
  };

  // Export selected rows
  const exportSelectedRows = () => {
    if (selectedRows.size === 0) return;

    let selectedData = [];

    // Check if all rows on the current page are selected
    if (selectedRows.size === paginatedData.length) {
      // If all rows on page are selected, export all filtered data
      selectedData = processedData;
    } else {
      // Export only the specifically selected rows
      selectedData = Array.from(selectedRows).map(
        (index) => processedData[(currentPage - 1) * rowsPerPage + index]
      );
    }

    const ws = XLSX.utils.json_to_sheet(selectedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected Data");
    XLSX.writeFile(wb, "selected_rows.xlsx");
  };

  // Get sort indicator
  const getSortIndicator = (key: keyof ExcelRow) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setActivePieFilter(null);
    setCurrentPage(1);
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h2 className={styles.dashboardTitle}>ZIP Code Data Dashboard</h2>
        <div className={styles.actions}>
          <input
            id="file-upload"
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className={styles.fileInput}
            ref={fileInputRef}
          />
          <button
            onClick={handleUpload}
            disabled={!file}
            className={styles.uploadButton}
          >
            Upload
          </button>
        </div>
      </div>

      {error && <p className={styles.uploadError}>{error}</p>}

      {/* Active Filter Display */}
      {activePieFilter && (
        <div className={styles.activeFilter}>
          <span>
            Showing data for {activePieFilter.type}: {activePieFilter.value}
          </span>
          <button onClick={clearFilters} className={styles.clearFilterButton}>
            Clear Filter
          </button>
        </div>
      )}

      {/* Visualization Section */}
      <div className={styles.visualizationSection}>
        <div className={styles.chartContainer}>
          <h3>Office Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={officeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${
                    percent ? (percent * 100).toFixed(0) + "%" : "0%"
                  }`
                }
                onClick={(data) => handlePieClick("office", data.name)}
              >
                {officeData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      cursor: "pointer",
                      opacity:
                        activePieFilter &&
                        activePieFilter.type === "office" &&
                        activePieFilter.value === entry.name
                          ? 1
                          : 0.8,
                      stroke:
                        activePieFilter &&
                        activePieFilter.type === "office" &&
                        activePieFilter.value === entry.name
                          ? "#000"
                          : "none",
                      strokeWidth: 2,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                content={(props) => renderCustomLegend(props, "office")}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartContainer}>
          <h3>Counties Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={countyData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${
                    percent ? (percent * 100).toFixed(0) + "%" : "0%"
                  }`
                }
                onClick={(data) => handlePieClick("county", data.name)}
              >
                {countyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      cursor: "pointer",
                      opacity:
                        activePieFilter &&
                        activePieFilter.type === "county" &&
                        activePieFilter.value === entry.name
                          ? 1
                          : 0.8,
                      stroke:
                        activePieFilter &&
                        activePieFilter.type === "county" &&
                        activePieFilter.value === entry.name
                          ? "#000"
                          : "none",
                      strokeWidth: 2,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                content={(props) => renderCustomLegend(props, "county")}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartContainer}>
          <h3>Regions Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={regionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${
                    percent ? (percent * 100).toFixed(0) + "%" : "0%"
                  }`
                }
                onClick={(data) => handlePieClick("region", data.name)}
              >
                {regionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      cursor: "pointer",
                      opacity:
                        activePieFilter &&
                        activePieFilter.type === "region" &&
                        activePieFilter.value === entry.name
                          ? 1
                          : 0.8,
                      stroke:
                        activePieFilter &&
                        activePieFilter.type === "region" &&
                        activePieFilter.value === entry.name
                          ? "#000"
                          : "none",
                      strokeWidth: 2,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                content={(props) => renderCustomLegend(props, "region")}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table Section */}
      <div className={styles.tableSection}>
        <div className={styles.tableControls}>
          <div className={styles.paginationControls}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages} | Total: {processedData.length}{" "}
              rows
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
          <div className={styles.rowsPerPage}>
            <label>
              Rows per page:
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                {[5, 10, 25, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={exportSelectedRows}
              disabled={selectedRows.size === 0}
              className={styles.exportButton}
            >
              Export Selected
            </button>
            {(Object.keys(filters).length > 0 || activePieFilter) && (
              <button
                onClick={clearFilters}
                className={styles.clearFilterButton}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.size === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    onChange={selectAllRows}
                  />
                </th>
                {Object.keys(paginatedData[0] || {}).map((key) => (
                  <th key={key}>
                    <div className={styles.columnHeader}>
                      <span onClick={() => requestSort(key as keyof ExcelRow)}>
                        {key} {getSortIndicator(key as keyof ExcelRow)}
                      </span>
                      <select
                        value={filters[key as keyof ExcelRow] || ""}
                        onChange={(e) =>
                          handleFilterChange(
                            key as keyof ExcelRow,
                            e.target.value
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">All</option>
                        {getUniqueValues(key as keyof ExcelRow).map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => toggleRowSelection(rowIndex)}
                      />
                    </td>
                    {Object.values(row).map((value, colIndex) => (
                      <td key={colIndex}>{value}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={Object.keys(paginatedData[0] || {}).length + 1}
                    className={styles.noData}
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
