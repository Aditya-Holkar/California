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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Scatter,
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

type PieChartType = "office" | "county" | "region" | "caseStatus";
type ChartType =
  | "pie"
  | "bar"
  | "line"
  | "area"
  | "radar"
  | "donut"
  | "composed";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#F9A602",
  "#9F7AEA",
  "#F25F5C",
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
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [fullScreenChart, setFullScreenChart] = useState<{
    isOpen: boolean;
    title: string;
    type: PieChartType;
    data: any[];
  }>({
    isOpen: false,
    title: "",
    type: "office",
    data: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prepare data for charts
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

  const caseStatusData = useMemo(() => {
    const caseStatusCounts = excelData.reduce((acc, row) => {
      acc[row["Case Status"]] = (acc[row["Case Status"]] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(caseStatusCounts).map(([name, value]) => ({
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

  // Handle chart click
  const handleChartClick = (type: PieChartType, value: string) => {
    // If clicking the same segment again, remove the filter
    if (
      activePieFilter &&
      activePieFilter.type === type &&
      activePieFilter.value === value
    ) {
      setActivePieFilter(null);
      setFilters({});
    } else {
      // Set the active filter based on chart type
      setActivePieFilter({ type, value });

      // Set the filter based on the chart type
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
        case "caseStatus":
          filterKey = "Case Status";
          break;
        default:
          return;
      }

      setFilters({ [filterKey]: value });
    }

    // Reset to first page when applying new filter
    setCurrentPage(1);
  };

  // Open chart in full screen
  const openFullScreenChart = (
    title: string,
    type: PieChartType,
    data: any[]
  ) => {
    setFullScreenChart({
      isOpen: true,
      title,
      type,
      data,
    });
  };

  // Close full screen chart
  const closeFullScreenChart = () => {
    setFullScreenChart({
      isOpen: false,
      title: "",
      type: "office",
      data: [],
    });
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
      case "caseStatus":
        return "Case Status";
    }
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
              onClick={() => handleChartClick(type, entry.value)}
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

    // Clear chart filter if user manually changes a filter
    if (
      activePieFilter &&
      key === getFilterKeyFromPieType(activePieFilter.type)
    ) {
      setActivePieFilter(null);
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

  // Handle bar click without payload - use direct data access
  const handleDirectBarClick = (data: any, type: PieChartType) => {
    if (data && data.activeLabel) {
      handleChartClick(type, data.activeLabel);
    }
  };

  // Handle cell click for bar charts
  const handleBarCellClick = (name: string, type: PieChartType) => {
    handleChartClick(type, name);
  };

  // Handle dot click for line/area charts
  const handleDotClick = (data: any, type: PieChartType) => {
    if (data && data.name) {
      handleChartClick(type, data.name);
    }
  };

  // Handle bar click - fixed TypeScript error
  const handleBarClick = (data: any, type: PieChartType) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const value = data.activePayload[0].payload.name;
      handleChartClick(type, value);
    }
  };

  // Render chart based on selected type
  const renderChart = (
    data: any[],
    title: string,
    type: PieChartType,
    isFullScreen = false
  ) => {
    const chartHeight = isFullScreen ? 400 : 450;
    const outerRadius = isFullScreen ? 130 : 70;
    const innerRadius = isFullScreen ? 70 : 40;

    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={outerRadius}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${
                    percent ? (percent * 100).toFixed(0) + "%" : "0%"
                  }`
                }
                onClick={(data) => handleChartClick(type, data.name)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      cursor: "pointer",
                      opacity:
                        activePieFilter &&
                        activePieFilter.type === type &&
                        activePieFilter.value === entry.name
                          ? 1
                          : 0.8,
                      stroke:
                        activePieFilter &&
                        activePieFilter.type === type &&
                        activePieFilter.value === entry.name
                          ? "#000"
                          : "none",
                      strokeWidth: 2,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip />
              {!isFullScreen && (
                <Legend content={(props) => renderCustomLegend(props, type)} />
              )}
            </PieChart>
          </ResponsiveContainer>
        );
      case "donut":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name}: ${
                    percent ? (percent * 100).toFixed(0) + "%" : "0%"
                  }`
                }
                onClick={(data) => handleChartClick(type, data.name)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      cursor: "pointer",
                      opacity:
                        activePieFilter &&
                        activePieFilter.type === type &&
                        activePieFilter.value === entry.name
                          ? 1
                          : 0.8,
                      stroke:
                        activePieFilter &&
                        activePieFilter.type === type &&
                        activePieFilter.value === entry.name
                          ? "#000"
                          : "none",
                      strokeWidth: 2,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip />
              {!isFullScreen && (
                <Legend content={(props) => renderCustomLegend(props, type)} />
              )}
            </PieChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              onClick={(data) => handleBarClick(data, type)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8">
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      cursor: "pointer",
                      opacity:
                        activePieFilter &&
                        activePieFilter.type === type &&
                        activePieFilter.value === entry.name
                          ? 1
                          : 0.8,
                    }}
                  />
                ))}
              </Bar>
              {!isFullScreen && (
                <Legend content={(props) => renderCustomLegend(props, type)} />
              )}
            </BarChart>
          </ResponsiveContainer>
        );
      /*   case "line":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                activeDot={{
                  r: 8,
                  onClick: (_, event) => {
                    if (event && event.payload && event.payload.name) {
                      handleChartClick(type, event.payload.name);
                    }
                  },
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                activeDot={{
                  r: 8,
                  onClick: (_, event) => {
                    if (event && event.payload && event.payload.name) {
                      handleChartClick(type, event.payload.name);
                    }
                  },
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "radar":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <RadarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Tooltip />
              <Legend />
              <Radar
                name="Value"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                onClick={(data) => handleChartClick(type, data.name)}
              />
            </RadarChart>
          </ResponsiveContainer>
        );
      case "composed":
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="value"
                fill="#8884d8"
                onClick={(data) => handleBarClick(data, type)}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      cursor: "pointer",
                      opacity:
                        activePieFilter &&
                        activePieFilter.type === type &&
                        activePieFilter.value === entry.name
                          ? 1
                          : 0.8,
                    }}
                  />
                ))}
              </Bar>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ff7300"
                activeDot={{
                  r: 8,
                  onClick: (_, event) => {
                    if (event && event.payload && event.payload.name) {
                      handleChartClick(type, event.payload.name);
                    }
                  },
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        );*/
      default:
        return null;
    }
  };

  // Full screen chart modal
  const FullScreenChartModal = () => {
    if (!fullScreenChart.isOpen) return null;

    return (
      <div className={styles.fullScreenModal}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>{fullScreenChart.title}</h2>
            <button
              className={styles.closeButton}
              onClick={closeFullScreenChart}
            >
              ×
            </button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.modalChart}>
              {renderChart(
                fullScreenChart.data,
                fullScreenChart.title,
                fullScreenChart.type,
                true
              )}
            </div>
            <div className={styles.modalLegend}>
              <h3 className={styles.legendTitle}>Legend</h3>
              {renderCustomLegend(
                {
                  payload: fullScreenChart.data.map((item, index) => ({
                    value: item.name,
                    color: COLORS[index % COLORS.length],
                    payload: item,
                  })),
                },
                fullScreenChart.type
              )}
            </div>
          </div>
        </div>
      </div>
    );
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

      {/* Chart Type Toggle */}
      <div className={styles.chartTypeToggle}>
        <label>Chart Type: </label>
        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as ChartType)}
        >
          <option value="pie">Pie Chart</option>
          <option value="donut">Donut Chart</option>
          <option value="bar">Bar Chart</option>
          {/* <option value="line">Line Chart</option>
          <option value="area">Area Chart</option>
          <option value="radar">Radar Chart</option>
          <option value="composed">Composed Chart</option> */}
        </select>
      </div>

      {/* Visualization Section */}
      <div className={styles.visualizationSection}>
        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h3>Office Distribution</h3>
            <button
              className={styles.fullScreenButton}
              onClick={() =>
                openFullScreenChart("Office Distribution", "office", officeData)
              }
            >
              Open Full Screen
            </button>
          </div>
          {renderChart(officeData, "Office Distribution", "office")}
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h3>Counties Distribution</h3>
            <button
              className={styles.fullScreenButton}
              onClick={() =>
                openFullScreenChart(
                  "Counties Distribution",
                  "county",
                  countyData
                )
              }
            >
              Open Full Screen
            </button>
          </div>
          {renderChart(countyData, "Counties Distribution", "county")}
        </div>

        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h3>Regions Distribution</h3>
            <button
              className={styles.fullScreenButton}
              onClick={() =>
                openFullScreenChart(
                  "Regions Distribution",
                  "region",
                  regionData
                )
              }
            >
              Open Full Screen
            </button>
          </div>
          {renderChart(regionData, "Regions Distribution", "region")}
        </div>

        {/* Case Status Distribution Chart */}
        <div className={styles.chartContainer}>
          <div className={styles.chartHeader}>
            <h3>Case Status Distribution</h3>
            <button
              className={styles.fullScreenButton}
              onClick={() =>
                openFullScreenChart(
                  "Case Status Distribution",
                  "caseStatus",
                  caseStatusData
                )
              }
            >
              Open Full Screen
            </button>
          </div>
          {renderChart(
            caseStatusData,
            "Case Status Distribution",
            "caseStatus"
          )}
        </div>
      </div>

      {/* Full Screen Chart Modal */}
      <FullScreenChartModal />

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
