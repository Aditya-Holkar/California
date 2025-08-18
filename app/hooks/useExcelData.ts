import { useState, useEffect } from "react";

export type ExcelRow = {
  "ZIP Code": string;
  Name: string;
  "Case Name": string;
  "Case #": string;
  "Case Status": string;
  Address?: string;
  City: string;
  County: string;
  Region: string;
  "Added On": string;
};

export const useExcelData = () => {
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const savedData = localStorage.getItem("excelData");
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          if (Array.isArray(parsedData)) {
            setExcelData(parsedData);
          } else {
            throw new Error("Invalid data format in storage");
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load saved data");
        // Initialize with empty array if loading fails
        setExcelData([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    try {
      localStorage.setItem("excelData", JSON.stringify(excelData));
    } catch (err) {
      console.error("Failed to save data:", err);
      setError("Failed to save data to storage");
    }
  }, [excelData]);

  // Add new entry to the data
  const addEntry = (newEntry: ExcelRow) => {
    setExcelData((prev) => {
      // Check for duplicates before adding
      const isDuplicate = prev.some(
        (item) =>
          item["ZIP Code"] === newEntry["ZIP Code"] &&
          item.City === newEntry.City &&
          item["Case #"] === newEntry["Case #"]
      );

      if (isDuplicate) {
        setError("Duplicate entry - this case already exists");
        return prev;
      }

      return [
        ...prev,
        {
          ...newEntry,
          "Added On": new Date().toLocaleString(),
        },
      ];
    });
  };

  // Update existing entry by index
  const updateEntry = (index: number, updatedEntry: ExcelRow) => {
    setExcelData((prev) => {
      if (index < 0 || index >= prev.length) return prev;

      const newData = [...prev];
      newData[index] = {
        ...updatedEntry,
        "Added On": new Date().toLocaleString(),
      };
      return newData;
    });
  };

  // Remove entry by index
  const removeEntry = (index: number) => {
    setExcelData((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  // Clear all data
  const clearData = () => {
    if (window.confirm("Are you sure you want to clear all data?")) {
      setExcelData([]);
    }
  };

  // Get unique values for a specific key
  const getUniqueValues = (key: keyof ExcelRow) => {
    const values = new Set<string>();
    excelData.forEach((item) => {
      const value = item[key];
      if (value) values.add(String(value));
    });
    return Array.from(values);
  };

  // Bulk import data (for file uploads)
  const importData = (newData: ExcelRow[]) => {
    setExcelData((prev) => {
      // Filter out duplicates from new data
      const filteredNewData = newData.filter(
        (newItem) =>
          !prev.some(
            (existingItem) =>
              existingItem["ZIP Code"] === newItem["ZIP Code"] &&
              existingItem.City === newItem.City &&
              existingItem["Case #"] === newItem["Case #"]
          )
      );

      if (filteredNewData.length < newData.length) {
        setError(
          `Skipped ${newData.length - filteredNewData.length} duplicate entries`
        );
      }

      return [...prev, ...filteredNewData];
    });
  };

  return {
    excelData,
    isLoading,
    error,
    addEntry,
    updateEntry,
    removeEntry,
    clearData,
    getUniqueValues,
    importData,
    setExcelData, // For advanced use cases
  };
};
