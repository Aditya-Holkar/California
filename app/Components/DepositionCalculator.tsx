/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import styles from "../styles/DepositionCalculator.module.css";

interface TimeEntry {
  id: string;
  description: string;
  inputMode: "time" | "decimal"; // Time range or decimal hours
  startTime: string;
  endTime: string;
  decimalHours: number;
  duration: number; // in minutes
}

interface DepositionBill {
  id: string;
  applicantName: string;
  caseName: string;
  caseNumber: string;
  dateCreated: string;
  rateType: "minute" | "hour";
  rate: number;
  entries: TimeEntry[];
}

const DepositionCalculator: React.FC = () => {
  const [rateType, setRateType] = useState<"minute" | "hour">("minute");
  const [rate, setRate] = useState<number>(100);
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  // Case information
  const [applicantName, setApplicantName] = useState("");
  const [caseName, setCaseName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");

  // View saved bills
  const [showSavedBills, setShowSavedBills] = useState(false);
  const [savedBills, setSavedBills] = useState<DepositionBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<DepositionBill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSavedBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [searchQuery, savedBills]);

  const loadSavedBills = () => {
    const bills: DepositionBill[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith("depo_bill_")) {
        const bill = JSON.parse(localStorage.getItem(key) || "{}");
        bills.push(bill);
      }
    }
    const sortedBills = bills.sort(
      (a, b) =>
        new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );
    setSavedBills(sortedBills);
    setFilteredBills(sortedBills);
  };

  const filterBills = () => {
    if (!searchQuery.trim()) {
      setFilteredBills(savedBills);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = savedBills.filter(
      (bill) =>
        bill.applicantName.toLowerCase().includes(query) ||
        bill.caseName.toLowerCase().includes(query) ||
        bill.caseNumber.toLowerCase().includes(query)
    );
    setFilteredBills(filtered);
  };

  const toggleBillSelection = (billId: string) => {
    const newSelected = new Set(selectedBills);
    if (newSelected.has(billId)) {
      newSelected.delete(billId);
    } else {
      newSelected.add(billId);
    }
    setSelectedBills(newSelected);
  };

  const selectAllBills = () => {
    if (selectedBills.size === filteredBills.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(filteredBills.map((b) => b.id)));
    }
  };

  const exportSelectedBillsToExcel = () => {
    const billsToExport = savedBills.filter((bill) =>
      selectedBills.has(bill.id)
    );

    if (billsToExport.length === 0) {
      alert("Please select at least one bill to export.");
      return;
    }

    // Create CSV with all bills in rows
    let csv = "WCAB Deposition Bills Export\n";
    csv += `Export Date:,${new Date().toLocaleDateString()}\n`;
    csv += `Total Bills:,${billsToExport.length}\n\n`;

    // Headers for the consolidated view
    csv +=
      "Bill #,Applicant Name,Case Name,Case Number,Date Created,Entry #,Description,Input Mode,Start/Hours,End Time,Duration (min),Duration (hrs),Rate Type,Rate Amount,Entry Amount,Bill Total\n";

    // Process each bill
    billsToExport.forEach((bill, billIndex) => {
      const billTotal = bill.entries.reduce((sum, entry) => {
        const amount =
          bill.rateType === "minute"
            ? entry.duration * bill.rate
            : (entry.duration / 60) * bill.rate;
        return sum + amount;
      }, 0);

      bill.entries.forEach((entry, entryIndex) => {
        const amount = (
          bill.rateType === "minute"
            ? entry.duration * bill.rate
            : (entry.duration / 60) * bill.rate
        ).toFixed(2);
        const startCol =
          entry.inputMode === "time"
            ? entry.startTime
            : entry.decimalHours.toString();
        const endCol = entry.inputMode === "time" ? entry.endTime : "-";
        const inputModeText =
          entry.inputMode === "time" ? "Time Range" : "Decimal Hours";

        csv += `${billIndex + 1},`;
        csv += `"${bill.applicantName}",`;
        csv += `"${bill.caseName}",`;
        csv += `"${bill.caseNumber || "N/A"}",`;
        csv += `${new Date(bill.dateCreated).toLocaleDateString()},`;
        csv += `${entryIndex + 1},`;
        csv += `"${entry.description}",`;
        csv += `${inputModeText},`;
        csv += `${startCol},`;
        csv += `${endCol},`;
        csv += `${entry.duration},`;
        csv += `${(entry.duration / 60).toFixed(2)},`;
        csv += `${bill.rateType === "minute" ? "$/min" : "$/hr"},`;
        csv += `${bill.rate.toFixed(2)},`;
        csv += `${amount},`;
        csv += `${billTotal.toFixed(2)}\n`;
      });

      // Add a blank row between bills for readability
      csv += "\n";
    });

    // Summary section
    csv += "\n\nSUMMARY\n";
    csv +=
      "Bill #,Applicant Name,Case Name,Total Entries,Total Duration (min),Total Duration (hrs),Total Amount\n";

    billsToExport.forEach((bill, index) => {
      const totalMinutes = bill.entries.reduce(
        (sum, entry) => sum + entry.duration,
        0
      );
      const totalAmount =
        bill.rateType === "minute"
          ? totalMinutes * bill.rate
          : (totalMinutes / 60) * bill.rate;

      csv += `${index + 1},"${bill.applicantName}","${bill.caseName}",${
        bill.entries.length
      },${totalMinutes},${(totalMinutes / 60).toFixed(2)},${totalAmount.toFixed(
        2
      )}\n`;
    });

    // Grand total
    const grandTotalMinutes = billsToExport.reduce(
      (sum, bill) => sum + bill.entries.reduce((s, e) => s + e.duration, 0),
      0
    );
    const grandTotalAmount = billsToExport.reduce((sum, bill) => {
      const billTotal = bill.entries.reduce((s, entry) => {
        return (
          s +
          (bill.rateType === "minute"
            ? entry.duration * bill.rate
            : (entry.duration / 60) * bill.rate)
        );
      }, 0);
      return sum + billTotal;
    }, 0);

    csv += `\nGRAND TOTAL,,,${billsToExport.reduce(
      (sum, b) => sum + b.entries.length,
      0
    )},${grandTotalMinutes},${(grandTotalMinutes / 60).toFixed(
      2
    )},${grandTotalAmount.toFixed(2)}\n`;

    // Create and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `WCAB_Bills_Export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`${billsToExport.length} bill(s) exported successfully!`);
  };

  const isValidTimeFormat = (time: string): boolean => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
    return timeRegex.test(time.trim());
  };

  const formatTimeTo24Hour = (time12h: string) => {
    const cleaned = time12h.trim();
    const [time, period] = cleaned.split(/\s+/);
    let [hours, minutes] = time.split(":").map(Number);

    if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
    else if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateDuration = (start: string, end: string): number => {
    try {
      if (!isValidTimeFormat(start) || !isValidTimeFormat(end)) return 0;

      const start24h = formatTimeTo24Hour(start);
      const end24h = formatTimeTo24Hour(end);

      const [startHours, startMinutes] = start24h.split(":").map(Number);
      const [endHours, endMinutes] = end24h.split(":").map(Number);

      let totalMinutes =
        endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
      if (totalMinutes < 0) totalMinutes += 24 * 60;

      return totalMinutes;
    } catch {
      return 0;
    }
  };

  const decimalToMinutes = (decimal: number): number => {
    return Math.round(decimal * 60);
  };

  const addNewEntry = () => {
    const newEntry: TimeEntry = {
      id: `entry-${Date.now()}`,
      description: "",
      inputMode: "time",
      startTime: "9:00 AM",
      endTime: "10:00 AM",
      decimalHours: 1.0,
      duration: 60,
    };
    setEntries([...entries, newEntry]);
  };

  const updateEntry = (
    id: string,
    field: keyof TimeEntry,
    value: string | number
  ) => {
    setEntries(
      entries.map((entry) => {
        if (entry.id === id) {
          const updated = { ...entry, [field]: value };

          // Recalculate duration based on input mode
          if (field === "startTime" || field === "endTime") {
            updated.duration = calculateDuration(
              field === "startTime" ? (value as string) : entry.startTime,
              field === "endTime" ? (value as string) : entry.endTime
            );
          } else if (field === "decimalHours") {
            updated.duration = decimalToMinutes(value as number);
          } else if (field === "inputMode") {
            // When switching modes, recalculate duration
            if (value === "time") {
              updated.duration = calculateDuration(
                entry.startTime,
                entry.endTime
              );
            } else {
              updated.duration = decimalToMinutes(entry.decimalHours);
            }
          }

          return updated;
        }
        return entry;
      })
    );
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const totalMinutes = entries.reduce((sum, entry) => sum + entry.duration, 0);
  const totalAmount =
    rateType === "minute" ? totalMinutes * rate : (totalMinutes / 60) * rate;

  const saveBill = () => {
    if (!applicantName.trim() || !caseName.trim()) {
      alert("Please enter Applicant Name and Case Name before saving.");
      return;
    }

    const bill: DepositionBill = {
      id: editingBillId || `depo_bill_${Date.now()}`,
      applicantName,
      caseName,
      caseNumber,
      dateCreated: editingBillId
        ? savedBills.find((b) => b.id === editingBillId)?.dateCreated ||
          new Date().toISOString()
        : new Date().toISOString(),
      rateType,
      rate,
      entries: [...entries],
    };

    localStorage.setItem(bill.id, JSON.stringify(bill));
    alert("Bill saved successfully!");
    loadSavedBills();
    setEditingBillId(null);
  };

  const loadBill = (bill: DepositionBill) => {
    setApplicantName(bill.applicantName);
    setCaseName(bill.caseName);
    setCaseNumber(bill.caseNumber);
    setRateType(bill.rateType);
    setRate(bill.rate);
    setEntries(bill.entries);
    setEditingBillId(bill.id);
    setShowSavedBills(false);
  };

  const deleteBill = (id: string) => {
    if (confirm("Are you sure you want to delete this bill?")) {
      localStorage.removeItem(id);
      loadSavedBills();
    }
  };

  const newBill = () => {
    setApplicantName("");
    setCaseName("");
    setCaseNumber("");
    setEntries([]);
    setEditingBillId(null);
  };

  const copyTableToClipboard = () => {
    // Create a clean HTML table for Word
    let htmlTable = `
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <thead>
          <tr style="background-color: #667eea; color: white;">
            <th style="text-align: center; padding: 12px;">#</th>
            <th style="text-align: left; padding: 12px;">Description</th>
            <th style="text-align: left; padding: 12px;">Input Mode</th>
            <th style="text-align: left; padding: 12px;">Start/Hours</th>
            <th style="text-align: left; padding: 12px;">End</th>
            <th style="text-align: center; padding: 12px;">Duration</th>
            <th style="text-align: right; padding: 12px;">Amount</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Add data rows
    entries.forEach((entry, index) => {
      const amount = (
        rateType === "minute"
          ? entry.duration * rate
          : (entry.duration / 60) * rate
      ).toFixed(2);
      const startCol =
        entry.inputMode === "time"
          ? entry.startTime
          : `${entry.decimalHours} hours`;
      const endCol = entry.inputMode === "time" ? entry.endTime : "-";
      const inputModeText =
        entry.inputMode === "time" ? "Time Range" : "Decimal Hours";

      htmlTable += `
        <tr>
          <td style="text-align: center; padding: 8px;">${index + 1}</td>
          <td style="text-align: left; padding: 8px;">${
            entry.description || ""
          }</td>
          <td style="text-align: left; padding: 8px;">${inputModeText}</td>
          <td style="text-align: left; padding: 8px;">${startCol}</td>
          <td style="text-align: left; padding: 8px;">${endCol}</td>
          <td style="text-align: center; padding: 8px;">${
            entry.duration
          } min<br/>(${(entry.duration / 60).toFixed(2)} hrs)</td>
          <td style="text-align: right; padding: 8px;">${amount}</td>
        </tr>
      `;
    });

    // Add total row
    htmlTable += `
        <tr style="background-color: #f7fafc; font-weight: bold;">
          <td colspan="5" style="text-align: right; padding: 12px;">TOTAL:</td>
          <td style="text-align: center; padding: 12px;">${totalMinutes} min<br/>(${(
      totalMinutes / 60
    ).toFixed(2)} hrs)</td>
          <td style="text-align: right; padding: 12px; color: #38a169; font-size: 1.1em;">${totalAmount.toFixed(
            2
          )}</td>
        </tr>
      </tbody>
    </table>
    
    <div style="margin-top: 20px; padding: 15px; background-color: #e6fffa; border: 2px solid #81e6d9; border-radius: 8px;">
      <h3 style="margin-top: 0; color: #234e52;">Summary</h3>
      <p><strong>Applicant Name:</strong> ${applicantName}</p>
      <p><strong>Case Name:</strong> ${caseName}</p>
      ${caseNumber ? `<p><strong>Case Number:</strong> ${caseNumber}</p>` : ""}
      <p><strong>Rate:</strong> ${rate.toFixed(2)}/${
      rateType === "minute" ? "min" : "hr"
    }</p>
      <p><strong>Total Time:</strong> ${Math.floor(totalMinutes / 60)}h ${
      totalMinutes % 60
    }m (${totalMinutes} minutes)</p>
      <p style="font-size: 1.2em; color: #38a169;"><strong>Total Amount: ${totalAmount.toFixed(
        2
      )}</strong></p>
    </div>
    `;

    // Create a temporary element
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlTable;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    document.body.appendChild(tempDiv);

    // Copy to clipboard
    const range = document.createRange();
    range.selectNodeContents(tempDiv);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    try {
      document.execCommand("copy");
      alert(
        "Table copied successfully! You can now paste it into Word with proper formatting."
      );
    } catch (err) {
      alert("Failed to copy. Please try again.");
    }

    // Cleanup
    selection?.removeAllRanges();
    document.body.removeChild(tempDiv);
  };

  const exportToExcel = () => {
    // Create CSV content
    let csv = "WCAB Deposition Bill\n\n";
    csv += `Applicant Name:,${applicantName}\n`;
    csv += `Case Name:,${caseName}\n`;
    csv += `Case Number:,${caseNumber}\n`;
    csv += `Date:,${new Date().toLocaleDateString()}\n`;
    csv += `Rate:,$${rate.toFixed(2)}/${
      rateType === "minute" ? "min" : "hr"
    }\n\n`;

    // Table headers
    csv +=
      "#,Description,Input Mode,Start/Hours,End Time,Duration (min),Duration (hrs),Amount\n";

    // Table rows
    entries.forEach((entry, index) => {
      const amount = (
        rateType === "minute"
          ? entry.duration * rate
          : (entry.duration / 60) * rate
      ).toFixed(2);
      const startCol =
        entry.inputMode === "time"
          ? entry.startTime
          : entry.decimalHours.toString();
      const endCol = entry.inputMode === "time" ? entry.endTime : "-";

      csv += `${index + 1},"${entry.description}",${
        entry.inputMode === "time" ? "Time Range" : "Decimal Hours"
      },${startCol},${endCol},${entry.duration},${(entry.duration / 60).toFixed(
        2
      )},$${amount}\n`;
    });

    // Total row
    csv += `,,,,TOTAL:,${totalMinutes},${(totalMinutes / 60).toFixed(
      2
    )},$${totalAmount.toFixed(2)}\n`;

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Deposition_Bill_${applicantName}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("Excel file downloaded successfully!");
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>WCAB Deposition Calculator</h1>
            <div className={styles.headerButtons}>
              <button
                onClick={newBill}
                className={`${styles.button} ${styles.buttonSuccess}`}
              >
                New Bill
              </button>
              <button
                onClick={() => setShowSavedBills(!showSavedBills)}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                {showSavedBills ? "Hide" : "View"} Saved Bills
              </button>
            </div>
          </div>

          {showSavedBills && (
            <div className={styles.savedBillsSection}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <h2 className={styles.savedBillsTitle} style={{ margin: 0 }}>
                  Saved Bills
                </h2>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, case, or number..."
                    className={styles.input}
                    style={{ margin: 0, minWidth: "250px" }}
                  />
                  {selectedBills.size > 0 && (
                    <>
                      <button
                        onClick={exportSelectedBillsToExcel}
                        className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                      >
                        📊 Export Selected ({selectedBills.size})
                      </button>
                      <button
                        onClick={() => setSelectedBills(new Set())}
                        className={`${styles.button} ${styles.buttonDanger} ${styles.buttonSmall}`}
                      >
                        Clear Selection
                      </button>
                    </>
                  )}
                </div>
              </div>

              {filteredBills.length === 0 ? (
                <p className={styles.noBills}>
                  {searchQuery
                    ? "No bills found matching your search."
                    : "No saved bills yet."}
                </p>
              ) : (
                <>
                  <div
                    style={{
                      marginBottom: "1rem",
                      padding: "0.75rem",
                      background: "#edf2f7",
                      borderRadius: "6px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontWeight: "500",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedBills.size === filteredBills.length &&
                          filteredBills.length > 0
                        }
                        onChange={selectAllBills}
                        style={{
                          marginRight: "0.5rem",
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                        }}
                      />
                      Select All ({filteredBills.length} bills)
                    </label>
                    {filteredBills.length > 0 && (
                      <button
                        onClick={() => {
                          setSelectedBills(
                            new Set(filteredBills.map((b) => b.id))
                          );
                          exportSelectedBillsToExcel();
                        }}
                        className={`${styles.button} ${styles.buttonSuccess} ${styles.buttonSmall}`}
                      >
                        📊 Export All Bills
                      </button>
                    )}
                  </div>
                  <div className={styles.billsList}>
                    {filteredBills.map((bill) => (
                      <div key={bill.id} className={styles.billItem}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            flex: 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedBills.has(bill.id)}
                            onChange={() => toggleBillSelection(bill.id)}
                            style={{
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className={styles.billInfo}>
                            <div className={styles.billApplicant}>
                              {bill.applicantName}
                            </div>
                            <div className={styles.billCase}>
                              {bill.caseName}
                            </div>
                            {bill.caseNumber && (
                              <div
                                className={styles.billCase}
                                style={{ fontSize: "0.8rem" }}
                              >
                                Case #: {bill.caseNumber}
                              </div>
                            )}
                            <div className={styles.billDate}>
                              {new Date(bill.dateCreated).toLocaleDateString()}{" "}
                              • {bill.entries.length} entries • $
                              {bill.entries
                                .reduce((sum, entry) => {
                                  return (
                                    sum +
                                    (bill.rateType === "minute"
                                      ? entry.duration * bill.rate
                                      : (entry.duration / 60) * bill.rate)
                                  );
                                }, 0)
                                .toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className={styles.billActions}>
                          <button
                            onClick={() => loadBill(bill)}
                            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonSmall}`}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteBill(bill.id)}
                            className={`${styles.button} ${styles.buttonDanger} ${styles.buttonSmall}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Case Information */}
          <div className={styles.caseInfoGrid}>
            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.required}`}>
                Applicant Name
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className={styles.input}
                placeholder="John Doe"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={`${styles.label} ${styles.required}`}>
                Case Name
              </label>
              <input
                type="text"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                className={styles.input}
                placeholder="Doe vs. Company"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Case Number</label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className={styles.input}
                placeholder="ADJ12345678"
              />
            </div>
          </div>

          {/* Rate Settings */}
          <div className={styles.rateSection}>
            <div className={styles.rateTypeGroup}>
              <label className={styles.label}>Rate Type</label>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    checked={rateType === "minute"}
                    onChange={() => setRateType("minute")}
                  />
                  $/min
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    checked={rateType === "hour"}
                    onChange={() => setRateType("hour")}
                  />
                  $/hr
                </label>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Rate Amount</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                min="0"
                step="0.01"
                className={`${styles.input} ${styles.rateInput}`}
              />
            </div>
          </div>

          {/* Table */}
          <div className={styles.tableContainer}>
            <table id="depo-table" className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: "50px" }}>#</th>
                  <th>Description</th>
                  <th style={{ width: "130px" }}>Input Mode</th>
                  <th style={{ width: "120px" }}>Start/Hours</th>
                  <th style={{ width: "120px" }}>End</th>
                  <th style={{ width: "100px" }}>Duration</th>
                  <th style={{ width: "110px" }}>Amount</th>
                  <th style={{ width: "70px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, index) => (
                  <tr key={entry.id}>
                    <td className={styles.cellCenter}>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={entry.description}
                        onChange={(e) =>
                          updateEntry(entry.id, "description", e.target.value)
                        }
                        className={styles.tableInput}
                        placeholder="Enter description"
                      />
                    </td>
                    <td>
                      <select
                        value={entry.inputMode}
                        onChange={(e) =>
                          updateEntry(
                            entry.id,
                            "inputMode",
                            e.target.value as "time" | "decimal"
                          )
                        }
                        className={styles.tableInput}
                      >
                        <option value="time">Time Range</option>
                        <option value="decimal">Decimal Hours</option>
                      </select>
                    </td>
                    <td>
                      {entry.inputMode === "time" ? (
                        <input
                          type="text"
                          value={entry.startTime}
                          onChange={(e) =>
                            updateEntry(entry.id, "startTime", e.target.value)
                          }
                          className={`${styles.tableInput} ${
                            !isValidTimeFormat(entry.startTime) &&
                            entry.startTime
                              ? styles.tableInputInvalid
                              : ""
                          }`}
                          placeholder="9:00 AM"
                        />
                      ) : (
                        <input
                          type="number"
                          value={entry.decimalHours}
                          onChange={(e) =>
                            updateEntry(
                              entry.id,
                              "decimalHours",
                              Number(e.target.value)
                            )
                          }
                          className={styles.tableInput}
                          placeholder="1.5"
                          step="0.25"
                          min="0"
                        />
                      )}
                    </td>
                    <td>
                      {entry.inputMode === "time" ? (
                        <input
                          type="text"
                          value={entry.endTime}
                          onChange={(e) =>
                            updateEntry(entry.id, "endTime", e.target.value)
                          }
                          className={`${styles.tableInput} ${
                            !isValidTimeFormat(entry.endTime) && entry.endTime
                              ? styles.tableInputInvalid
                              : ""
                          }`}
                          placeholder="10:00 AM"
                        />
                      ) : (
                        <span
                          className={styles.cellCenter}
                          style={{ fontSize: "0.875rem", color: "#718096" }}
                        >
                          -
                        </span>
                      )}
                    </td>
                    <td className={styles.cellCenter}>
                      <div style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                        {entry.duration} min
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#718096" }}>
                        ({(entry.duration / 60).toFixed(2)} hrs)
                      </div>
                    </td>
                    <td className={styles.cellRight}>
                      $
                      {(rateType === "minute"
                        ? entry.duration * rate
                        : (entry.duration / 60) * rate
                      ).toFixed(2)}
                    </td>
                    <td className={styles.cellCenter}>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className={styles.deleteButton}
                        title="Delete"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td colSpan={5} className={styles.cellRight}>
                    TOTAL:
                  </td>
                  <td className={styles.cellCenter}>
                    <div style={{ fontWeight: "700" }}>{totalMinutes} min</div>
                    <div style={{ fontSize: "0.875rem" }}>
                      ({(totalMinutes / 60).toFixed(2)} hrs)
                    </div>
                  </td>
                  <td className={`${styles.cellRight} ${styles.totalAmount}`}>
                    ${totalAmount.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className={styles.actionButtons}>
            <button
              onClick={addNewEntry}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              + Add Entry
            </button>
            <button
              onClick={copyTableToClipboard}
              className={`${styles.button} ${styles.buttonPurple}`}
            >
              📋 Copy Table
            </button>
            <button
              onClick={exportToExcel}
              className={`${styles.button} ${styles.buttonSecondary}`}
            >
              📊 Export to Excel
            </button>
            <button
              onClick={saveBill}
              className={`${styles.button} ${styles.buttonSuccess}`}
            >
              💾 {editingBillId ? "Update" : "Save"} Bill
            </button>
          </div>

          {/* Summary Card */}
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Summary</h3>
            <div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Rate:</span>
                <span className={styles.summaryValue}>
                  ${rate.toFixed(2)}/{rateType === "minute" ? "min" : "hr"}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total Time:</span>
                <span className={styles.summaryValue}>
                  {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m (
                  {totalMinutes} minutes)
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Total Amount:</span>
                <span className={styles.summaryTotal}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositionCalculator;
