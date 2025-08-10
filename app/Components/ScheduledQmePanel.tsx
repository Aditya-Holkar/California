/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ViewQmeData.tsx
"use client";

import { QmeRecord } from "../Utils/qme";
import styles from "../styles/Rec.module.css";
import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";

interface ViewQmeDataProps {
  records: QmeRecord[];
}

type ScheduledStatus = "Yes" | "No" | "Cancelled";

interface ExtendedQmeRecord extends QmeRecord {
  scheduled: ScheduledStatus;
  address: string;
  appointmentDate: string;
  appointmentTime: string;
  hoursBeforeArrival: string;
}

const STORAGE_KEY = "qmeRecords";

// Helper function to generate IDs if needed
const generateId = () => Math.random().toString(36).substr(2, 9);

export default function ViewQmeData({
  records: initialRecords,
}: ViewQmeDataProps) {
  const [records, setRecords] = useState<ExtendedQmeRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchColumn, setSearchColumn] = useState<
    keyof ExtendedQmeRecord | "all"
  >("all");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] =
    useState<ExtendedQmeRecord | null>(null);
  const [editData, setEditData] = useState<Partial<ExtendedQmeRecord>>({});
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOption, setImportOption] = useState<"replace" | "merge">(
    "merge"
  );
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelected, setExportSelected] = useState<boolean>(false);

  // Migrate old records to new format
  const migrateRecords = (oldRecords: any[]): ExtendedQmeRecord[] => {
    return oldRecords.map((record) => {
      // Check if this is from the old format (EmailTemplate component)
      const isOldFormat = !("scheduled" in record);

      if (isOldFormat) {
        // Convert from old format to new format
        return {
          id: record.id || generateId(),
          date: record.date,
          caseNumber: record.caseNumber,
          applicantName: record.applicantName,
          doctorName: record.doctorName,
          phoneNumber: record.phoneNumber,
          contactPerson: record.contactPerson,
          contactEmail: record.contactEmail,
          interpreterRequired: record.interpreterRequired || false,
          // New fields with defaults
          scheduled: "No" as ScheduledStatus,
          address: "",
          appointmentDate: "",
          appointmentTime: "",
          hoursBeforeArrival: "1",
        };
      } else {
        // Already in new format, just ensure all fields exist
        return {
          ...record,
          id: record.id || generateId(),
          interpreterRequired: record.interpreterRequired || false,
          scheduled: record.scheduled || "No",
          address: record.address || "",
          appointmentDate: record.appointmentDate || "",
          appointmentTime: record.appointmentTime || "",
          hoursBeforeArrival: record.hoursBeforeArrival || "1",
        };
      }
    });
  };

  // Initialize default records
  const initializeDefaultRecords = () => {
    // First check if there are records from the EmailTemplate component
    const savedRecords = localStorage.getItem(STORAGE_KEY);
    if (savedRecords) {
      try {
        const parsedRecords = JSON.parse(savedRecords);
        if (parsedRecords.length > 0) {
          // Migrate existing records
          const migratedRecords = migrateRecords(parsedRecords);
          setRecords(migratedRecords);
          return;
        }
      } catch (error) {
        console.error("Error parsing saved records:", error);
      }
    }

    // If no existing records, initialize with the provided initialRecords
    const initializedRecords = initialRecords.map((record) => ({
      ...record,
      scheduled: "No" as ScheduledStatus,
      address: "",
      appointmentDate: "",
      appointmentTime: "",
      hoursBeforeArrival: "1",
    }));
    setRecords(initializedRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initializedRecords));
  };

  // Load saved records from localStorage
  useEffect(() => {
    initializeDefaultRecords();
  }, [initialRecords]);

  // Save records to localStorage whenever they change
  useEffect(() => {
    if (records.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  }, [records]);

  // Format time to 12-hour format
  const formatTime = (timeString: string) => {
    if (!timeString) return "";

    const [hours, minutes] = timeString.split(":");
    const hourNum = parseInt(hours, 10);
    const period = hourNum >= 12 ? "PM" : "AM";
    const hour12 = hourNum % 12 || 12;

    return `${hour12}:${minutes} ${period}`;
  };

  // Calculate arrival time based on hours before
  const calculateArrivalTime = (
    appointmentTime: string,
    hoursBefore: string
  ) => {
    if (!appointmentTime || !hoursBefore) return "";

    const [hours, minutes] = appointmentTime.split(":");
    const totalMinutes =
      parseInt(hours) * 60 + parseInt(minutes) - parseFloat(hoursBefore) * 60;

    const arrivalHours = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinutes = totalMinutes % 60;

    return `${String(arrivalHours).padStart(2, "0")}:${String(
      arrivalMinutes
    ).padStart(2, "0")}`;
  };

  // Get unique values for each column for suggestions
  const columnSuggestions = useMemo(() => {
    const suggestions: Record<keyof ExtendedQmeRecord, string[]> = {
      id: [],
      date: Array.from(new Set(records.map((r) => r.date))),
      caseNumber: Array.from(new Set(records.map((r) => r.caseNumber))),
      applicantName: Array.from(new Set(records.map((r) => r.applicantName))),
      doctorName: Array.from(new Set(records.map((r) => r.doctorName))),
      phoneNumber: Array.from(new Set(records.map((r) => r.phoneNumber))),
      contactPerson: Array.from(new Set(records.map((r) => r.contactPerson))),
      contactEmail: Array.from(new Set(records.map((r) => r.contactEmail))),
      interpreterRequired: Array.from(
        new Set(records.map((r) => (r.interpreterRequired ? "Yes" : "No")))
      ),
      scheduled: ["Yes", "No", "Cancelled"],
      address: Array.from(
        new Set(records.map((r) => r.address || "").filter(Boolean))
      ),
      appointmentDate: Array.from(
        new Set(records.map((r) => r.appointmentDate || "").filter(Boolean))
      ),
      appointmentTime: Array.from(
        new Set(records.map((r) => r.appointmentTime || "").filter(Boolean))
      ),
      hoursBeforeArrival: Array.from(
        new Set(records.map((r) => r.hoursBeforeArrival || "").filter(Boolean))
      ),
    };
    return suggestions;
  }, [records]);

  // Filter records based on search term and column
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;

    return records.filter((record) => {
      if (searchColumn === "all") {
        return Object.values(record).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        const value =
          searchColumn === "interpreterRequired"
            ? record[searchColumn]
              ? "Yes"
              : "No"
            : record[searchColumn];
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      }
    });
  }, [records, searchTerm, searchColumn]);

  // Handle record selection
  const handleRecordClick = (record: ExtendedQmeRecord) => {
    setSelectedRecord(record);
    setEditData({
      date: record.date,
      caseNumber: record.caseNumber,
      applicantName: record.applicantName,
      doctorName: record.doctorName,
      phoneNumber: record.phoneNumber,
      contactPerson: record.contactPerson,
      contactEmail: record.contactEmail,
      interpreterRequired: record.interpreterRequired,
      scheduled: record.scheduled,
      address: record.address,
      appointmentDate: record.appointmentDate,
      appointmentTime: record.appointmentTime,
      hoursBeforeArrival: record.hoursBeforeArrival,
    });
    setShowSidePanel(true);
  };

  // Handle edit changes
  const handleEditChange = (field: keyof ExtendedQmeRecord, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [field]: field === "interpreterRequired" ? value === "Yes" : value,
    }));
  };

  // Save edited data
  const handleSave = () => {
    if (!selectedRecord) return;

    const updatedRecords = records.map((record) =>
      record.id === selectedRecord.id ? { ...record, ...editData } : record
    );

    setRecords(updatedRecords);
    setSelectedRecord({ ...selectedRecord, ...editData });
  };

  // Delete record
  // In ViewQmeData's handleDelete:
  const handleDelete = () => {
    if (!selectedRecord) return;

    if (confirm("Are you sure you want to delete this record?")) {
      const updatedRecords = records.filter(
        (record) => record.id !== selectedRecord.id
      );
      setRecords(updatedRecords);
      localStorage.setItem("qmeRecords", JSON.stringify(updatedRecords)); // Explicit save
      setShowSidePanel(false);
      setShowDeleteConfirm(false);

      // Dispatch event to notify other components
      window.dispatchEvent(new Event("storage"));
    }
  };

  // In EmailTemplate:
  useEffect(() => {
    const handleQmeUpdate = () => {
      const records = JSON.parse(localStorage.getItem("qmeRecords") || "[]");
      setRecords(records);
    };

    window.addEventListener("qmeRecordsUpdated", handleQmeUpdate);
    return () =>
      window.removeEventListener("qmeRecordsUpdated", handleQmeUpdate);
  }, [setRecords]);

  // Generate email template
  const generateEmailTemplate = () => {
    if (!selectedRecord) return "";

    const recordToUse = { ...selectedRecord, ...editData };
    const arrivalTime = calculateArrivalTime(
      recordToUse.appointmentTime,
      recordToUse.hoursBeforeArrival
    );

    return `Subject: QME Notice Received for ${
      recordToUse.applicantName
    } - Dr. ${recordToUse.doctorName} – ${recordToUse.appointmentDate}

Dear Daniel,

I hope you're doing well.

Please find attached the QME notice for ${recordToUse.applicantName} with Dr. ${
      recordToUse.doctorName
    }. The appointment has been scheduled with the following details:

Date & Time: ${recordToUse.appointmentDate} at ${formatTime(
      recordToUse.appointmentTime
    )}

Arrival Time: ${formatTime(arrivalTime)} (${
      recordToUse.hoursBeforeArrival
    } hour${parseFloat(recordToUse.hoursBeforeArrival) !== 1 ? "s" : ""} before)

Address: ${recordToUse.address}

I will proceed to update the calendar for this case as per the notice and add Dr. ${
      recordToUse.doctorName
    }'s information in the Parties section.

If you have any questions or need further adjustments, Please let me know.`;
  };

  // Copy email to clipboard
  const copyEmailToClipboard = () => {
    const email = generateEmailTemplate();
    navigator.clipboard.writeText(email);
    alert("Email template copied to clipboard!");
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setShowImportModal(true);
    }
  };

  // Process imported Excel file
  const processImportedFile = () => {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      const importedRecords = jsonData.map((item: any) => {
        // Map Excel columns to our record format
        return {
          id: generateId(),
          date: item["Date"] || "",
          caseNumber: item["Case Number"] || "",
          applicantName: item["Applicant Name"] || "",
          doctorName: item["Doctor Name"] || "",
          phoneNumber: item["Phone Number"] || "",
          contactPerson: item["Contact Person"] || "",
          contactEmail: item["Contact Email"] || "",
          interpreterRequired: item["Interpreter Required"] === "Yes",
          scheduled: (item["Scheduled"] || "No") as ScheduledStatus,
          address: item["Address"] || "",
          appointmentDate: item["Appointment Date"] || "",
          appointmentTime: item["Appointment Time"]
            ? convertTo24Hour(item["Appointment Time"].split(" ")[0])
            : "",
          hoursBeforeArrival: item["Hours Before Arrival"] || "1",
        };
      });

      if (importOption === "replace") {
        setRecords(importedRecords);
      } else {
        // Merge with existing records
        const mergedRecords = [...records, ...importedRecords];
        // Remove duplicates based on case number and applicant name
        const uniqueRecords = mergedRecords.filter(
          (record, index, self) =>
            index ===
            self.findIndex(
              (r) =>
                r.caseNumber === record.caseNumber &&
                r.applicantName === record.applicantName
            )
        );
        setRecords(uniqueRecords);
      }

      setShowImportModal(false);
      setImportFile(null);
    };
    reader.readAsArrayBuffer(importFile);
  };

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (timeStr: string) => {
    if (!timeStr) return "";

    const [time, period] = timeStr.split(" ");
    // eslint-disable-next-line prefer-const
    let [hours, minutes] = time.split(":");

    if (period === "PM" && hours !== "12") {
      hours = String(parseInt(hours, 10) + 12);
    } else if (period === "AM" && hours === "12") {
      hours = "00";
    }

    return `${hours}:${minutes}`;
  };

  // Export to Excel
  const exportToExcel = () => {
    // Determine which records to export
    const recordsToExport =
      exportSelected && selectedRecord ? [selectedRecord] : records;

    // Prepare data with all fields
    const excelData = recordsToExport.map((record) => {
      const arrivalTime = calculateArrivalTime(
        record.appointmentTime,
        record.hoursBeforeArrival
      );
      return {
        Date: record.date,
        "Case Number": record.caseNumber,
        "Applicant Name": record.applicantName,
        "Doctor Name": record.doctorName,
        "Phone Number": record.phoneNumber,
        "Interpreter Required": record.interpreterRequired ? "Yes" : "No",
        "Contact Person": record.contactPerson,
        "Contact Email": record.contactEmail,
        Scheduled: record.scheduled,
        Address: record.address,
        "Appointment Date": record.appointmentDate,
        "Appointment Time": formatTime(record.appointmentTime),
        "Arrival Time": formatTime(arrivalTime),
        "Hours Before Arrival": record.hoursBeforeArrival,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "QME Records");

    // Format Excel headers
    const headerStyle = {
      fill: { fgColor: { rgb: "4472C4" } }, // Blue background
      font: { bold: true, color: { rgb: "FFFFFF" } }, // White bold text
    };

    // Apply header style
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "");
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: C });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = headerStyle;
      }
    }

    // Auto-size columns
    worksheet["!cols"] = Object.keys(excelData[0]).map(() => ({ width: 20 }));

    XLSX.writeFile(workbook, "QME_Records.xlsx");
    setShowExportModal(false);
  };

  // Clear all records
  const clearAllRecords = () => {
    if (confirm("Are you sure you want to clear all records?")) {
      setRecords([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className={styles.dataContainer}>
      <h3>Saved QME Records</h3>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <div className={styles.searchInputContainer}>
            <input
              type="text"
              placeholder={`Search ${
                searchColumn === "all" ? "all columns" : searchColumn
              }`}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (searchColumn !== "all") {
                  const filtered = columnSuggestions[searchColumn].filter(
                    (option) =>
                      option
                        .toLowerCase()
                        .includes(e.target.value.toLowerCase())
                  );
                  setActiveSuggestions(filtered);
                }
              }}
              onFocus={() => setShowSuggestions(searchColumn !== "all")}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={styles.searchInput}
            />
            {showSuggestions && activeSuggestions.length > 0 && (
              <ul className={styles.suggestionsList}>
                {activeSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      setSearchTerm(suggestion);
                      setShowSuggestions(false);
                    }}
                    className={styles.suggestionItems}
                  >
                    {/* {suggestion} */}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.columnSelector}>
            <label>Search in:</label>
            <select
              value={searchColumn}
              onChange={(e) => {
                const column = e.target.value as
                  | keyof ExtendedQmeRecord
                  | "all";
                setSearchColumn(column);
                setSearchTerm("");
                if (column !== "all") {
                  setActiveSuggestions(columnSuggestions[column]);
                }
              }}
              className={styles.columnSelect}
            >
              <option value="all">All Columns</option>
              <option value="date">Date</option>
              <option value="caseNumber">Case #</option>
              <option value="applicantName">Applicant</option>
              <option value="doctorName">Doctor</option>
              <option value="phoneNumber">Phone</option>
              <option value="contactPerson">Contact Person</option>
              <option value="contactEmail">Email</option>
              <option value="interpreterRequired">Interpreter</option>
              <option value="scheduled">Scheduled</option>
              <option value="address">Address</option>
              <option value="appointmentDate">Appointment Date</option>
              <option value="appointmentTime">Appointment Time</option>
            </select>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <label className={styles.importButton}>
            Import Excel
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </label>
          <button
            onClick={() => setShowExportModal(true)}
            className={styles.exportButton}
          >
            Export to Excel
          </button>
          <button onClick={clearAllRecords} className={styles.clearButton}>
            Clear All
          </button>
        </div>
      </div>

      <div className={styles.dataTableContainer}>
        {filteredRecords.length > 0 ? (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Case #</th>
                <th>Applicant</th>
                <th>Doctor</th>
                <th>Phone</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Interpreter</th>
                <th>Scheduled</th>
                <th>Address</th>
                <th>Appt Date</th>
                <th>Appt Time</th>
                <th>Arrival Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => {
                const arrivalTime = calculateArrivalTime(
                  record.appointmentTime,
                  record.hoursBeforeArrival
                );
                return (
                  <tr
                    key={record.id}
                    onClick={() => handleRecordClick(record)}
                    className={styles.clickableRow}
                  >
                    <td>{record.date}</td>
                    <td>{record.caseNumber}</td>
                    <td>{record.applicantName}</td>
                    <td>{record.doctorName}</td>
                    <td>{record.phoneNumber}</td>
                    <td>{record.contactPerson}</td>
                    <td>{record.contactEmail}</td>
                    <td>{record.interpreterRequired ? "Yes" : "No"}</td>
                    <td>{record.scheduled}</td>
                    <td>{record.address}</td>
                    <td>{record.appointmentDate}</td>
                    <td>{formatTime(record.appointmentTime)}</td>
                    <td>
                      {formatTime(arrivalTime)} ({record.hoursBeforeArrival} hr
                      {record.hoursBeforeArrival !== "1" ? "s" : ""})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className={styles.noRecords}>
            {searchTerm ? "No matching records found" : "No records available"}
          </p>
        )}
      </div>

      {/* Side Panel */}
      {showSidePanel && selectedRecord && (
        <div className={styles.sidePanel}>
          <button
            onClick={() => setShowSidePanel(false)}
            className={styles.closeButton}
          >
            ×
          </button>

          <h4>Edit Details for {selectedRecord.applicantName}</h4>

          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label>Date:</label>
              <input
                type="date"
                value={editData.date || ""}
                onChange={(e) => handleEditChange("date", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Case Number:</label>
              <input
                type="text"
                value={editData.caseNumber || ""}
                onChange={(e) => handleEditChange("caseNumber", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Applicant Name:</label>
              <input
                type="text"
                value={editData.applicantName || ""}
                onChange={(e) =>
                  handleEditChange("applicantName", e.target.value)
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Doctor Name:</label>
              <input
                type="text"
                value={editData.doctorName || ""}
                onChange={(e) => handleEditChange("doctorName", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Phone Number:</label>
              <input
                type="text"
                value={editData.phoneNumber || ""}
                onChange={(e) =>
                  handleEditChange("phoneNumber", e.target.value)
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Contact Person:</label>
              <input
                type="text"
                value={editData.contactPerson || ""}
                onChange={(e) =>
                  handleEditChange("contactPerson", e.target.value)
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Contact Email:</label>
              <input
                type="email"
                value={editData.contactEmail || ""}
                onChange={(e) =>
                  handleEditChange("contactEmail", e.target.value)
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Interpreter Required:</label>
              <select
                value={editData.interpreterRequired ? "Yes" : "No"}
                onChange={(e) =>
                  handleEditChange("interpreterRequired", e.target.value)
                }
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Scheduled:</label>
              <select
                value={editData.scheduled || "No"}
                onChange={(e) =>
                  handleEditChange(
                    "scheduled",
                    e.target.value as ScheduledStatus
                  )
                }
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Address:</label>
              <input
                type="text"
                value={editData.address || ""}
                onChange={(e) => handleEditChange("address", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Appointment Date:</label>
              <input
                type="date"
                value={editData.appointmentDate || ""}
                onChange={(e) =>
                  handleEditChange("appointmentDate", e.target.value)
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Appointment Time:</label>
              <input
                type="time"
                value={editData.appointmentTime || ""}
                onChange={(e) =>
                  handleEditChange("appointmentTime", e.target.value)
                }
              />
              <small>
                Display: {formatTime(editData.appointmentTime || "")}
              </small>
            </div>

            <div className={styles.formGroup}>
              <label>Hours Before Arrival:</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={editData.hoursBeforeArrival || "1"}
                onChange={(e) =>
                  handleEditChange("hoursBeforeArrival", e.target.value)
                }
              />
              <small>
                Arrival Time:{" "}
                {formatTime(
                  calculateArrivalTime(
                    editData.appointmentTime || "",
                    editData.hoursBeforeArrival || "1"
                  )
                )}
              </small>
            </div>

            <div className={styles.buttonGroup}>
              <button onClick={handleSave} className={styles.saveButton}>
                Save Changes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.deleteButton}
              >
                Delete Record
              </button>
            </div>
          </div>

          <div className={styles.emailTemplate}>
            <h5>Email Template:</h5>
            <textarea
              readOnly
              value={generateEmailTemplate()}
              className={styles.emailTextarea}
            />
            <button
              onClick={copyEmailToClipboard}
              className={styles.copyButton}
            >
              Copy Email to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmationModal}>
            <h4>Confirm Deletion</h4>
            <p>
              Are you sure you want to delete this record for{" "}
              {selectedRecord?.applicantName}?
            </p>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              {/* In your delete confirmation modal */}
              <button
                onClick={handleDelete}
                className={styles.confirmDeleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.importModal}>
            <h4>Import Excel File</h4>
            <p>Selected file: {importFile?.name}</p>

            <div className={styles.importOptions}>
              <label>
                <input
                  type="radio"
                  name="importOption"
                  value="replace"
                  checked={importOption === "replace"}
                  onChange={() => setImportOption("replace")}
                />
                Replace all existing records
              </label>
              <label>
                <input
                  type="radio"
                  name="importOption"
                  value="merge"
                  checked={importOption === "merge"}
                  onChange={() => setImportOption("merge")}
                />
                Merge with existing records (duplicates will be removed)
              </label>
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={processImportedFile}
                className={styles.confirmButton}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.exportModal}>
            <h4>Export to Excel</h4>

            <div className={styles.exportOptions}>
              <label>
                <input
                  type="radio"
                  name="exportOption"
                  checked={!exportSelected}
                  onChange={() => setExportSelected(false)}
                />
                Export all records
              </label>
              <label>
                <input
                  type="radio"
                  name="exportOption"
                  checked={exportSelected}
                  onChange={() => setExportSelected(true)}
                  disabled={!selectedRecord}
                />
                Export selected record only
                {!selectedRecord && " (No record selected)"}
              </label>
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowExportModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button onClick={exportToExcel} className={styles.confirmButton}>
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
