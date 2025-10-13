/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import styles from "../../styles/QMEdash.module.css";

interface QMECase {
  id: string;
  "Case Name": string;
  "ADJ #": string;
  "Claim #": string;
  DOI: string;
  "Applicant Name": string;
  "QME Doctor Name": string;
  "QME Specialty": string;
  "DWC 105 Received": string;
  "Panel Request Due": string;
  "Panel Issued Date": string;
  "Strike Deadline": string;
  "QME Scheduled Date": string;
  "Advocacy Letter Sent": string;
  "QME Exam Date": string;
  "QME Report Due Date": string;
  "QME Status": string;
  // Add index signature to fix TypeScript error
  [key: string]: string;
}

const initialCases: QMECase[] = [
  //   {
  //     id: "1",
  //     "Case Name": "Sanchez v. Premium Logistics",
  //     "ADJ #": "ADJ1234567",
  //     "Claim #": "WCK-98765",
  //     DOI: "05/12/2022",
  //     "Applicant Name": "Maria Sanchez",
  //     "QME Doctor Name": "Dr. Robert Chang",
  //     "QME Specialty": "Orthopedic Surgery",
  //     "DWC 105 Received": "04/01/2024",
  //     "Panel Request Due": "04/11/2024",
  //     "Panel Issued Date": "04/15/2024",
  //     "Strike Deadline": "04/25/2024",
  //     "QME Scheduled Date": "06/15/2024",
  //     "Advocacy Letter Sent": "06/01/2024",
  //     "QME Exam Date": "06/15/2024",
  //     "QME Report Due Date": "07/15/2024",
  //     "QME Status": "QME Scheduled",
  //   },
  //   {
  //     id: "2",
  //     "Case Name": "Smith v. City Hotel & Spa",
  //     "ADJ #": "ADJ7654321",
  //     "Claim #": "WCK-55544",
  //     DOI: "11/05/2023",
  //     "Applicant Name": "James Smith",
  //     "QME Doctor Name": "Dr. Amanda Lee",
  //     "QME Specialty": "Psychiatry",
  //     "DWC 105 Received": "04/15/2024",
  //     "Panel Request Due": "04/25/2024",
  //     "Panel Issued Date": "05/01/2024",
  //     "Strike Deadline": "05/11/2024",
  //     "QME Scheduled Date": "",
  //     "Advocacy Letter Sent": "",
  //     "QME Exam Date": "",
  //     "QME Report Due Date": "07/01/2024",
  //     "QME Status": "Awaiting QME Report",
  //   },
];

export default function QMEDashboard() {
  const [cases, setCases] = useState<QMECase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCase, setEditingCase] = useState<QMECase | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedCases = localStorage.getItem("qme-cases");
    if (savedCases) {
      setCases(JSON.parse(savedCases));
    } else {
      // Initialize with sample data
      setCases(initialCases);
      localStorage.setItem("qme-cases", JSON.stringify(initialCases));
    }
    setLoading(false);
  }, []);

  // Save to localStorage whenever cases change
  useEffect(() => {
    if (cases.length > 0) {
      localStorage.setItem("qme-cases", JSON.stringify(cases));
    }
  }, [cases]);

  const handleSaveCase = (updatedCase: QMECase) => {
    if (isAddingNew) {
      const newCase = { ...updatedCase, id: Date.now().toString() };
      setCases((prev) => [...prev, newCase]);
      setIsAddingNew(false);
    } else {
      setCases((prev) =>
        prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
      );
      setEditingCase(null);
    }
  };

  const handleDeleteCase = (id: string) => {
    if (confirm("Are you sure you want to delete this case?")) {
      setCases((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleAddNew = () => {
    const newEmptyCase: QMECase = {
      id: "",
      "Case Name": "",
      "ADJ #": "",
      "Claim #": "",
      DOI: "",
      "Applicant Name": "",
      "QME Doctor Name": "",
      "QME Specialty": "",
      "DWC 105 Received": "",
      "Panel Request Due": "",
      "Panel Issued Date": "",
      "Strike Deadline": "",
      "QME Scheduled Date": "",
      "Advocacy Letter Sent": "",
      "QME Exam Date": "",
      "QME Report Due Date": "",
      "QME Status": "QME Panel Formed",
    };
    setEditingCase(newEmptyCase);
    setIsAddingNew(true);
  };

  const handleExportCSV = () => {
    const headers = [
      "Case Name",
      "ADJ #",
      "Claim #",
      "DOI",
      "Applicant Name",
      "QME Doctor Name",
      "QME Specialty",
      "DWC 105 Received",
      "Panel Request Due",
      "Panel Issued Date",
      "Strike Deadline",
      "QME Scheduled Date",
      "Advocacy Letter Sent",
      "QME Exam Date",
      "QME Report Due Date",
      "QME Status",
    ];

    const csvContent = [
      headers.join(","),
      ...cases.map((caseItem) =>
        headers.map((header) => `"${caseItem[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qme-cases-export.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const lines = csvText.split("\n");
      const headers = lines[0]
        .split(",")
        .map((h) => h.replace(/"/g, "").trim());

      const importedCases: QMECase[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i]
            .split(",")
            .map((v) => v.replace(/"/g, "").trim());
          const caseItem: any = { id: Date.now().toString() + i };
          headers.forEach((header, index) => {
            caseItem[header] = values[index] || "";
          });
          importedCases.push(caseItem as QMECase);
        }
      }

      if (importedCases.length > 0) {
        setCases(importedCases);
        alert(`Successfully imported ${importedCases.length} cases`);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset file input
  };

  const filteredCases = cases.filter((caseItem) => {
    const searchableText = [
      caseItem["Case Name"],
      caseItem["Applicant Name"],
      caseItem["ADJ #"],
      caseItem["Claim #"],
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || caseItem["QME Status"] === filterStatus;

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

  if (loading) {
    return <div className={styles.loading}>Loading QME Dashboard...</div>;
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Edit/Add Case Modal */}
      {(editingCase || isAddingNew) && (
        <EditCaseModal
          caseItem={editingCase}
          onSave={handleSaveCase}
          onCancel={() => {
            setEditingCase(null);
            setIsAddingNew(false);
          }}
          isAdding={isAddingNew}
        />
      )}

      <header className={styles.dashboardHeader}>
        <div className={styles.headerLeft}>
          <h1>QME Case Tracking Dashboard</h1>
          <div className={styles.syncInfo}>
            {cases.length} cases • Data stored locally in your browser
          </div>
        </div>

        <div className={styles.headerActions}>
          <button onClick={handleAddNew} className={styles.addButton}>
            + Add New Case
          </button>
          <button onClick={handleExportCSV} className={styles.exportButton}>
            Export CSV
          </button>
          <label className={styles.importButton}>
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </header>

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
            {cases.filter((c) => c["QME Status"] === "QME Scheduled").length}
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
              <th>Applicant</th>
              <th>QME Doctor</th>
              <th>Specialty</th>
              <th>Strike Deadline</th>
              <th>QME Date</th>
              <th>Report Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((caseItem) => (
              <tr key={caseItem.id} className={styles.caseRow}>
                <td className={styles.caseName}>{caseItem["Case Name"]}</td>
                <td className={styles.adjNumber}>{caseItem["ADJ #"]}</td>
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
                      : isDeadlineApproaching(caseItem["QME Report Due Date"])
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
                    {caseItem["QME Status"]}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button
                    onClick={() => setEditingCase(caseItem)}
                    className={styles.editButton}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCase(caseItem.id)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
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

        {cases.length === 0 && (
          <div className={styles.noResults}>
            No cases found. Click "Add New Case" to get started.
          </div>
        )}
      </div>
    </div>
  );
}

// Edit Case Modal Component
function EditCaseModal({
  caseItem,
  onSave,
  onCancel,
  isAdding,
}: {
  caseItem: QMECase | null;
  onSave: (caseItem: QMECase) => void;
  onCancel: () => void;
  isAdding: boolean;
}) {
  const [formData, setFormData] = useState<QMECase>(
    caseItem || ({} as QMECase)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof QMECase, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>{isAdding ? "Add New Case" : "Edit Case"}</h2>

        <form onSubmit={handleSubmit} className={styles.caseForm}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Case Name *</label>
              <input
                type="text"
                value={formData["Case Name"] || ""}
                onChange={(e) => handleChange("Case Name", e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>ADJ # *</label>
              <input
                type="text"
                value={formData["ADJ #"] || ""}
                onChange={(e) => handleChange("ADJ #", e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Claim #</label>
              <input
                type="text"
                value={formData["Claim #"] || ""}
                onChange={(e) => handleChange("Claim #", e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>DOI</label>
              <input
                type="date"
                value={formData["DOI"] || ""}
                onChange={(e) => handleChange("DOI", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Applicant Name *</label>
              <input
                type="text"
                value={formData["Applicant Name"] || ""}
                onChange={(e) => handleChange("Applicant Name", e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>QME Doctor Name</label>
              <input
                type="text"
                value={formData["QME Doctor Name"] || ""}
                onChange={(e) =>
                  handleChange("QME Doctor Name", e.target.value)
                }
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>QME Specialty</label>
              <select
                value={formData["QME Specialty"] || ""}
                onChange={(e) => handleChange("QME Specialty", e.target.value)}
              >
                <option value="">Select Specialty</option>
                <option value="Orthopedic Surgery">Orthopedic Surgery</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Neurology">Neurology</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Pain Management">Pain Management</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>QME Status</label>
              <select
                value={formData["QME Status"] || ""}
                onChange={(e) => handleChange("QME Status", e.target.value)}
              >
                <option value="QME Panel Formed">QME Panel Formed</option>
                <option value="QME Scheduled">QME Scheduled</option>
                <option value="Awaiting QME Report">Awaiting QME Report</option>
                <option value="Report Received">Report Received</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Strike Deadline</label>
              <input
                type="date"
                value={formData["Strike Deadline"] || ""}
                onChange={(e) =>
                  handleChange("Strike Deadline", e.target.value)
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label>QME Scheduled Date</label>
              <input
                type="date"
                value={formData["QME Scheduled Date"] || ""}
                onChange={(e) =>
                  handleChange("QME Scheduled Date", e.target.value)
                }
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>QME Report Due Date</label>
              <input
                type="date"
                value={formData["QME Report Due Date"] || ""}
                onChange={(e) =>
                  handleChange("QME Report Due Date", e.target.value)
                }
              />
            </div>
            <div className={styles.formGroup}>
              <label>Panel Issued Date</label>
              <input
                type="date"
                value={formData["Panel Issued Date"] || ""}
                onChange={(e) =>
                  handleChange("Panel Issued Date", e.target.value)
                }
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              {isAdding ? "Add Case" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
