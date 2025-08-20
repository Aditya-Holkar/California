"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import styles from "../styles/Call.module.css";

interface CallRecord {
  id: string;
  date: string;
  callerType: string;
  officeName: string;
  personName: string;
  caseName: string;
  reason: string;
}

export default function Call() {
  const [callerType, setCallerType] = useState("DA");
  const [customCallerType, setCustomCallerType] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [personName, setPersonName] = useState("");
  const [caseName, setCaseName] = useState("");
  const [reason, setReason] = useState("");
  const [savedRecords, setSavedRecords] = useLocalStorage<CallRecord[]>(
    "callRecords",
    []
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showRecordsPanel, setShowRecordsPanel] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  useEffect(() => {
    const handleStorageChange = () => {
      const records = JSON.parse(localStorage.getItem("callRecords") || "[]");
      setSavedRecords(records);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("callRecordsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("callRecordsUpdated", handleStorageChange);
    };
  }, [setSavedRecords]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalCallerType =
      callerType === "Other" ? customCallerType : callerType;

    if (
      !finalCallerType ||
      !caseName ||
      !officeName ||
      !personName ||
      !reason
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (editingId) {
      // Update existing record
      const updatedRecords = savedRecords.map((record) =>
        record.id === editingId
          ? {
              ...record,
              callerType: finalCallerType,
              officeName,
              personName,
              caseName,
              reason,
            }
          : record
      );
      setSavedRecords(updatedRecords);
      setEditingId(null);
    } else {
      // Create new record
      const newRecord: CallRecord = {
        id: generateId(),
        date: new Date().toISOString().split("T")[0],
        callerType: finalCallerType,
        officeName,
        personName,
        caseName,
        reason,
      };

      setSavedRecords([...savedRecords, newRecord]);
    }

    resetForm();
  };

  const resetForm = () => {
    setCallerType("DA");
    setCustomCallerType("");
    setOfficeName("");
    setPersonName("");
    setCaseName("");
    setReason("");
    setEditingId(null);
  };

  const handleEdit = (record: CallRecord) => {
    // Check if the caller type is one of the standard options
    if (record.callerType === "DA" || record.callerType === "INS") {
      setCallerType(record.callerType);
      setCustomCallerType("");
    } else {
      setCallerType("Other");
      setCustomCallerType(record.callerType);
    }

    setOfficeName(record.officeName);
    setPersonName(record.personName);
    setCaseName(record.caseName);
    setReason(record.reason);
    setEditingId(record.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this record?")) {
      setSavedRecords(savedRecords.filter((record) => record.id !== id));
    }
  };

  const generateCallText = () => {
    const finalCallerType =
      callerType === "Other" ? customCallerType : callerType;
    return `Call Received From ${finalCallerType}(${officeName}) s/w ${personName} regarding case ${caseName} - ${reason}`;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Call Record</h1>

      <div className={styles.formPreviewContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="callerType" className={styles.label}>
              Caller Type *
            </label>
            <select
              id="callerType"
              value={callerType}
              onChange={(e) => setCallerType(e.target.value)}
              className={styles.select}
              required
            >
              <option value="DA">DA</option>
              <option value="INS">INS</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {callerType === "Other" && (
            <div className={styles.formGroup}>
              <label htmlFor="customCallerType" className={styles.label}>
                Specify Caller Type *
              </label>
              <input
                id="customCallerType"
                type="text"
                value={customCallerType}
                onChange={(e) => setCustomCallerType(e.target.value)}
                className={styles.input}
                required={callerType === "Other"}
                placeholder="Enter caller type"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="officeName" className={styles.label}>
              Office Name *
            </label>
            <input
              id="officeName"
              type="text"
              value={officeName}
              onChange={(e) => setOfficeName(e.target.value)}
              className={styles.input}
              required
              placeholder="Enter office name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="personName" className={styles.label}>
              Person Name *
            </label>
            <input
              id="personName"
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className={styles.input}
              required
              placeholder="Enter person name"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="caseName" className={styles.label}>
              Case Name/Number *
            </label>
            <input
              id="caseName"
              type="text"
              value={caseName}
              onChange={(e) => setCaseName(e.target.value)}
              className={styles.input}
              required
              placeholder="Enter case name/number"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="reason" className={styles.label}>
              Reason for Call *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={styles.textarea}
              required
              rows={4}
              placeholder="Enter reason for the call"
            />
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {editingId ? "Update Record" : "Save Record"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className={`${styles.button} ${styles.buttonCancel}`}
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className={styles.previewSection}>
          <h2 className={styles.templateTitle}>Call Record Preview</h2>
          <div className={styles.templateContent}>{generateCallText()}</div>
          <button
            onClick={() => navigator.clipboard.writeText(generateCallText())}
            className={`${styles.button} ${styles.buttonSuccess}`}
          >
            Copy to Clipboard
          </button>
        </div>
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
          📞
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
          <h3>Saved Call Records ({savedRecords.length})</h3>
          <button
            onClick={() => setShowRecordsPanel(false)}
            className={styles.closeButton}
          >
            ×
          </button>
        </div>

        {savedRecords.length > 0 ? (
          <div className={styles.recordsTableContainer}>
            <table className={styles.recordsTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Caller</th>
                  <th>Office</th>
                  <th>Person</th>
                  <th>Case</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td>{record.callerType}</td>
                    <td>{record.officeName}</td>
                    <td>{record.personName}</td>
                    <td>{record.caseName}</td>
                    <td className={styles.actionsCell}>
                      <button
                        onClick={() => handleEdit(record)}
                        className={`${styles.button} ${styles.buttonEdit}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className={`${styles.button} ${styles.buttonDelete}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.noRecords}>No call records saved yet</p>
        )}
      </div>
    </div>
  );
}
