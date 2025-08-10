/* eslint-disable prefer-const */
import React, { useState, useEffect } from "react";
import styles from "../styles/DepositionCalculator.module.css";

interface TimeField {
  id: string;
  label: string;
  hours: number;
  minutes: number;
  timeMode: "manual" | "duration";
  directInput: number;
  startTime: string;
  endTime: string;
  isEditing?: boolean;
  tempLabel?: string;
}

const DepositionCalculator: React.FC = () => {
  const [rateType, setRateType] = useState<"minute" | "hour">("minute");
  const [rate, setRate] = useState<number>(100);
  const [fields, setFields] = useState<TimeField[]>([
    {
      id: "prep",
      label: "Deposition Preparation Time",
      hours: 0,
      minutes: 0,
      timeMode: "duration",
      directInput: 0,
      startTime: "09:00 AM",
      endTime: "10:00 AM",
      isEditing: false,
    },
    {
      id: "depo",
      label: "Deposition Time",
      hours: 0,
      minutes: 0,
      timeMode: "duration",
      directInput: 0,
      startTime: "10:00 AM",
      endTime: "11:00 AM",
      isEditing: false,
    },
  ]);
  const [showRail, setShowRail] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowRail(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatTimeTo24Hour = (time12h: string) => {
    const [time, period] = time12h.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateTotalMinutes = (field: TimeField): number => {
    if (field.timeMode === "manual") {
      return field.directInput;
    } else {
      return field.hours * 60 + field.minutes;
    }
  };

  const calculateDuration = (
    start: string,
    end: string
  ): { hours: number; minutes: number } => {
    try {
      const start24h = formatTimeTo24Hour(start);
      const end24h = formatTimeTo24Hour(end);

      const [startHours, startMinutes] = start24h.split(":").map(Number);
      const [endHours, endMinutes] = end24h.split(":").map(Number);

      let totalMinutes =
        endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
      if (totalMinutes < 0) totalMinutes += 24 * 60;

      return {
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
      };
    } catch {
      return { hours: 0, minutes: 0 };
    }
  };

  const toggleEdit = (id: string) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          return {
            ...field,
            isEditing: !field.isEditing,
            tempLabel: field.isEditing ? undefined : field.label,
          };
        }
        return field;
      })
    );
  };

  const handleLabelChange = (id: string, value: string) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          return { ...field, tempLabel: value };
        }
        return field;
      })
    );
  };

  const saveLabel = (id: string) => {
    setFields(
      fields.map((field) => {
        if (field.id === id && field.tempLabel) {
          return {
            ...field,
            label: field.tempLabel,
            isEditing: false,
            tempLabel: undefined,
          };
        }
        return field;
      })
    );
  };

  const cancelEdit = (id: string) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          return { ...field, isEditing: false, tempLabel: undefined };
        }
        return field;
      })
    );
  };

  const handleTimeModeChange = (id: string, mode: "manual" | "duration") => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          if (mode === "duration") {
            const { hours, minutes } = calculateDuration(
              field.startTime,
              field.endTime
            );
            return { ...field, timeMode: mode, hours, minutes };
          }
          return { ...field, timeMode: mode };
        }
        return field;
      })
    );
  };

  const handleDirectInputChange = (id: string, value: number) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          return { ...field, directInput: Math.max(0, value) };
        }
        return field;
      })
    );
  };

  const handleTimeEntryChange = (
    id: string,
    type: "start" | "end",
    value: string
  ) => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          const newField = { ...field, [`${type}Time`]: value };
          if (field.timeMode === "duration") {
            const { hours, minutes } = calculateDuration(
              type === "start" ? value : field.startTime,
              type === "end" ? value : field.endTime
            );
            return { ...newField, hours, minutes };
          }
          return newField;
        }
        return field;
      })
    );
  };

  const addNewField = () => {
    const newId = `field-${Date.now()}`;
    setFields([
      ...fields,
      {
        id: newId,
        label: `Additional Time ${fields.length - 1}`,
        hours: 0,
        minutes: 0,
        timeMode: "duration",
        directInput: 0,
        startTime: "12:00 PM",
        endTime: "12:30 PM",
        isEditing: false,
      },
    ]);
  };

  const removeField = (id: string) => {
    if (fields.length <= 2) return;
    setFields(fields.filter((field) => field.id !== id));
  };

  const totalMinutes = fields.reduce(
    (sum, field) => sum + calculateTotalMinutes(field),
    0
  );
  const totalHours = totalMinutes / 60;
  const totalAmount =
    rateType === "minute" ? totalMinutes * rate : totalHours * rate;

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Deposition Bill Calculator</h1>

      <button
        className={styles.railToggle}
        onClick={() => setShowRail(!showRail)}
        style={{ display: window.innerWidth <= 768 ? "flex" : "none" }}
      >
        {showRail ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Hide Summary
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            Show Summary
          </>
        )}
      </button>

      <div
        className={`${styles.rightSideSummary} ${showRail ? styles.show : ""}`}
      >
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryTitle}>Billing Summary</h3>
          <div className={styles.summaryItem}>
            <span>Rate:</span>
            <span>
              ${rate.toFixed(2)}/{rateType === "minute" ? "min" : "hr"}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span>Total Minutes:</span>
            <span>{totalMinutes.toFixed(0)}</span>
          </div>
          {/* <div className={styles.summaryItem}>
            <span>Total Hours:</span>
            <span>{totalHours.toFixed(2)}</span>
          </div> */}
          <div className={styles.summaryItem}>
            <span>Total Amount:</span>
            <span className={styles.totalAmount}>
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.rateSection}>
          <div className={styles.rateOption}>
            <label>
              <input
                type="radio"
                checked={rateType === "minute"}
                onChange={() => setRateType("minute")}
              />
              $ per minute
            </label>
            <label>
              <input
                type="radio"
                checked={rateType === "hour"}
                onChange={() => setRateType("hour")}
              />
              $ per hour
            </label>
          </div>
          <div className={styles.rateInput}>
            <label>Rate:</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              min="0"
            />
          </div>
        </div>

        <div className={styles.fieldsContainer}>
          {fields.map((field) => (
            <div key={field.id} className={styles.timeField}>
              <div className={styles.fieldHeader}>
                {field.isEditing ? (
                  <div className={styles.editContainer}>
                    <input
                      type="text"
                      value={field.tempLabel || ""}
                      onChange={(e) =>
                        handleLabelChange(field.id, e.target.value)
                      }
                      className={styles.editInput}
                    />
                    <button
                      onClick={() => saveLabel(field.id)}
                      className={styles.saveButton}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => cancelEdit(field.id)}
                      className={styles.cancelButton}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h3>{field.label}</h3>
                    <div className={styles.fieldActions}>
                      <button
                        onClick={() => toggleEdit(field.id)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                      {fields.length > 2 && (
                        <button
                          onClick={() => removeField(field.id)}
                          className={styles.removeButton}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className={styles.timeModeSelector}>
                <label>
                  <input
                    type="radio"
                    checked={field.timeMode === "duration"}
                    onChange={() => handleTimeModeChange(field.id, "duration")}
                  />
                  Enter start/end time
                </label>
                <label>
                  <input
                    type="radio"
                    checked={field.timeMode === "manual"}
                    onChange={() => handleTimeModeChange(field.id, "manual")}
                  />
                  Enter duration directly
                </label>
              </div>

              {field.timeMode === "duration" ? (
                <div className={styles.durationInput}>
                  <div className={styles.timeInputGroup}>
                    <label>Start Time:</label>
                    <div className={styles.timeInputContainer}>
                      <input
                        type="text"
                        value={field.startTime}
                        onChange={(e) =>
                          handleTimeEntryChange(
                            field.id,
                            "start",
                            e.target.value
                          )
                        }
                        className={styles.timeInput}
                        placeholder="HH:MM AM/PM"
                      />
                      <div className={styles.timeExample}>e.g. 09:46 AM</div>
                    </div>
                  </div>
                  <div className={styles.timeInputGroup}>
                    <label>End Time:</label>
                    <div className={styles.timeInputContainer}>
                      <input
                        type="text"
                        value={field.endTime}
                        onChange={(e) =>
                          handleTimeEntryChange(field.id, "end", e.target.value)
                        }
                        className={styles.timeInput}
                        placeholder="HH:MM AM/PM"
                      />
                      <div className={styles.timeExample}>e.g. 10:15 AM</div>
                    </div>
                  </div>
                  <div className={styles.calculatedDuration}>
                    <span>
                      Duration: {field.hours}h {field.minutes}m
                    </span>
                  </div>
                </div>
              ) : (
                <div className={styles.directInput}>
                  <label>Total Minutes:</label>
                  <input
                    type="number"
                    value={field.directInput}
                    onChange={(e) =>
                      handleDirectInputChange(field.id, Number(e.target.value))
                    }
                    min="0"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={addNewField} className={styles.addButton}>
          Add Additional Time Field
        </button>
      </div>
    </div>
  );
};

export default DepositionCalculator;
