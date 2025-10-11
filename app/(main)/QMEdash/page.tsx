/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "../../styles/QMEdash.module.css";

interface QMECase {
  [key: string]: string; // Dynamic keys to handle any column names
  //   CaseName?: string;
  //   ADJ?: string;
  //   ApplicantName?: string;
  //   QMEDoctorName?: string;
  //   QMESpecialty?: string;
  //   StrikeDeadline?: string;
  //   QMEScheduledDate?: string;
  //   QMEReportDueDate?: string;
  //   QMEStatus?: string;
}

export default function QMEDashboard() {
  const [cases, setCases] = useState<QMECase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sheetUrl, setSheetUrl] = useState<string>("");
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Load saved sheet URL on component mount
  useEffect(() => {
    const savedUrl = localStorage.getItem("qme-sheet-url");
    if (savedUrl) {
      setSheetUrl(savedUrl);
      fetchQMEData(savedUrl);
    } else {
      setLoading(false);
      setIsUrlModalOpen(true);
    }
  }, []);

  const fetchQMEData = async (url?: string) => {
    const targetUrl = url || sheetUrl;
    if (!targetUrl) {
      setError("Please provide a Google Sheets URL");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/qme-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sheetUrl: targetUrl }),
      });

      const result = await response.json();

      if (response.ok) {
        setCases(result.data);
        setDebugInfo({
          headers: result.headers,
          sampleRow: result.sampleRow,
          message: result.message,
        });
        setLastSynced(new Date());

        // Save the URL if this is a new successful connection
        if (!url) {
          localStorage.setItem("qme-sheet-url", targetUrl);
        }
      } else {
        setError(result.error);
        if (url) {
          localStorage.removeItem("qme-sheet-url");
          setSheetUrl("");
        }
      }
    } catch (err) {
      setError(
        "Failed to fetch QME data. Please check your connection and try again."
      );
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setIsSynchronizing(false);
    }
  };

  const handleSaveUrl = () => {
    if (!sheetUrl.trim()) {
      setError("Please enter a valid Google Sheets URL");
      return;
    }
    fetchQMEData(sheetUrl);
    setIsUrlModalOpen(false);
  };

  const handleSynchronize = () => {
    setIsSynchronizing(true);
    fetchQMEData();
  };

  const handleClearData = () => {
    if (
      confirm(
        "Are you sure you want to clear all data and remove the saved sheet URL?"
      )
    ) {
      localStorage.removeItem("qme-sheet-url");
      setSheetUrl("");
      setCases([]);
      setLastSynced(null);
      setDebugInfo(null);
      setIsUrlModalOpen(true);
    }
  };

  // Helper function to get value by possible column names
  const getCaseValue = (caseItem: QMECase, possibleKeys: string[]): string => {
    for (const key of possibleKeys) {
      if (caseItem[key] && caseItem[key].trim() !== "") {
        return caseItem[key];
      }
    }
    return "";
  };

  const filteredCases = cases.filter((caseItem) => {
    const searchableText = [
      getCaseValue(caseItem, ["CaseName", "Case Name", "Case"]),
      getCaseValue(caseItem, ["ApplicantName", "Applicant", "Applicant Name"]),
      getCaseValue(caseItem, ["ADJ", "ADJ Number", "ADJ#"]),
      getCaseValue(caseItem, ["Claim", "Claim Number", "Claim#"]),
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

    const status = getCaseValue(caseItem, [
      "QMEStatus",
      "Status",
      "Current Status",
    ]);
    const matchesStatus = filterStatus === "all" || status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "QME Scheduled":
        return styles.statusScheduled;
      case "Awaiting QME Report":
        return styles.statusAwaiting;
      case "Report Received":
        return styles.statusReceived;
      case "QME Panel Formed":
        return styles.statusPanelFormed;
      default:
        return styles.statusDefault;
    }
  };

  const isDeadlineApproaching = (dueDate: string, days: number = 3) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays >= 0;
  };

  const getAllColumns = (cases: QMECase[]): string[] => {
    if (cases.length === 0) return [];
    const allKeys = new Set<string>();
    cases.forEach((caseItem) => {
      Object.keys(caseItem).forEach((key) => {
        allKeys.add(key);
      });
    });
    return Array.from(allKeys);
  };

  const isDeadlinePassed = (dueDate: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    return due < today;
  };

  // Auto-sync every 5 minutes if we have data
  useEffect(() => {
    if (cases.length > 0 && sheetUrl) {
      const interval = setInterval(() => {
        fetchQMEData();
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [cases.length, sheetUrl]);

  return (
    <div className={styles.dashboardContainer}>
      {/* URL Input Modal */}
      {isUrlModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Connect Google Sheets</h2>
            <p>Enter your Google Sheets URL to load QME data:</p>

            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className={styles.urlInput}
            />

            <div className={styles.modalActions}>
              <button onClick={handleSaveUrl} className={styles.saveButton}>
                Connect & Load Data
              </button>
            </div>

            <div className={styles.helpText}>
              <p>
                <strong>How to get your sheet URL:</strong>
              </p>
              <ol>
                <li>Open your Google Sheet</li>
                <li>Click "Share" → "Publish to web"</li>
                <li>Choose "Sheet1" and "CSV" format</li>
                <li>Copy the URL from your browser address bar</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      <header className={styles.dashboardHeader}>
        <div className={styles.headerLeft}>
          <h1>QME Case Tracking Dashboard</h1>
          {lastSynced && (
            <div className={styles.syncInfo}>
              Last synced: {lastSynced.toLocaleTimeString()}
              {isSynchronizing && (
                <span className={styles.syncingIndicator}>Syncing...</span>
              )}
            </div>
          )}
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={handleSynchronize}
            className={styles.syncButton}
            disabled={isSynchronizing || !sheetUrl}
          >
            {isSynchronizing ? "Syncing..." : "Sync Now"}
          </button>

          <button
            onClick={() => setIsUrlModalOpen(true)}
            className={styles.changeUrlButton}
          >
            Change Sheet
          </button>

          <button onClick={handleClearData} className={styles.clearButton}>
            Clear Data
          </button>
        </div>
      </header>

      {!sheetUrl ? (
        <div className={styles.emptyState}>
          <h2>No Google Sheet Connected</h2>
          <p>Please connect a Google Sheet to start tracking QME cases.</p>
          <button
            onClick={() => setIsUrlModalOpen(true)}
            className={styles.connectButton}
          >
            Connect Google Sheet
          </button>
        </div>
      ) : (
        <>
          {/* Debug Information - Remove this section once everything works */}
          {debugInfo && (
            <div className={styles.debugInfo}>
              <details>
                <summary>
                  Debug Info (Click to view your sheet structure)
                </summary>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </details>
            </div>
          )}

          <div className={styles.dashboardControls}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="Search cases, applicants, or ADJ#..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>

            <div className={styles.filterGroup}>
              <label>Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className={styles.statusFilter}
              >
                <option value="all">All Statuses</option>
                <option value="QME Panel Formed">QME Panel Formed</option>
                <option value="QME Scheduled">QME Scheduled</option>
                <option value="Awaiting QME Report">Awaiting Report</option>
                <option value="Report Received">Report Received</option>
              </select>
            </div>
          </div>

          <div className={styles.statsOverview}>
            <div className={styles.statCard}>
              <h3>Total Cases</h3>
              <span className={styles.statNumber}>{cases.length}</span>
            </div>
            <div className={styles.statCard}>
              <h3>Awaiting Report</h3>
              <span className={styles.statNumber}>
                {
                  cases.filter(
                    (c) =>
                      getCaseValue(c, ["QMEStatus", "Status"]) ===
                      "Awaiting QME Report"
                  ).length
                }
              </span>
            </div>
            <div className={styles.statCard}>
              <h3>Scheduled</h3>
              <span className={styles.statNumber}>
                {
                  cases.filter(
                    (c) =>
                      getCaseValue(c, ["QMEStatus", "Status"]) ===
                      "QME Scheduled"
                  ).length
                }
              </span>
            </div>
            <div className={styles.statCard}>
              <h3>Urgent Deadlines</h3>
              <span className={`${styles.statNumber} ${styles.urgent}`}>
                {
                  cases.filter((c) => {
                    const strikeDeadline = getCaseValue(c, [
                      "StrikeDeadline",
                      "Strike Deadline",
                    ]);
                    const reportDue = getCaseValue(c, [
                      "QMEReportDueDate",
                      "Report Due Date",
                    ]);
                    return (
                      isDeadlineApproaching(strikeDeadline) ||
                      isDeadlineApproaching(reportDue) ||
                      isDeadlinePassed(strikeDeadline) ||
                      isDeadlinePassed(reportDue)
                    );
                  }).length
                }
              </span>
            </div>
          </div>

          {/* // Then replace your entire table with: */}
          <div className={styles.casesTableContainer}>
            <table className={styles.casesTable}>
              <thead>
                <tr>
                  {getAllColumns(cases).map((column) => (
                    <th key={column}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((caseItem, index) => (
                  <tr key={index} className={styles.caseRow}>
                    {getAllColumns(cases).map((column) => (
                      <td key={column}>{caseItem[column] || ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {loading && cases.length === 0 && (
        <div className={styles.loading}>Loading QME Dashboard...</div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
          <button
            onClick={() => setIsUrlModalOpen(true)}
            className={styles.retryButton}
          >
            Reconnect Sheet
          </button>
        </div>
      )}
    </div>
  );
}
