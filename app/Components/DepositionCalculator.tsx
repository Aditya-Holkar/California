/* eslint-disable prefer-const */
import React, { useState, useEffect } from "react";
import styles from "../styles/Manage.module.css"; // Changed to use Manage.module.css

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
  const [fields, setFields] = useState<TimeField[]>([]);
  const [showRail, setShowRail] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setShowRail(window.innerWidth > 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isValidTimeFormat = (time: string): boolean => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i;
    return timeRegex.test(time);
  };

  const formatTimeTo24Hour = (time12h: string) => {
    const [time, period] = time12h.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (period === "PM" && hours !== 12) hours += 12;
    else if (period === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const calculateTotalMinutes = (field: TimeField): number => {
    return field.timeMode === "manual"
      ? field.directInput
      : field.hours * 60 + field.minutes;
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
      fields.map((field) =>
        field.id === id
          ? {
              ...field,
              isEditing: !field.isEditing,
              tempLabel: field.isEditing ? undefined : field.label,
            }
          : field
      )
    );
  };

  const handleLabelChange = (id: string, value: string) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, tempLabel: value } : field
      )
    );
  };

  const saveLabel = (id: string) => {
    setFields(
      fields.map((field) =>
        field.id === id && field.tempLabel
          ? {
              ...field,
              label: field.tempLabel,
              isEditing: false,
              tempLabel: undefined,
            }
          : field
      )
    );
  };

  const handleTimeModeChange = (id: string, mode: "manual" | "duration") => {
    setFields(
      fields.map((field) => {
        if (field.id === id) {
          return mode === "duration"
            ? {
                ...field,
                timeMode: mode,
                ...calculateDuration(field.startTime, field.endTime),
              }
            : { ...field, timeMode: mode };
        }
        return field;
      })
    );
  };

  const handleDirectInputChange = (id: string, value: number) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, directInput: Math.max(0, value) } : field
      )
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
          if (field.timeMode === "duration" && isValidTimeFormat(value)) {
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
        label: `Time ${fields.length}`,
        hours: 1,
        minutes: 0,
        timeMode: "duration",
        directInput: 60,
        startTime: "12:00 PM",
        endTime: "01:00 PM",
        isEditing: true,
      },
    ]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const totalMinutes = fields.reduce(
    (sum, field) => sum + calculateTotalMinutes(field),
    0
  );
  const totalAmount =
    rateType === "minute" ? totalMinutes * rate : (totalMinutes / 60) * rate;

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Deposition Calculator</h1>

      <button
        className={styles.railToggle}
        onClick={() => setShowRail(!showRail)}
        style={{ display: window.innerWidth <= 768 ? "flex" : "none" }}
      >
        {showRail ? "Hide Summary" : "Show Summary"}
      </button>

      <div
        className={`${styles.rightSideSummary} ${showRail ? styles.show : ""}`}
      >
        <div className={styles.summaryCard}>
          <h3 className={styles.summaryTitle}>Summary</h3>
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
          <div className={styles.summaryItem}>
            <span>Total:</span>
            <span className={styles.income}>${totalAmount.toFixed(2)}</span>
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
              $/min
            </label>
            <label>
              <input
                type="radio"
                checked={rateType === "hour"}
                onChange={() => setRateType("hour")}
              />
              $/hr
            </label>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Rate:</label>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              min="0"
              className={styles.formInput}
            />
          </div>
        </div>

        <div className={styles.fieldsContainer}>
          {fields.map((field) => (
            <div key={field.id} className={styles.formPanel}>
              <div className={styles.fieldHeader}>
                {field.isEditing ? (
                  <div className={styles.editContainer}>
                    <input
                      type="text"
                      value={field.tempLabel || ""}
                      onChange={(e) =>
                        handleLabelChange(field.id, e.target.value)
                      }
                      className={styles.formInput}
                    />
                    <div className={styles.editActions}>
                      <button
                        onClick={() => saveLabel(field.id)}
                        className={`${styles.button} ${styles.buttonSuccess} ${styles.buttonSmall}`}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => toggleEdit(field.id)}
                        className={`${styles.button} ${styles.buttonDanger} ${styles.buttonSmall}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.fieldTitleRow}>
                    <h3 className={styles.formTitle}>{field.label}</h3>
                    <div className={styles.fieldButtons}>
                      <button
                        onClick={() => toggleEdit(field.id)}
                        className={`${styles.button} ${styles.buttonSmall}`}
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => removeField(field.id)}
                        className={`${styles.button} ${styles.buttonDanger} ${styles.buttonSmall}`}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.timeModeSelector}>
                <label>
                  <input
                    type="radio"
                    checked={field.timeMode === "duration"}
                    onChange={() => handleTimeModeChange(field.id, "duration")}
                  />
                  Time Range
                </label>
                <label>
                  <input
                    type="radio"
                    checked={field.timeMode === "manual"}
                    onChange={() => handleTimeModeChange(field.id, "manual")}
                  />
                  Direct Input
                </label>
              </div>

              {field.timeMode === "duration" ? (
                <div className={styles.durationInput}>
                  <div className={styles.timeInputRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Start:</label>
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
                        className={`${styles.formInput} ${
                          isValidTimeFormat(field.startTime)
                            ? styles.valid
                            : field.startTime
                            ? styles.invalid
                            : ""
                        }`}
                        placeholder="HH:MM AM/PM"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>End:</label>
                      <input
                        type="text"
                        value={field.endTime}
                        onChange={(e) =>
                          handleTimeEntryChange(field.id, "end", e.target.value)
                        }
                        className={`${styles.formInput} ${
                          isValidTimeFormat(field.endTime)
                            ? styles.valid
                            : field.endTime
                            ? styles.invalid
                            : ""
                        }`}
                        placeholder="HH:MM AM/PM"
                      />
                    </div>
                  </div>
                  <div className={styles.calculatedDuration}>
                    Duration: {field.hours}h {field.minutes}m (
                    {calculateTotalMinutes(field)}m)
                  </div>
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Minutes:</label>
                  <input
                    type="number"
                    value={field.directInput}
                    onChange={(e) =>
                      handleDirectInputChange(field.id, Number(e.target.value))
                    }
                    min="0"
                    className={styles.formInput}
                  />
                  <div className={styles.calculatedDuration}>
                    ({field.directInput}m)
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addNewField}
          className={`${styles.button} ${styles.buttonPrimary}`}
        >
          + Add Time Field
        </button>
      </div>
    </div>
  );
};

export default DepositionCalculator;
