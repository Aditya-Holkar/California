/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/dashboard/QMEDashboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "../styles/QMEdash.module.css";

interface QMECase {
  [key: string]: string;
}

interface QMEDashboardClientProps {
  initialData: QMECase[];
  initialError?: string;
  sheetUrl: string;
}

export default function QMEDashboardClient({
  initialData,
  initialError,
  sheetUrl: initialSheetUrl,
}: QMEDashboardClientProps) {
  const [cases, setCases] = useState<QMECase[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sheetUrl, setSheetUrl] = useState<string>(initialSheetUrl);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem("qme-sheet-url");
    if (savedUrl && !initialSheetUrl) {
      setSheetUrl(savedUrl);
      fetchQMEData(savedUrl);
    } else if (!initialSheetUrl) {
      setIsUrlModalOpen(true);
    }
  }, [initialSheetUrl]);

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

      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const text = await response.text();
      let result;

      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError, "Response text:", text);
        throw new Error("Invalid response from server. Please try again.");
      }

      if (result.error) {
        throw new Error(result.error);
      }

      setCases(result.data || []);
      setLastSynced(new Date());

      if (!url) {
        localStorage.setItem("qme-sheet-url", targetUrl);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(
        err.message ||
          "Failed to fetch QME data. Please check your connection and try again."
      );

      if (url) {
        localStorage.removeItem("qme-sheet-url");
        setSheetUrl("");
      }
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
      setIsUrlModalOpen(true);
    }
  };

  const filteredCases = cases.filter((caseItem) => {
    const searchableText = [
      caseItem["Case Name"] || "",
      caseItem["Applicant Name"] || "",
      caseItem["ADJ #"] || "",
      caseItem["Claim #"] || "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

    const status = caseItem["QME Status"] || "";
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
    try {
      const due = new Date(dueDate);
      const today = new Date();
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= days && diffDays >= 0;
    } catch {
      return false;
    }
  };

  const isDeadlinePassed = (dueDate: string) => {
    if (!dueDate) return false;
    try {
      const due = new Date(dueDate);
      const today = new Date();
      return due < today;
    } catch {
      return false;
    }
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
                  cases.filter((c) => c["QME Status"] === "Awaiting QME Report")
                    .length
                }
              </span>
            </div>
            <div className={styles.statCard}>
              <h3>Scheduled</h3>
              <span className={styles.statNumber}>
                {
                  cases.filter((c) => c["QME Status"] === "QME Scheduled")
                    .length
                }
              </span>
            </div>
            <div className={styles.statCard}>
              <h3>Urgent Deadlines</h3>
              <span className={`${styles.statNumber} ${styles.urgent}`}>
                {
                  cases.filter(
                    (c) =>
                      isDeadlineApproaching(c["Strike Deadline"]) ||
                      isDeadlineApproaching(c["QME Report Due Date"]) ||
                      isDeadlinePassed(c["Strike Deadline"]) ||
                      isDeadlinePassed(c["QME Report Due Date"])
                  ).length
                }
              </span>
            </div>
          </div>

          <div className={styles.casesTableContainer}>
            <table className={styles.casesTable}>
              <thead>
                <tr>
                  <th>Case Name</th>
                  <th>ADJ #</th>
                  <th>Claim #</th>
                  <th>DOI</th>
                  <th>Applicant Name</th>
                  <th>QME Doctor Name</th>
                  <th>QME Specialty</th>
                  <th>Strike Deadline</th>
                  <th>QME Scheduled Date</th>
                  <th>QME Report Due Date</th>
                  <th>QME Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((caseItem, index) => (
                  <tr key={index} className={styles.caseRow}>
                    <td className={styles.caseName}>{caseItem["Case Name"]}</td>
                    <td className={styles.adjNumber}>{caseItem["ADJ #"]}</td>
                    <td>{caseItem["Claim #"]}</td>
                    <td>{caseItem["DOI"]}</td>
                    <td className={styles.applicantName}>
                      {caseItem["Applicant Name"]}
                    </td>
                    <td className={styles.doctorName}>
                      {caseItem["QME Doctor Name"]}
                    </td>
                    <td className={styles.specialty}>
                      {caseItem["QME Specialty"]}
                    </td>
                    <td
                      className={`${styles.deadline} ${
                        isDeadlinePassed(caseItem["Strike Deadline"])
                          ? styles.deadlinePassed
                          : isDeadlineApproaching(caseItem["Strike Deadline"])
                          ? styles.deadlineApproaching
                          : ""
                      }`}
                    >
                      {caseItem["Strike Deadline"]}
                    </td>
                    <td className={styles.qmeDate}>
                      {caseItem["QME Scheduled Date"]}
                    </td>
                    <td
                      className={`${styles.reportDue} ${
                        isDeadlinePassed(caseItem["QME Report Due Date"])
                          ? styles.deadlinePassed
                          : isDeadlineApproaching(
                              caseItem["QME Report Due Date"]
                            )
                          ? styles.deadlineApproaching
                          : ""
                      }`}
                    >
                      {caseItem["QME Report Due Date"]}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusBadgeClass(
                          caseItem["QME Status"]
                        )}`}
                      >
                        {caseItem["QME Status"] || "No Status"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCases.length === 0 && cases.length > 0 && (
              <div className={styles.noResults}>
                No cases found matching your criteria.
              </div>
            )}

            {cases.length === 0 && !loading && (
              <div className={styles.noResults}>
                No data found in the connected sheet. Please check if your sheet
                has data and is properly formatted.
              </div>
            )}
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
