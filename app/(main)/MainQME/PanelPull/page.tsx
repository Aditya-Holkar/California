/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import styles from "../../../styles/PanelPull.module.css";
import * as XLSX from "xlsx";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { ExtendedQmeRecord, ScheduledStatus } from "../../../Utils/qme";
import { useRouter } from "next/navigation";

interface PanelPullRecord {
  id: string;
  caseNumber: string;
  name: string;
  specialty: string;
  doctor1: string;
  doctor2: string;
  doctor3: string;
  panelPullDate: string;
}

const QME_STORAGE_KEY = "qmeRecords";

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function PanelPullPage() {
  // Use the same storage key as QME records
  const [qmeRecords, setQmeRecords] = useLocalStorage<ExtendedQmeRecord[]>(
    QME_STORAGE_KEY,
    []
  );

  const router = useRouter();

  const navigateToQmeScheduling = (record: ExtendedQmeRecord) => {
    // Check if there are any doctors available
    const availableDoctors = [
      record.doctor1,
      record.doctor2,
      record.doctor3,
    ].filter((doctor) => doctor && doctor.trim() !== "");

    if (availableDoctors.length === 0) {
      alert("No doctors available for this case. Please add doctors first.");
      return;
    }

    // Pass only the identifier - QME page will load the data
    const navigationData = {
      caseId: record.id,
      caseNumber: record.caseNumber,
      source: "panelPull", // To indicate where this navigation came from
    };

    // Store the data in localStorage for the QME page to access
    localStorage.setItem("qmeNavigationData", JSON.stringify(navigationData));

    // Navigate to QME page
    router.push("/MainQME/PanelStrike");
  };

  const [formData, setFormData] = useState<Omit<PanelPullRecord, "id">>({
    caseNumber: "",
    name: "",
    specialty: "",
    doctor1: "",
    doctor2: "",
    doctor3: "",
    panelPullDate: new Date().toISOString().split("T")[0],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] =
    useState<ExtendedQmeRecord | null>(null);
  const [editData, setEditData] = useState<Partial<ExtendedQmeRecord>>({});
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelected, setExportSelected] = useState(false);
  const [showImportToQmeModal, setShowImportToQmeModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");

  // Filter records to show only those with panel pull data
  const panelPullRecords = useMemo(
    () =>
      qmeRecords.filter(
        (record) =>
          record.specialty ||
          record.doctor1 ||
          record.doctor2 ||
          record.doctor3 ||
          record.panelPullDate
      ),
    [qmeRecords]
  );

  const handleInputChange = (
    field: keyof Omit<PanelPullRecord, "id">,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if case already exists in QME records
    const existingRecordIndex = qmeRecords.findIndex(
      (record) => record.caseNumber === formData.caseNumber
    );

    const panelPullData = {
      specialty: formData.specialty,
      doctor1: formData.doctor1,
      doctor2: formData.doctor2,
      doctor3: formData.doctor3,
      panelPullDate: formData.panelPullDate,
    };

    let updatedRecords: ExtendedQmeRecord[];

    if (existingRecordIndex !== -1) {
      // Update existing record with panel pull data
      updatedRecords = [...qmeRecords];
      updatedRecords[existingRecordIndex] = {
        ...updatedRecords[existingRecordIndex],
        ...panelPullData,
        // Update applicant name if it's empty in existing record
        applicantName:
          updatedRecords[existingRecordIndex].applicantName || formData.name,
      };
    } else {
      // Create new QME record with panel pull data
      const newRecord: ExtendedQmeRecord = {
        id: generateId(),
        date: new Date().toISOString().split("T")[0],
        caseNumber: formData.caseNumber,
        applicantName: formData.name,
        doctorName: "", // Will be set when imported to QME
        phoneNumber: "",
        contactPerson: "",
        contactEmail: "",
        interpreterRequired: false,
        scheduled: "No" as ScheduledStatus,
        address: "",
        appointmentDate: "",
        appointmentTime: "",
        hoursBeforeArrival: "1",
        ...panelPullData,
      };
      updatedRecords = [...qmeRecords, newRecord];
    }

    setQmeRecords(updatedRecords);

    // Reset form
    setFormData({
      caseNumber: "",
      name: "",
      specialty: "",
      doctor1: "",
      doctor2: "",
      doctor3: "",
      panelPullDate: new Date().toISOString().split("T")[0],
    });

    alert(
      existingRecordIndex !== -1
        ? `Updated panel pull data for case ${formData.caseNumber}`
        : `Added new panel pull record for case ${formData.caseNumber}`
    );
  };

  // Handle record selection for editing
  const handleRecordClick = (record: ExtendedQmeRecord) => {
    setSelectedRecord(record);
    setEditData({
      caseNumber: record.caseNumber,
      applicantName: record.applicantName,
      specialty: record.specialty,
      doctor1: record.doctor1,
      doctor2: record.doctor2,
      doctor3: record.doctor3,
      panelPullDate: record.panelPullDate,
    });
    setShowSidePanel(true);
  };

  // Handle edit changes
  const handleEditChange = (field: keyof ExtendedQmeRecord, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save edited data
  const handleSave = () => {
    if (!selectedRecord) return;

    const updatedRecords = qmeRecords.map((record) =>
      record.id === selectedRecord.id ? { ...record, ...editData } : record
    );

    setQmeRecords(updatedRecords);
    setSelectedRecord({ ...selectedRecord, ...editData });
    setShowSidePanel(false);
  };

  // Delete record (remove panel pull data, not the entire QME record)
  const handleDelete = () => {
    if (!selectedRecord) return;

    const updatedRecords = qmeRecords.map((record) =>
      record.id === selectedRecord.id
        ? {
            ...record,
            specialty: "",
            doctor1: "",
            doctor2: "",
            doctor3: "",
            panelPullDate: "",
          }
        : record
    );

    setQmeRecords(updatedRecords);
    setShowSidePanel(false);
    setShowDeleteConfirm(false);
  };

  const generateEmailTemplate = (record: ExtendedQmeRecord) => {
    return `Hi Daniel,

A PQME ${record.specialty} panel has been pulled for this case using the denial letter.

Please review the panel and advise which doctor should be struck so that we can proceed with preparing the Panel Strike letter.

Thanks,`;
  };

  const copyToClipboard = (record: ExtendedQmeRecord) => {
    const emailTemplate = generateEmailTemplate(record);
    navigator.clipboard.writeText(emailTemplate);
    alert("Email template copied to clipboard!");
  };

  // Import Panel Pull record to QME Scheduling (set the doctor name)
  const importToQmeRecords = () => {
    if (!selectedRecord || !selectedDoctor) return;

    const updatedRecords = qmeRecords.map((record) =>
      record.id === selectedRecord.id
        ? { ...record, doctorName: selectedDoctor }
        : record
    );

    setQmeRecords(updatedRecords);

    alert(
      `Successfully set doctor to ${selectedDoctor} for case ${selectedRecord.caseNumber}`
    );
    setShowImportToQmeModal(false);
    setSelectedDoctor("");
  };

  // Export to Excel
  const exportToExcel = () => {
    const recordsToExport =
      exportSelected && selectedRecord ? [selectedRecord] : panelPullRecords;

    const excelData = recordsToExport.map((record) => ({
      "Case Number": record.caseNumber,
      "Applicant Name": record.applicantName,
      Specialty: record.specialty,
      "Doctor 1": record.doctor1,
      "Doctor 2": record.doctor2,
      "Doctor 3": record.doctor3,
      "Panel Pull Date": record.panelPullDate,
      "Scheduled Doctor": record.doctorName,
      "Scheduled Status": record.scheduled,
      "Appointment Date": record.appointmentDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Panel Pull Records");

    // Format Excel headers
    const headerStyle = {
      fill: { fgColor: { rgb: "4472C4" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
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

    XLSX.writeFile(workbook, "Panel_Pull_Records.xlsx");
    setShowExportModal(false);
  };

  // Clear all panel pull data (but keep the QME records)
  const clearAllRecords = () => {
    if (
      confirm(
        "Are you sure you want to clear all panel pull data? This will not delete QME records."
      )
    ) {
      const updatedRecords = qmeRecords.map((record) => ({
        ...record,
        specialty: "",
        doctor1: "",
        doctor2: "",
        doctor3: "",
        panelPullDate: "",
      }));
      setQmeRecords(updatedRecords);
    }
  };

  // Import from Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        let importedCount = 0;
        let updatedCount = 0;

        const updatedRecords = [...qmeRecords];

        jsonData.forEach((item: any) => {
          const caseNumber = item["Case Number"] || "";
          if (!caseNumber) return;

          const existingRecordIndex = updatedRecords.findIndex(
            (record) => record.caseNumber === caseNumber
          );

          const panelPullData = {
            specialty: item["Specialty"] || "",
            doctor1: item["Doctor 1"] || "",
            doctor2: item["Doctor 2"] || "",
            doctor3: item["Doctor 3"] || "",
            panelPullDate:
              item["Panel Pull Date"] || new Date().toISOString().split("T")[0],
          };

          if (existingRecordIndex !== -1) {
            // Update existing record
            updatedRecords[existingRecordIndex] = {
              ...updatedRecords[existingRecordIndex],
              ...panelPullData,
              applicantName:
                updatedRecords[existingRecordIndex].applicantName ||
                item["Applicant Name"] ||
                "",
            };
            updatedCount++;
          } else {
            // Create new record
            const newRecord: ExtendedQmeRecord = {
              id: generateId(),
              date: new Date().toISOString().split("T")[0],
              caseNumber: caseNumber,
              applicantName: item["Applicant Name"] || "",
              doctorName: "",
              phoneNumber: "",
              contactPerson: "",
              contactEmail: "",
              interpreterRequired: false,
              scheduled: "No" as ScheduledStatus,
              address: "",
              appointmentDate: "",
              appointmentTime: "",
              hoursBeforeArrival: "1",
              ...panelPullData,
            };
            updatedRecords.push(newRecord);
            importedCount++;
          }
        });

        setQmeRecords(updatedRecords);
        alert(
          `Successfully imported ${importedCount} new records and updated ${updatedCount} existing records`
        );
      } catch (error) {
        alert("Error importing Excel file. Please check the format.");
        console.error("Import error:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const filteredRecords = useMemo(
    () =>
      panelPullRecords.filter(
        (record) =>
          record.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.applicantName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          record.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.doctor1.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.doctor2.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.doctor3.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [panelPullRecords, searchTerm]
  );

  return (
    <div className={styles.panelPullContainer}>
      <h3>Panel Pull Records</h3>

      {/* Controls Section */}
      <div className={styles.controls}>
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Search cases, name, specialty, or doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
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
            Clear All Panel Data
          </button>
        </div>
      </div>

      <div className={styles.contentLayout}>
        {/* Form Section */}
        <div className={styles.formSection}>
          <h4>Add New Panel Pull</h4>
          <form onSubmit={handleSubmit} className={styles.panelPullForm}>
            <div className={styles.formGroup}>
              <label>Case Number:</label>
              <input
                type="text"
                value={formData.caseNumber}
                onChange={(e) =>
                  handleInputChange("caseNumber", e.target.value)
                }
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Name Of Applicant:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Specialty:</label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => handleInputChange("specialty", e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Doctor 1:</label>
              <input
                type="text"
                value={formData.doctor1}
                onChange={(e) => handleInputChange("doctor1", e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Doctor 2:</label>
              <input
                type="text"
                value={formData.doctor2}
                onChange={(e) => handleInputChange("doctor2", e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Doctor 3:</label>
              <input
                type="text"
                value={formData.doctor3}
                onChange={(e) => handleInputChange("doctor3", e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Panel Pull Date:</label>
              <input
                type="date"
                value={formData.panelPullDate}
                onChange={(e) =>
                  handleInputChange("panelPullDate", e.target.value)
                }
                required
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              {qmeRecords.some(
                (record) => record.caseNumber === formData.caseNumber
              )
                ? "Update Panel Pull"
                : "Save Panel Pull"}
            </button>
          </form>
        </div>

        {/* Records Section */}
        <div className={styles.recordsSection}>
          <h4>Panel Pull Records ({filteredRecords.length})</h4>

          {filteredRecords.length > 0 ? (
            <div className={styles.recordsTable}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Case #</th>
                    <th>Applicant Name</th>
                    <th>Specialty</th>
                    <th>Doctor 1</th>
                    <th>Doctor 2</th>
                    <th>Doctor 3</th>
                    <th>Pull Date</th>
                    <th>Scheduled Doctor</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr
                      key={record.id}
                      className={styles.recordRow}
                      onClick={() => handleRecordClick(record)}
                    >
                      <td>{record.caseNumber}</td>
                      <td>{record.applicantName}</td>
                      <td>{record.specialty}</td>
                      <td>{record.doctor1}</td>
                      <td>{record.doctor2}</td>
                      <td>{record.doctor3}</td>
                      <td>{record.panelPullDate}</td>
                      <td>{record.doctorName || "Not set"}</td>
                      <td>{record.scheduled}</td>
                      <td>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(record);
                          }}
                          className={styles.emailButton}
                        >
                          Copy Email
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigateToQmeScheduling(record);
                          }}
                          className={styles.scheduleButton}
                          disabled={
                            !record.doctor1 &&
                            !record.doctor2 &&
                            !record.doctor3
                          }
                        >
                          Open Case
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.noRecords}>
              {searchTerm
                ? "No matching records found"
                : "No panel pull records yet"}
            </div>
          )}
        </div>
      </div>

      {/* Edit Side Panel */}
      {showSidePanel && selectedRecord && (
        <div className={styles.sidePanel}>
          <button
            onClick={() => setShowSidePanel(false)}
            className={styles.closeButton}
          >
            ×
          </button>

          <h4>Edit Panel Pull for {selectedRecord.caseNumber}</h4>

          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label>Case Number:</label>
              <input
                type="text"
                value={editData.caseNumber || ""}
                onChange={(e) => handleEditChange("caseNumber", e.target.value)}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label>Name Of Applicant:</label>
              <input
                type="text"
                value={editData.applicantName || ""}
                onChange={(e) =>
                  handleEditChange("applicantName", e.target.value)
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Specialty:</label>
              <input
                type="text"
                value={editData.specialty || ""}
                onChange={(e) => handleEditChange("specialty", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Doctor 1:</label>
              <input
                type="text"
                value={editData.doctor1 || ""}
                onChange={(e) => handleEditChange("doctor1", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Doctor 2:</label>
              <input
                type="text"
                value={editData.doctor2 || ""}
                onChange={(e) => handleEditChange("doctor2", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Doctor 3:</label>
              <input
                type="text"
                value={editData.doctor3 || ""}
                onChange={(e) => handleEditChange("doctor3", e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Panel Pull Date:</label>
              <input
                type="date"
                value={editData.panelPullDate || ""}
                onChange={(e) =>
                  handleEditChange("panelPullDate", e.target.value)
                }
              />
            </div>

            <div className={styles.buttonGroup}>
              <button onClick={handleSave} className={styles.saveButton}>
                Save Changes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.deleteButton}
              >
                Remove Panel Data
              </button>
              {/* <button
                onClick={() => {
                  setShowImportToQmeModal(true);
                  setShowSidePanel(false);
                }}
                className={styles.importQmeButton}
                disabled={!!selectedRecord.doctorName}
              >
                {selectedRecord.doctorName ? "Doctor Set" : "Set Doctor"}
              </button> */}
            </div>
          </div>

          <div className={styles.emailTemplate}>
            <h5>Email Template:</h5>
            <textarea
              readOnly
              value={generateEmailTemplate(selectedRecord)}
              className={styles.emailTextarea}
            />
            <button
              onClick={() => copyToClipboard(selectedRecord)}
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
            <h4>Confirm Removal</h4>
            <p>
              Are you sure you want to remove panel pull data for{" "}
              {selectedRecord?.caseNumber}? This will not delete the QME record.
            </p>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className={styles.confirmDeleteButton}
              >
                Remove Data
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

      {/* Import to QME Modal */}
      {showImportToQmeModal && selectedRecord && (
        <div className={styles.modalOverlay}>
          <div className={styles.importQmeModal}>
            <h4>Set Doctor for QME Scheduling</h4>
            <p>
              Set the doctor for case{" "}
              <strong>{selectedRecord.caseNumber}</strong> in QME scheduling?
            </p>

            <div className={styles.doctorSelection}>
              <label>Select Doctor:</label>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className={styles.doctorSelect}
              >
                <option value="">Select a doctor</option>
                <option value={selectedRecord.doctor1}>
                  {selectedRecord.doctor1}
                </option>
                <option value={selectedRecord.doctor2}>
                  {selectedRecord.doctor2}
                </option>
                <option value={selectedRecord.doctor3}>
                  {selectedRecord.doctor3}
                </option>
              </select>
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  setShowImportToQmeModal(false);
                  setSelectedDoctor("");
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={importToQmeRecords}
                className={styles.confirmButton}
                disabled={!selectedDoctor}
              >
                Set Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
