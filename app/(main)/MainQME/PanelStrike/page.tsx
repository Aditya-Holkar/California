/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import styles from "../../../styles/PanelStrike.module.css";
import * as XLSX from "xlsx";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { ExtendedQmeRecord } from "../../../Utils/qme";
// Add this import at the top of your PanelStrikePage component
import { useRouter } from "next/navigation";

interface StrikeRecord {
  id: string;
  caseNumber: string;
  applicantName: string;
  strikeDate: string;
  strikeType: "AA" | "DA";
  struckDoctor: string;
  remainingDoctors: string[];
  orderId: string;
  followUpDate: string;
  isCompleted: boolean;
  strikeNumber: 1 | 2;
}

const QME_STORAGE_KEY = "qmeRecords";

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateOrderId = () =>
  `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

export default function PanelStrikePage() {
  const router = useRouter();
  const [qmeRecords, setQmeRecords] = useLocalStorage<ExtendedQmeRecord[]>(
    QME_STORAGE_KEY,
    []
  );
  const [strikeRecords, setStrikeRecords] = useLocalStorage<StrikeRecord[]>(
    "panelStrikeRecords",
    []
  );

  // In your QME page component
  useEffect(() => {
    const navigationData =
      localStorage.getItem("qmeCallPrefillData") ||
      localStorage.getItem("qmeNavigationData");

    if (navigationData) {
      const data = JSON.parse(navigationData);

      // Find the specific case in your QME records
      const specificCase = qmeRecords.find(
        (record) => record.id === data.caseId
      );

      if (specificCase) {
        // Pre-fill the form or set state to show this specific case
        setSelectedCase(specificCase);
        // Clear the storage after use
        localStorage.removeItem("qmeCallPrefillData");
        localStorage.removeItem("qmeNavigationData");
      }
    }
  }, []);

  // Add this function inside your component, after the state declarations
  const navigateToQmeScheduling = (strikeRecord: StrikeRecord) => {
    if (strikeRecord.remainingDoctors.length === 0) return;

    const remainingDoctor = strikeRecord.remainingDoctors[0];
    const caseRecord = qmeRecords.find(
      (record) => record.caseNumber === strikeRecord.caseNumber
    );

    // Prepare data to pass to QME Call page
    const qmeCallData = {
      caseNumber: strikeRecord.caseNumber,
      applicantName: strikeRecord.applicantName,
      doctorName: remainingDoctor,
      phoneNumber: caseRecord?.phoneNumber || "",
      contactPerson: caseRecord?.contactPerson || "",
      contactEmail: caseRecord?.contactEmail || "",
      interpreterRequired: caseRecord?.interpreterRequired || true,
      specialty: caseRecord?.specialty || "", // Add specialty if available
    };

    // Store the data in localStorage for the QME page to access
    localStorage.setItem("qmeCallPrefillData", JSON.stringify(qmeCallData));

    // Navigate to QME page (same folder level)
    router.push("QME"); // This will go from /MainQME/PanelStrike to /MainQME/QME
  };

  const [selectedCase, setSelectedCase] = useState<ExtendedQmeRecord | null>(
    null
  );
  const [strikeData, setStrikeData] = useState({
    strikeType: "AA" as "AA" | "DA",
    struckDoctor: "",
    strikeDate: new Date().toISOString().split("T")[0],
    orderId: generateOrderId(),
  });
  const [showStrikeModal, setShowStrikeModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [editData, setEditData] = useState<Partial<StrikeRecord>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelected, setExportSelected] = useState(false);

  // Filter QME records that have panel pull data but aren't fully scheduled
  const eligibleCases = useMemo(
    () =>
      qmeRecords.filter(
        (record) =>
          record.specialty &&
          (record.doctor1 || record.doctor2 || record.doctor3) &&
          record.scheduled !== "Yes"
      ),
    [qmeRecords]
  );

  // Enhanced useEffect for better synchronization
  useEffect(() => {
    const handleQmeRecordDeleted = (event: CustomEvent) => {
      const { caseNumber } = event.detail;

      // Remove strike records for the deleted case
      const updatedStrikeRecords = strikeRecords.filter(
        (strike) => strike.caseNumber !== caseNumber
      );

      if (updatedStrikeRecords.length !== strikeRecords.length) {
        setStrikeRecords(updatedStrikeRecords);
        console.log(`Removed strike records for deleted case: ${caseNumber}`);
      }
    };

    const handleStorageChange = () => {
      // Sync with localStorage changes from other tabs
      const savedQmeRecords = localStorage.getItem(QME_STORAGE_KEY);
      const savedStrikeRecords = localStorage.getItem("panelStrikeRecords");

      if (savedQmeRecords) {
        try {
          const parsedQmeRecords = JSON.parse(savedQmeRecords);
          setQmeRecords(parsedQmeRecords);

          // Get current case numbers
          const caseNumbers = new Set(
            parsedQmeRecords.map(
              (record: ExtendedQmeRecord) => record.caseNumber
            )
          );

          // Filter strike records to only include valid cases
          let currentStrikeRecords = strikeRecords;
          if (savedStrikeRecords) {
            currentStrikeRecords = JSON.parse(savedStrikeRecords);
          }

          const validStrikeRecords = currentStrikeRecords.filter(
            (strike: StrikeRecord) => caseNumbers.has(strike.caseNumber)
          );

          if (validStrikeRecords.length !== currentStrikeRecords.length) {
            setStrikeRecords(validStrikeRecords);
          }
        } catch (error) {
          console.error("Error processing storage change:", error);
        }
      }
    };

    // Add this function to your PanelStrikePage component
    const cleanupOrphanedStrikeRecords = () => {
      const caseNumbers = new Set(
        qmeRecords.map((record) => record.caseNumber)
      );
      const updatedStrikeRecords = strikeRecords.filter((strike) =>
        caseNumbers.has(strike.caseNumber)
      );

      if (updatedStrikeRecords.length !== strikeRecords.length) {
        setStrikeRecords(updatedStrikeRecords);
        console.log(
          `Cleaned up ${
            strikeRecords.length - updatedStrikeRecords.length
          } orphaned strike records`
        );
      }
    };

    // Call this function when needed, for example:
    // useEffect(() => {
    //   cleanupOrphanedStrikeRecords();
    // }, [qmeRecords]);

    // Listen for custom event (same tab)
    window.addEventListener(
      "qmeRecordDeleted",
      handleQmeRecordDeleted as EventListener
    );

    // Listen for storage events (other tabs)
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "qmeRecordDeleted",
        handleQmeRecordDeleted as EventListener
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [strikeRecords, setStrikeRecords, setQmeRecords]);

  // Filter strike records based on search term
  const filteredStrikeRecords = useMemo(
    () =>
      strikeRecords.filter(
        (record) =>
          record.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.applicantName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          record.struckDoctor
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          record.orderId.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [strikeRecords, searchTerm]
  );

  // Get available doctors for selected case
  const availableDoctors = useMemo(() => {
    if (!selectedCase) return [];
    return [
      selectedCase.doctor1,
      selectedCase.doctor2,
      selectedCase.doctor3,
    ].filter((doctor): doctor is string => doctor && doctor.trim() !== "");
  }, [selectedCase]);

  // Get existing strike records for selected case
  const caseStrikeHistory = useMemo(
    () =>
      strikeRecords
        .filter((record) => record.caseNumber === selectedCase?.caseNumber)
        .sort(
          (a, b) =>
            new Date(a.strikeDate).getTime() - new Date(b.strikeDate).getTime()
        ),
    [strikeRecords, selectedCase]
  );

  // Calculate next strike number
  const nextStrikeNumber = (caseStrikeHistory.length + 1) as 1 | 2;

  // Get remaining doctors after strikes
  const remainingDoctors = useMemo(() => {
    if (!selectedCase) return availableDoctors;

    const struckDoctors = caseStrikeHistory.map(
      (strike) => strike.struckDoctor
    );
    return availableDoctors.filter((doctor) => !struckDoctors.includes(doctor));
  }, [selectedCase, availableDoctors, caseStrikeHistory]);

  // Handle case selection
  const handleCaseSelect = (record: ExtendedQmeRecord) => {
    setSelectedCase(record);
    setStrikeData((prev) => ({
      ...prev,
      struckDoctor: "",
      strikeDate: new Date().toISOString().split("T")[0],
      orderId: generateOrderId(),
    }));
  };

  // Record a strike
  const recordStrike = () => {
    if (!selectedCase || !strikeData.struckDoctor) return;

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 15);

    const newStrike: StrikeRecord = {
      id: generateId(),
      caseNumber: selectedCase.caseNumber,
      applicantName: selectedCase.applicantName,
      strikeDate: strikeData.strikeDate,
      strikeType: strikeData.strikeType,
      struckDoctor: strikeData.struckDoctor,
      remainingDoctors: remainingDoctors.filter(
        (doc) => doc !== strikeData.struckDoctor
      ),
      orderId: strikeData.orderId,
      followUpDate: followUpDate.toISOString().split("T")[0],
      isCompleted: strikeData.strikeType === "AA", // AA strikes are auto-completed
      strikeNumber: nextStrikeNumber,
    };

    setStrikeRecords([...strikeRecords, newStrike]);
    setShowStrikeModal(false);

    // Show email template for AA strikes
    if (strikeData.strikeType === "AA") {
      generateEmailTemplate(newStrike);
      setShowEmailModal(true);
    }
  };

  // Generate email template
  const generateEmailTemplate = (strike: StrikeRecord) => {
    const remainingDoctor =
      strike.remainingDoctors[0] || "the remaining doctor";

    if (strike.strikeNumber === 1) {
      setEmailTemplate(`Subject: First Panel Strike – Applicant: ${strike.applicantName}

Hello,

We have reviewed the PQME panel for applicant ${strike.applicantName}, and we have struck Dr. ${strike.struckDoctor} from the panel.

Kindly note this strike, and let us know if you have any questions.

Note: Panel Strike mailed to DA – Order ID: ${strike.orderId}.`);
    } else {
      setEmailTemplate(`Subject: Second Panel Strike – Applicant: ${strike.applicantName}

Hello,

We have reviewed the PQME panel for applicant ${strike.applicantName}, and we have struck Dr. ${strike.struckDoctor} from the panel.

With this strike, we will proceed to schedule the QME appointment with Dr. ${remainingDoctor}. Please let me know if you require any additional information.

Thank you for your cooperation.

Note: Panel Strike mailed to DA – Order ID: ${strike.orderId}.`);
    }
  };

  // Copy email to clipboard
  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(emailTemplate);
    alert("Email template copied to clipboard!");
  };

  // Mark follow-up as completed
  const markFollowUpCompleted = (strikeId: string) => {
    setStrikeRecords(
      strikeRecords.map((record) =>
        record.id === strikeId ? { ...record, isCompleted: true } : record
      )
    );
  };

  // Calculate days until follow-up
  const getDaysUntilFollowUp = (followUpDate: string) => {
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = followUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Check if follow-up is overdue
  const isFollowUpOverdue = (followUpDate: string) => {
    return new Date(followUpDate) < new Date();
  };

  // Edit strike record
  const handleEditStrike = (strike: StrikeRecord) => {
    setEditData(strike);
    setShowSidePanel(true);
  };

  // Save edited strike record
  const handleSaveEdit = () => {
    if (!editData.id) return;

    const updatedRecords = strikeRecords.map((record) =>
      record.id === editData.id ? { ...record, ...editData } : record
    );

    setStrikeRecords(updatedRecords);
    setShowSidePanel(false);
    setEditData({});
  };

  // Delete strike record
  const handleDeleteStrike = () => {
    if (!editData.id) return;

    const updatedRecords = strikeRecords.filter(
      (record) => record.id !== editData.id
    );

    setStrikeRecords(updatedRecords);
    setShowSidePanel(false);
    setShowDeleteConfirm(false);
    setEditData({});
  };

  // Export to Excel
  const exportToExcel = () => {
    const recordsToExport =
      exportSelected && editData.id
        ? strikeRecords.filter((record) => record.id === editData.id)
        : strikeRecords;

    const excelData = recordsToExport.map((record) => ({
      "Case Number": record.caseNumber,
      "Applicant Name": record.applicantName,
      "Strike Date": record.strikeDate,
      "Strike Type": record.strikeType,
      "Struck Doctor": record.struckDoctor,
      "Remaining Doctors": record.remainingDoctors.join(", "),
      "Order ID": record.orderId,
      "Follow-up Date": record.followUpDate,
      "Follow-up Completed": record.isCompleted ? "Yes" : "No",
      "Strike Number": record.strikeNumber,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Panel Strike Records");

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

    XLSX.writeFile(workbook, "Panel_Strike_Records.xlsx");
    setShowExportModal(false);
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

        const importedRecords: StrikeRecord[] = [];

        jsonData.forEach((item: any) => {
          const strikeRecord: StrikeRecord = {
            id: generateId(),
            caseNumber: item["Case Number"] || "",
            applicantName: item["Applicant Name"] || "",
            strikeDate:
              item["Strike Date"] || new Date().toISOString().split("T")[0],
            strikeType: item["Strike Type"] === "DA" ? "DA" : "AA",
            struckDoctor: item["Struck Doctor"] || "",
            remainingDoctors: item["Remaining Doctors"]
              ? item["Remaining Doctors"].split(", ")
              : [],
            orderId: item["Order ID"] || generateOrderId(),
            followUpDate:
              item["Follow-up Date"] || new Date().toISOString().split("T")[0],
            isCompleted: item["Follow-up Completed"] === "Yes",
            strikeNumber: item["Strike Number"] === 2 ? 2 : 1,
          };

          importedRecords.push(strikeRecord);
        });

        setStrikeRecords([...strikeRecords, ...importedRecords]);
        alert(`Successfully imported ${importedRecords.length} strike records`);
      } catch (error) {
        alert("Error importing Excel file. Please check the format.");
        console.error("Import error:", error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Clear all strike records
  const clearAllRecords = () => {
    if (
      confirm(
        "Are you sure you want to clear all panel strike records? This action cannot be undone."
      )
    ) {
      setStrikeRecords([]);
    }
  };

  return (
    <div className={styles.panelStrikeContainer}>
      <h3>Panel Strike Management</h3>

      {/* Controls Section */}
      <div className={styles.controls}>
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Search cases, applicant, doctor, or order ID..."
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
            Clear All Strikes
          </button>
        </div>
      </div>

      <div className={styles.contentLayout}>
        {/* Cases Section */}
        <div className={styles.casesSection}>
          <h4>Eligible Cases for Panel Strike ({eligibleCases.length})</h4>

          {eligibleCases.length > 0 ? (
            <div className={styles.casesList}>
              {eligibleCases.map((record) => (
                <div
                  key={record.id}
                  className={`${styles.caseCard} ${
                    selectedCase?.id === record.id ? styles.selectedCase : ""
                  }`}
                  onClick={() => handleCaseSelect(record)}
                >
                  <div className={styles.caseHeader}>
                    <strong>{record.caseNumber}</strong>
                    <span>{record.applicantName}</span>
                  </div>
                  <div className={styles.caseDetails}>
                    <div>
                      <strong>Specialty:</strong> {record.specialty}
                    </div>
                    <div>
                      <strong>Doctors:</strong>
                    </div>
                    <ul>
                      {record.doctor1 && <li>• {record.doctor1}</li>}
                      {record.doctor2 && <li>• {record.doctor2}</li>}
                      {record.doctor3 && <li>• {record.doctor3}</li>}
                    </ul>
                  </div>
                  {caseStrikeHistory.filter(
                    (s) => s.caseNumber === record.caseNumber
                  ).length > 0 && (
                    <div className={styles.strikeBadge}>
                      {
                        caseStrikeHistory.filter(
                          (s) => s.caseNumber === record.caseNumber
                        ).length
                      }{" "}
                      strike(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noCases}>
              No eligible cases found. Cases need panel pull data to be eligible
              for panel strike.
            </div>
          )}
        </div>

        {/* Strike Management Section */}
        <div className={styles.strikeSection}>
          {selectedCase ? (
            <>
              <div className={styles.caseInfo}>
                <h4>Panel Strike for {selectedCase.caseNumber}</h4>
                <div className={styles.caseSummary}>
                  <p>
                    <strong>Applicant:</strong> {selectedCase.applicantName}
                  </p>
                  <p>
                    <strong>Specialty:</strong> {selectedCase.specialty}
                  </p>
                </div>
              </div>

              {/* Current Doctors Status */}
              <div className={styles.doctorsStatus}>
                <h5>Doctors Status</h5>
                <div className={styles.doctorsList}>
                  {availableDoctors.map((doctor, index) => {
                    const isStruck = caseStrikeHistory.some(
                      (strike) => strike.struckDoctor === doctor
                    );
                    return (
                      <div
                        key={index}
                        className={`${styles.doctorItem} ${
                          isStruck ? styles.struck : ""
                        }`}
                      >
                        <span className={styles.doctorName}>Dr. {doctor}</span>
                        {isStruck && (
                          <span className={styles.strikeStatus}>
                            Struck (
                            {
                              caseStrikeHistory.find(
                                (s) => s.struckDoctor === doctor
                              )?.strikeType
                            }
                            )
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strike Action */}
              {nextStrikeNumber <= 2 && remainingDoctors.length > 1 && (
                <div className={styles.strikeAction}>
                  <button
                    onClick={() => setShowStrikeModal(true)}
                    className={styles.recordStrikeButton}
                  >
                    Record {nextStrikeNumber === 1 ? "First" : "Second"} Strike
                  </button>
                </div>
              )}

              {/* Strike History */}
              {caseStrikeHistory.length > 0 && (
                <div className={styles.strikeHistory}>
                  <h5>Strike History</h5>
                  {caseStrikeHistory.map((strike) => (
                    <div key={strike.id} className={styles.strikeRecord}>
                      <div className={styles.strikeHeader}>
                        <span className={styles.strikeNumber}>
                          Strike #{strike.strikeNumber}
                        </span>
                        <span className={styles.strikeType}>
                          {strike.strikeType} Strike
                        </span>
                        <span className={styles.strikeDate}>
                          {strike.strikeDate}
                        </span>
                        <button
                          onClick={() => handleEditStrike(strike)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                      </div>
                      <div className={styles.strikeDetails}>
                        <p>
                          <strong>Struck Doctor:</strong> Dr.{" "}
                          {strike.struckDoctor}
                        </p>
                        <p>
                          <strong>Order ID:</strong> {strike.orderId}
                        </p>
                        <p>
                          <strong>Remaining Doctors:</strong>{" "}
                          {strike.remainingDoctors.join(", ")}
                        </p>
                      </div>

                      {/* Follow-up Section for DA Strikes */}
                      {strike.strikeType === "DA" && (
                        <div className={styles.followUpSection}>
                          <div className={styles.followUpHeader}>
                            <span>Follow-up Date: {strike.followUpDate}</span>
                            {strike.isCompleted ? (
                              <span className={styles.completed}>
                                Completed
                              </span>
                            ) : (
                              <span
                                className={
                                  isFollowUpOverdue(strike.followUpDate)
                                    ? styles.overdue
                                    : styles.pending
                                }
                              >
                                {isFollowUpOverdue(strike.followUpDate)
                                  ? `Overdue by ${Math.abs(
                                      getDaysUntilFollowUp(strike.followUpDate)
                                    )} days`
                                  : `${getDaysUntilFollowUp(
                                      strike.followUpDate
                                    )} days remaining`}
                              </span>
                            )}
                          </div>
                          {!strike.isCompleted && (
                            <button
                              onClick={() => markFollowUpCompleted(strike.id)}
                              className={styles.completeButton}
                            >
                              Mark Follow-up Completed
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Final Doctor Selection */}
              {remainingDoctors.length === 1 && (
                <div className={styles.finalDoctor}>
                  <h5>✅ Panel Strike Complete</h5>
                  <p>
                    Final QME Doctor: <strong>Dr. {remainingDoctors[0]}</strong>
                  </p>
                  <p>
                    Proceed to schedule the QME appointment with Dr.{" "}
                    {remainingDoctors[0]}
                  </p>
                  {/* Add this button */}
                  <button
                    onClick={() => {
                      const strikeRecord =
                        caseStrikeHistory[caseStrikeHistory.length - 1];
                      navigateToQmeScheduling(strikeRecord);
                    }}
                    className={styles.scheduleButton}
                  >
                    Schedule QME Appointment
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={styles.noSelection}>
              Please select a case to manage panel strikes
            </div>
          )}
        </div>
      </div>

      {/* All Strike Records Table */}
      <div className={styles.allStrikesSection}>
        <h4>All Strike Records ({filteredStrikeRecords.length})</h4>
        {filteredStrikeRecords.length > 0 ? (
          <div className={styles.strikesTable}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Applicant</th>
                  <th>Strike Date</th>
                  <th>Type</th>
                  <th>Struck Doctor</th>
                  <th>Order ID</th>
                  <th>Follow-up Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStrikeRecords.map((strike) => (
                  <tr key={strike.id} className={styles.strikeRow}>
                    <td>{strike.caseNumber}</td>
                    <td>{strike.applicantName}</td>
                    <td>{strike.strikeDate}</td>
                    <td>
                      <span
                        className={
                          strike.strikeType === "AA"
                            ? styles.aaBadge
                            : styles.daBadge
                        }
                      >
                        {strike.strikeType}
                      </span>
                    </td>
                    <td>Dr. {strike.struckDoctor}</td>
                    <td>{strike.orderId}</td>
                    <td>{strike.followUpDate}</td>
                    <td>
                      {strike.strikeType === "DA" ? (
                        strike.isCompleted ? (
                          <span className={styles.completed}>Completed</span>
                        ) : (
                          <span
                            className={
                              isFollowUpOverdue(strike.followUpDate)
                                ? styles.overdue
                                : styles.pending
                            }
                          >
                            {isFollowUpOverdue(strike.followUpDate)
                              ? "Overdue"
                              : "Pending"}
                          </span>
                        )
                      ) : (
                        <span className={styles.completed}>Auto-completed</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => handleEditStrike(strike)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setEditData(strike);
                          generateEmailTemplate(strike);
                          setShowEmailModal(true);
                        }}
                        className={styles.emailButton}
                      >
                        View Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.noStrikes}>
            {searchTerm
              ? "No matching strike records found"
              : "No strike records yet"}
          </div>
        )}
      </div>

      {/* Strike Modal */}
      {showStrikeModal && selectedCase && (
        <div className={styles.modalOverlay}>
          <div className={styles.strikeModal}>
            <h4>
              Record {nextStrikeNumber === 1 ? "First" : "Second"} Panel Strike
            </h4>

            <div className={styles.strikeForm}>
              <div className={styles.formGroup}>
                <label>Strike Type:</label>
                <select
                  value={strikeData.strikeType}
                  onChange={(e) =>
                    setStrikeData((prev) => ({
                      ...prev,
                      strikeType: e.target.value as "AA" | "DA",
                    }))
                  }
                >
                  <option value="AA">AA Strike (Our Strike)</option>
                  <option value="DA">
                    DA Strike (Defense Attorney Strike)
                  </option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Select Doctor to Strike:</label>
                <div className={styles.doctorsChecklist}>
                  {remainingDoctors.map((doctor, index) => (
                    <label key={index} className={styles.doctorCheckbox}>
                      <input
                        type="radio"
                        name="struckDoctor"
                        value={doctor}
                        checked={strikeData.struckDoctor === doctor}
                        onChange={(e) =>
                          setStrikeData((prev) => ({
                            ...prev,
                            struckDoctor: e.target.value,
                          }))
                        }
                      />
                      <span>Dr. {doctor}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Strike Date:</label>
                <input
                  type="date"
                  value={strikeData.strikeDate}
                  onChange={(e) =>
                    setStrikeData((prev) => ({
                      ...prev,
                      strikeDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Order ID:</label>
                <input
                  type="text"
                  value={strikeData.orderId}
                  onChange={(e) =>
                    setStrikeData((prev) => ({
                      ...prev,
                      orderId: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowStrikeModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={recordStrike}
                className={styles.confirmButton}
                disabled={!strikeData.struckDoctor}
              >
                Record Strike
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Template Modal */}
      {showEmailModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.emailModal}>
            <h4>Email Template</h4>
            <div className={styles.emailContent}>
              <textarea
                value={emailTemplate}
                readOnly
                className={styles.emailTextarea}
              />
            </div>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowEmailModal(false)}
                className={styles.cancelButton}
              >
                Close
              </button>
              <button
                onClick={copyEmailToClipboard}
                className={styles.confirmButton}
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Side Panel */}
      {showSidePanel && editData.id && (
        <div className={styles.sidePanel}>
          <button
            onClick={() => setShowSidePanel(false)}
            className={styles.closeButton}
          >
            ×
          </button>

          <h4>Edit Strike Record</h4>

          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label>Case Number:</label>
              <input
                type="text"
                value={editData.caseNumber || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    caseNumber: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Applicant Name:</label>
              <input
                type="text"
                value={editData.applicantName || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    applicantName: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Strike Date:</label>
              <input
                type="date"
                value={editData.strikeDate || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    strikeDate: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Strike Type:</label>
              <select
                value={editData.strikeType || "AA"}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    strikeType: e.target.value as "AA" | "DA",
                  }))
                }
              >
                <option value="AA">AA Strike</option>
                <option value="DA">DA Strike</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Struck Doctor:</label>
              <input
                type="text"
                value={editData.struckDoctor || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    struckDoctor: e.target.value,
                  }))
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Order ID:</label>
              <input
                type="text"
                value={editData.orderId || ""}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, orderId: e.target.value }))
                }
              />
            </div>

            <div className={styles.formGroup}>
              <label>Follow-up Date:</label>
              <input
                type="date"
                value={editData.followUpDate || ""}
                onChange={(e) =>
                  setEditData((prev) => ({
                    ...prev,
                    followUpDate: e.target.value,
                  }))
                }
              />
            </div>

            {editData.strikeType === "DA" && (
              <div className={styles.formGroup}>
                <label>Follow-up Completed:</label>
                <select
                  value={editData.isCompleted ? "true" : "false"}
                  onChange={(e) =>
                    setEditData((prev) => ({
                      ...prev,
                      isCompleted: e.target.value === "true",
                    }))
                  }
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            )}

            <div className={styles.buttonGroup}>
              <button onClick={handleSaveEdit} className={styles.saveButton}>
                Save Changes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.deleteButton}
              >
                Delete Strike
              </button>
              <button
                onClick={() => {
                  generateEmailTemplate(editData as StrikeRecord);
                  setShowEmailModal(true);
                }}
                className={styles.emailButton}
              >
                View Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmationModal}>
            <h4>Confirm Deletion</h4>
            <p>
              Are you sure you want to delete the strike record for{" "}
              {editData.caseNumber}?
            </p>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStrike}
                className={styles.confirmDeleteButton}
              >
                Delete
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
                  disabled={!editData.id}
                />
                Export selected record only
                {!editData.id && " (No record selected)"}
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
