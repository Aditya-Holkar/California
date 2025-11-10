/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import styles from "../../styles/QMEdash.module.css";

type ExcelRow = Record<string, any>;

type SortConfig = {
  key: string;
  direction: "ascending" | "descending";
};

type ZipDashboardProps = {
  onUpload: (data: ExcelRow[]) => void;
  excelData: ExcelRow[];
};

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
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    column: string;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [data, setData] = useState<ExcelRow[]>([]);
  const [newRow, setNewRow] = useState<ExcelRow>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [manualColumns, setManualColumns] = useState<string[]>([]);
  const [originalFileName, setOriginalFileName] = useState<string>("data.xlsx");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local data when excelData changes
  useEffect(() => {
    if (excelData && Array.isArray(excelData) && excelData.length > 0) {
      setData(excelData);
    }
  }, [excelData]);

  // Get all column names
  const columns = useMemo(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      return Object.keys(data[0]);
    }
    // Return manual columns if no data yet
    return manualColumns;
  }, [data, manualColumns]);

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

    // Store the original filename
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    setOriginalFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        if (!fileData) {
          setError("Failed to read file");
          return;
        }

        const workbook = XLSX.read(fileData, { type: "array" });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          setError("No sheets found in the Excel file");
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          setError("Failed to read worksheet");
          return;
        }

        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, {
          defval: "", // Set default value for empty cells
          raw: false, // Format cells as strings
        });

        if (!jsonData || jsonData.length === 0) {
          setError("No data found in the Excel file");
          return;
        }

        // Clear manual columns when uploading data
        setManualColumns([]);
        setData(jsonData);
        onUpload(jsonData);
        setFile(null);
        setError(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        console.error("Upload error:", err);
        setError(
          `Error processing the file: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
    };

    reader.readAsArrayBuffer(file);
  };

  // CRUD Operations
  const handleCellEdit = (rowIndex: number, column: string, value: any) => {
    setEditingCell({ rowIndex, column });
    setEditValue(String(value || ""));
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    const newData = [...data];
    const actualIndex = (currentPage - 1) * rowsPerPage + editingCell.rowIndex;

    if (actualIndex < newData.length) {
      newData[actualIndex][editingCell.column] = editValue;
      setData(newData);
      onUpload(newData);

      // Auto-save to file
      saveToFile(newData);
    }

    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleDeleteRows = () => {
    if (selectedRows.size === 0) return;

    const selectedIndices = Array.from(selectedRows).map(
      (index) => (currentPage - 1) * rowsPerPage + index
    );
    const newData = data.filter((_, index) => !selectedIndices.includes(index));
    setData(newData);
    onUpload(newData);
    setSelectedRows(new Set());
    setCurrentPage(1);

    // Auto-save to file
    saveToFile(newData);
  };

  const handleAddRow = () => {
    if (columns.length === 0) {
      setError("Please add columns first");
      return;
    }

    const rowToAdd: ExcelRow = {};
    columns.forEach((col) => {
      rowToAdd[col] = newRow[col] || "";
    });

    const newData = [...data, rowToAdd];
    setData(newData);
    onUpload(newData);
    setNewRow({});
    setShowAddRow(false);

    // Auto-save to file
    saveToFile(newData);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      setError("Column name cannot be empty");
      return;
    }

    // Check if column already exists
    if (columns.includes(newColumnName.trim())) {
      setError("Column already exists");
      return;
    }

    if (data.length > 0) {
      // Add column to existing data
      const newData = data.map((row) => ({
        ...row,
        [newColumnName.trim()]: "",
      }));
      setData(newData);
      onUpload(newData);

      // Auto-save to file
      saveToFile(newData);
    } else {
      // Add to manual columns when no data exists
      setManualColumns([...manualColumns, newColumnName.trim()]);
    }

    setNewColumnName("");
    setShowAddColumn(false);
    setError(null);
  };

  const handleDeleteColumn = (column: string) => {
    if (!window.confirm(`Are you sure you want to delete column "${column}"?`))
      return;

    if (data.length > 0) {
      const newData = data.map((row) => {
        const newRow = { ...row };
        delete newRow[column];
        return newRow;
      });
      setData(newData);
      onUpload(newData);

      // Auto-save to file
      saveToFile(newData);
    } else {
      // Remove from manual columns
      setManualColumns(manualColumns.filter((col) => col !== column));
    }
  };

  // Sorting functionality
  const requestSort = (key: string) => {
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
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || "",
    }));
    setCurrentPage(1);
  };

  // Get unique values for filter dropdowns
  const getUniqueValues = (key: string) => {
    if (!data || data.length === 0) return [];
    const values = new Set(data.map((item) => item[key]));
    return Array.from(values).filter(Boolean).sort();
  };

  // Process data with sorting and filtering
  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    let filteredData = [...data];

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filteredData = filteredData.filter((item) =>
          String(item[key] || "")
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
  }, [data, filters, sortConfig]);

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

    if (selectedRows.size === paginatedData.length) {
      selectedData = processedData;
    } else {
      selectedData = Array.from(selectedRows).map(
        (index) => processedData[(currentPage - 1) * rowsPerPage + index]
      );
    }

    const ws = XLSX.utils.json_to_sheet(selectedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected Data");
    XLSX.writeFile(
      wb,
      `${originalFileName.replace(".xlsx", "")}_selected.xlsx`
    );
  };

  // Save to file function - automatically saves changes
  const saveToFile = (dataToSave: ExcelRow[]) => {
    if (dataToSave.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(dataToSave);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, originalFileName);
  };

  // Export all data - manual save
  const exportAllData = () => {
    if (data.length === 0) {
      setError("No data to export");
      return;
    }

    saveToFile(data);
  };

  // Get sort indicator
  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h2 className={styles.dashboardTitle}>Data Management Dashboard</h2>
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
            Upload Excel
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.uploadError}>
          {error}
          <button onClick={() => setError(null)} className={styles.closeError}>
            ×
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          onClick={() => setShowAddColumn(true)}
          className={styles.addButton}
        >
          Add Column
        </button>
        <button
          onClick={() => setShowAddRow(true)}
          className={styles.addButton}
          disabled={columns.length === 0}
          title={columns.length === 0 ? "Add columns first" : ""}
        >
          Add Row
        </button>
        <button
          onClick={handleDeleteRows}
          disabled={selectedRows.size === 0}
          className={styles.deleteButton}
        >
          Delete Selected Rows ({selectedRows.size})
        </button>
        <button
          onClick={exportAllData}
          disabled={data.length === 0}
          className={styles.exportButton}
        >
          Save Changes
        </button>
        <button
          onClick={exportSelectedRows}
          disabled={selectedRows.size === 0}
          className={styles.exportButton}
        >
          Export Selected
        </button>
        {Object.keys(filters).length > 0 && (
          <button onClick={clearFilters} className={styles.clearFilterButton}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Add Column Modal */}
      {showAddColumn && (
        <div className={styles.modal} onClick={() => setShowAddColumn(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add New Column</h3>
            <div className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Column Name:</label>
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Enter column name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddColumn();
                    if (e.key === "Escape") {
                      setShowAddColumn(false);
                      setNewColumnName("");
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleAddColumn} className={styles.saveButton}>
                Add Column
              </button>
              <button
                onClick={() => {
                  setShowAddColumn(false);
                  setNewColumnName("");
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Row Modal */}
      {showAddRow && (
        <div className={styles.modal} onClick={() => setShowAddRow(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add New Row</h3>
            <div className={styles.modalForm}>
              {columns.map((col) => (
                <div key={col} className={styles.formGroup}>
                  <label>{col}:</label>
                  <input
                    type="text"
                    value={newRow[col] || ""}
                    onChange={(e) =>
                      setNewRow({ ...newRow, [col]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button onClick={handleAddRow} className={styles.saveButton}>
                Add Row
              </button>
              <button
                onClick={() => {
                  setShowAddRow(false);
                  setNewRow({});
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
              Page {currentPage} of {totalPages || 1} | Total:{" "}
              {processedData.length} rows
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages || totalPages === 0}
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
                    disabled={paginatedData.length === 0}
                  />
                </th>
                {columns.map((key) => (
                  <th key={key}>
                    <div className={styles.columnHeader}>
                      <div className={styles.columnHeaderTop}>
                        <span onClick={() => requestSort(key)}>
                          {key} {getSortIndicator(key)}
                        </span>
                        <button
                          onClick={() => handleDeleteColumn(key)}
                          className={styles.deleteColumnButton}
                          title="Delete column"
                        >
                          ×
                        </button>
                      </div>
                      {data.length > 0 && (
                        <select
                          value={filters[key] || ""}
                          onChange={(e) =>
                            handleFilterChange(key, e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">All</option>
                          {getUniqueValues(key).map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      )}
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
                    {columns.map((col) => (
                      <td
                        key={col}
                        onDoubleClick={() =>
                          handleCellEdit(rowIndex, col, row[col])
                        }
                        className={styles.editableCell}
                      >
                        {editingCell &&
                        editingCell.rowIndex === rowIndex &&
                        editingCell.column === col ? (
                          <div className={styles.cellEditContainer}>
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCellSave();
                                if (e.key === "Escape") handleCellCancel();
                              }}
                              autoFocus
                              className={styles.cellEditInput}
                            />
                            <div className={styles.cellEditButtons}>
                              <button
                                onClick={handleCellSave}
                                className={styles.cellSaveButton}
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCellCancel}
                                className={styles.cellCancelButton}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span title="Double-click to edit">{row[col]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + 1} className={styles.noData}>
                    {columns.length === 0
                      ? "No columns defined. Click 'Add Column' to get started."
                      : "No data available. Click 'Add Row' to add data or upload an Excel file."}
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
