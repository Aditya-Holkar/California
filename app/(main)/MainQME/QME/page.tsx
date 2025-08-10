"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import styles from "../../../styles/Qme.module.css";
import * as XLSX from "xlsx";
// import ScheduledQmePanel from "../components/ScheduledQmePanel";
import {
  ExtendedQmeRecord,
  QmeRecord,
  ScheduledStatus,
} from "../../../Utils/qme";

export default function EmailTemplate() {
  const [applicantName, setApplicantName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [interpreterRequired, setInterpreterRequired] = useState(true);
  const [savedRecords, setSavedRecords] = useLocalStorage<ExtendedQmeRecord[]>(
    "qmeRecords",
    []
  );
  const [isCopied, setIsCopied] = useState("");
  const [activeTab, setActiveTab] = useState<"call" | "email" | "note">("call");
  // const [editingId, setEditingId] = useState<string | null>(null);
  const [showRecordsPanel, setShowRecordsPanel] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  useEffect(() => {
    const handleStorageChange = () => {
      const records = JSON.parse(localStorage.getItem("qmeRecords") || "[]");
      setSavedRecords(records);
    };

    // Listen for both storage and custom events
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("qmeRecordsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("qmeRecordsUpdated", handleStorageChange);
    };
  }, [setSavedRecords]);

  const generateCallText = () => {
    return `Called Dr.'s office on PH: ${phoneNumber} and spoke with ${contactPerson}. Requested to schedule the QME appointment for our applicant ${applicantName} with Dr. ${doctorName} within 55-60 days from today's date. They provided ${contactEmail} as the email address to send the panel strike and demographic information. I will be sending the email shortly!`;
  };

  const generateEmailText = () => {
    return `Subject: QME Appointment Scheduling Request for ${applicantName} with Dr. ${doctorName}

Hello,

I hope you are doing well.
Please find attached the Panel Strike and demographic for ${applicantName}.
I would like to schedule the QME appointment for this applicant with Dr. ${doctorName} within 55-60 days from today's date.
${
  interpreterRequired
    ? "We will also require a Spanish interpreter for this QME."
    : "As the applicant speaks and understands English, an interpreter will not be necessary for the QME."
}

Please let me know if you require anything further from my end.


`;
  };

  const [viewingRecord, setViewingRecord] = useState<QmeRecord | null>(null);
  // Remove any edit-related states like editingId

  const generateNoteText = () => {
    return `QME request sent to Dr.'s office for ${applicantName} with Dr. ${doctorName} within 55-60 days, along with panel strike and demographic information via email. Awaiting their response.`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!caseNumber) {
      alert("Please enter a case number");
      return;
    }

    const newRecord: ExtendedQmeRecord = {
      id: generateId(),
      date: new Date().toISOString().split("T")[0],
      caseNumber,
      applicantName,
      doctorName,
      phoneNumber,
      interpreterRequired,
      contactPerson,
      contactEmail,
      scheduled: "No" as ScheduledStatus,
      address: "",
      appointmentDate: "",
      appointmentTime: "",
      hoursBeforeArrival: "1",
    };

    setSavedRecords([...savedRecords, newRecord]);
    resetForm();
  };

  const resetForm = () => {
    setApplicantName("");
    setDoctorName("");
    setPhoneNumber("");
    setContactPerson("");
    setContactEmail("");
    setCaseNumber("");
    setInterpreterRequired(true);
    setViewingRecord(null);
  };

  // const handleEdit = (record: QmeRecord) => {
  //   setApplicantName(record.applicantName);
  //   setDoctorName(record.doctorName);
  //   setPhoneNumber(record.phoneNumber);
  //   setContactPerson(record.contactPerson);
  //   setContactEmail(record.contactEmail);
  //   setCaseNumber(record.caseNumber);
  //   setInterpreterRequired(record.interpreterRequired);
  //   // setEditingId(record.id);
  //   setViewingRecords(false); // Add this line
  //   window.scrollTo({ top: 0, behavior: "smooth" });
  // };

  // const handleDelete = (id: string) => {
  //   if (confirm("Are you sure you want to delete this record?")) {
  //     setSavedRecords(savedRecords.filter((record) => record.id !== id));
  //   }
  // };

  const copyToClipboard = (type: "call" | "email" | "note") => {
    let text = "";
    if (type === "call") text = generateCallText();
    if (type === "email") text = generateEmailText();
    if (type === "note") text = generateNoteText();

    navigator.clipboard.writeText(text);
    setIsCopied(type);
    setTimeout(() => setIsCopied(""), 2000);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      savedRecords.map((record) => ({
        Date: record.date,
        "Case Number": record.caseNumber,
        "Applicant Name": record.applicantName,
        "Doctor Name": record.doctorName,
        "Phone Number": record.phoneNumber,
        "Interpreter Required": record.interpreterRequired ? "Yes" : "No",
        "Contact Person": record.contactPerson,
        "Contact Email": record.contactEmail,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "QME Records");
    XLSX.writeFile(workbook, "QME_Records.xlsx");
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>QME Appointment Request Generator</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="caseNumber" className={styles.label}>
            Case Number *
          </label>
          <input
            id="caseNumber"
            type="text"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            className={styles.input}
            required
            readOnly={!!viewingRecord}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="applicantName" className={styles.label}>
            Applicant Name *
          </label>
          <input
            id="applicantName"
            type="text"
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className={styles.input}
            required
            readOnly={!!viewingRecord}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="doctorName" className={styles.label}>
            Doctor Name *
          </label>
          <input
            id="doctorName"
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            className={styles.input}
            required
            readOnly={!!viewingRecord}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phoneNumber" className={styles.label}>
            Office Phone Number *
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className={styles.input}
            required
            readOnly={!!viewingRecord}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contactPerson" className={styles.label}>
            Contact Person *
          </label>
          <input
            id="contactPerson"
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            className={styles.input}
            required
            readOnly={!!viewingRecord}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contactEmail" className={styles.label}>
            Contact Email *
          </label>
          <input
            id="contactEmail"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className={styles.input}
            required
            readOnly={!!viewingRecord}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Interpreter Required</label>
          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={interpreterRequired}
                onChange={(e) => setInterpreterRequired(e.target.checked)}
                readOnly={!!viewingRecord}
              />
              <span className={styles.checkboxLabel}>
                Spanish Interpreter Needed
              </span>
            </label>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          {!viewingRecord ? (
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              Save Record
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setViewingRecord(null);
              }}
              className={`${styles.button} ${styles.buttonCancel}`}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "call" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("call")}
        >
          Call Script
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "email" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("email")}
        >
          Email Template
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "note" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("note")}
        >
          Note Template
        </button>
      </div>

      <div className={styles.templatePreview}>
        {activeTab === "call" && (
          <>
            <h2 className={styles.templateTitle}>Call Script</h2>
            <div className={styles.templateContent}>{generateCallText()}</div>
            <button
              onClick={() => copyToClipboard("call")}
              className={`${styles.button} ${styles.buttonSuccess}`}
            >
              {isCopied === "call" ? "Copied!" : "Copy Call Script"}
            </button>
          </>
        )}

        {activeTab === "email" && (
          <>
            <h2 className={styles.templateTitle}>Email Template</h2>
            <div className={styles.templateContent}>{generateEmailText()}</div>
            <button
              onClick={() => copyToClipboard("email")}
              className={`${styles.button} ${styles.buttonSuccess}`}
            >
              {isCopied === "email" ? "Copied!" : "Copy Email"}
            </button>
          </>
        )}

        {activeTab === "note" && (
          <>
            <h2 className={styles.templateTitle}>Note Template</h2>
            <div className={styles.templateContent}>{generateNoteText()}</div>
            <button
              onClick={() => copyToClipboard("note")}
              className={`${styles.button} ${styles.buttonSuccess}`}
            >
              {isCopied === "note" ? "Copied!" : "Copy Note"}
            </button>
          </>
        )}
      </div>

      {/* Floating Toggle Button */}
      <div className={styles.floatingButtonContainer}>
        <button
          onClick={() => setShowRecordsPanel(!showRecordsPanel)}
          className={`${styles.toggleExcelButton} ${
            showRecordsPanel ? styles.active : ""
          }`}
          title={showRecordsPanel ? "Hide Records" : "Show Records"}
        >
          📊
          {savedRecords.length > 0 && (
            <span className={styles.badge}>{savedRecords.length}</span>
          )}
        </button>
      </div>

      {/* Records Panel */}
      <div
        className={`${styles.recordsPanel} ${
          showRecordsPanel ? styles.show : ""
        }`}
      >
        <div className={styles.panelHeader}>
          <h3>Saved Records ({savedRecords.length})</h3>
          <button
            onClick={() => setShowRecordsPanel(false)}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        {savedRecords.length > 0 ? (
          <>
            <button
              onClick={exportToExcel}
              className={`${styles.button} ${styles.buttonExport}`}
            >
              Export to Excel
            </button>
            <div className={styles.recordsTableContainer}>
              <table className={styles.recordsTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Case #</th>
                    <th>Applicant</th>
                    <th>Doctor</th>
                    <th>Interpreter</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.caseNumber}</td>
                      <td>{record.applicantName}</td>
                      <td>{record.doctorName}</td>
                      <td>{record.interpreterRequired ? "Yes" : "No"}</td>
                      <td className={styles.actionsCell}>
                        {/* <button
            onClick={() => handleEdit(record)}
            className={`${styles.button} ${styles.buttonEdit}`}
          >
            Edit
          </button> */}
                        <td className={styles.actionsCell}>
                          <button
                            onClick={() => {
                              setApplicantName(record.applicantName);
                              setDoctorName(record.doctorName);
                              setPhoneNumber(record.phoneNumber);
                              setContactPerson(record.contactPerson);
                              setContactEmail(record.contactEmail);
                              setCaseNumber(record.caseNumber);
                              setInterpreterRequired(
                                record.interpreterRequired
                              );
                              setViewingRecord(record);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className={`${styles.button} ${styles.buttonView}`}
                          >
                            View
                          </button>
                        </td>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className={styles.noRecords}>No records saved yet</p>
        )}
      </div>
    </div>
  );
}
