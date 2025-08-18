/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { californiaAreas, CityData } from "../../Utils/californiaData";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import styles from "../../styles/Zip.module.css";
import PhoneInput from "react-phone-number-input";
import ZipDashboard from "@/app/Components/ZipDashboard";

type ExcelRow = {
  "ZIP Code": string;
  // Name: string;
  Office: string;
  "Case Name": string;
  "Case #": string;
  "Case Status": string;
  Address?: string;
  City: string;
  County: string;
  Region: string;
  "Added On": string;
};

export default function Zip() {
  const [searchMode, setSearchMode] = useState<"zip" | "address" | null>(null);
  const [zipCode, setZipCode] = useState<string>("");
  const [fullAddress, setFullAddress] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [caseName, setCaseName] = useState<string>("");
  const [caseNumber, setCaseNumber] = useState<string>("");
  const [caseStatus, setCaseStatus] = useState<string>("");
  const [results, setResults] = useState<CityData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState<boolean>(false);
  const [showNamePrompt, setShowNamePrompt] = useState<boolean>(false);
  const [currentCityToAdd, setCurrentCityToAdd] = useState<CityData | null>(
    null
  );
  const [tempName, setTempName] = useState<string>("");
  const [tempCaseName, setTempCaseName] = useState<string>("");
  const [tempCaseNumber, setTempCaseNumber] = useState<string>("");
  const [tempCaseStatus, setTempCaseStatus] = useState<string>("");
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [showExcelPanel, setShowExcelPanel] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("California_Zip_Data.xlsx");

  const [office, setOffice] = useState<string>("");

  useEffect(() => {
    const savedData = localStorage.getItem("californiaZipData");
    if (savedData) {
      setExcelData(JSON.parse(savedData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("californiaZipData", JSON.stringify(excelData));
  }, [excelData]);

  const handleUploadedData = (newData: any[]) => {
    const transformedData = newData.map((item) => ({
      ...item,
      "Added On": item["Added On"] || new Date().toISOString(), // Ensure required field
    }));

    const existingDataMap = new Map(
      excelData.map((item) => [`${item["ZIP Code"]}-${item["Case #"]}`, item])
    );

    const filteredNewData = transformedData.filter(
      (item) => !existingDataMap.has(`${item["ZIP Code"]}-${item["Case #"]}`)
    );

    setExcelData((prev) => [...prev, ...filteredNewData]);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const allCities: CityData[] = [
    ...californiaAreas["True list"],
    ...californiaAreas["Incorporated Cities"].filter(
      (city) =>
        !californiaAreas["True list"].some(
          (trueCity) =>
            trueCity.city === city.city && trueCity.county === city.county
        )
    ),
    ...californiaAreas["Census-Designated Places (CDP)"].filter(
      (city) =>
        !californiaAreas["True list"].some(
          (trueCity) =>
            trueCity.city === city.city && trueCity.county === city.county
        )
    ),
  ];

  const validateZipCode = (zip: string): boolean => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  };

  const extractZipFromAddress = (addr: string): string | null => {
    // Trim and clean the address
    const cleanAddr = addr.trim();

    // First try to find ZIP+4 at the end (5 digits, hyphen, 4 digits)
    const zipPlus4Match = cleanAddr.match(/(\b\d{5}-\d{4}\b)[^\d]*$/);
    if (zipPlus4Match) {
      return zipPlus4Match[1].split("-")[0]; // Return just the first 5 digits
    }

    // Then try standard 5-digit ZIP at the end
    const zipMatch = cleanAddr.match(/(\b\d{5}\b)[^\d]*$/);
    return zipMatch ? zipMatch[1] : null;
  };

  const extractNameFromInput = (
    input: string
  ): { name: string; address: string } => {
    const commaIndex = input.indexOf(",");
    if (commaIndex > 0) {
      return {
        name: input.substring(0, commaIndex).trim(),
        address: input.substring(commaIndex + 1).trim(),
      };
    }

    const words = input.trim().split(/\s+/);
    if (words.length > 2) {
      return {
        name: words.slice(0, 8).join(" "),
        address: words.slice(8).join(" "),
      };
    }

    return {
      name: input,
      address: "",
    };
  };

  const findCityByZip = (): void => {
    setError(null);
    setResults([]);
    setShowOthers(false);

    let currentZip = zipCode;

    if (searchMode === "address") {
      const extractedZip = extractZipFromAddress(fullAddress);
      if (!extractedZip) {
        setError("No valid ZIP code found in the address");
        return;
      }
      currentZip = extractedZip;
    }

    // Strip any ZIP+4 suffix if present
    currentZip = currentZip.split("-")[0];

    if (!validateZipCode(currentZip)) {
      setError("Please enter a valid 5-digit ZIP code");
      return;
    }

    // Search through all city categories
    const matched: CityData[] = [];

    // Check True list first - only take the first match
    const trueListMatch = californiaAreas["True list"].find((city) =>
      city.zipCodes.includes(currentZip)
    );
    if (trueListMatch) {
      matched.push(trueListMatch);
    }

    // Then check Incorporated Cities (excluding duplicates with True list)
    californiaAreas["Incorporated Cities"].forEach((city) => {
      if (
        city.zipCodes.includes(currentZip) &&
        !matched.some((m) => m.city === city.city && m.county === city.county)
      ) {
        matched.push(city);
      }
    });

    // Then check CDPs (excluding duplicates with True list)
    californiaAreas["Census-Designated Places (CDP)"].forEach((city) => {
      if (
        city.zipCodes.includes(currentZip) &&
        !matched.some((m) => m.city === city.city && m.county === city.county)
      ) {
        matched.push(city);
      }
    });

    if (matched.length > 0) {
      setResults(matched);
      setZipCode(currentZip);
    } else {
      setError("ZIP code not found in our California database");
    }
  };

  const prepareToAdd = (cityData: CityData) => {
    setCurrentCityToAdd(cityData);
    if (searchMode === "address") {
      const { name: suggestedName } = extractNameFromInput(fullAddress);
      setTempName(suggestedName);
    } else {
      setTempName(name);
      setTempCaseName(caseName);
      setTempCaseNumber(caseNumber);
      setTempCaseStatus(caseStatus);
    }
    setShowNamePrompt(true);
  };

  const confirmAddToExcel = () => {
    if (currentCityToAdd) {
      const newRow: ExcelRow = {
        "ZIP Code": zipCode,
        // Name: tempName,
        Office: office,
        "Case Name": searchMode === "zip" ? tempCaseName : "",
        "Case #": tempCaseNumber,
        // "Case Status": searchMode === "zip" ? tempCaseStatus : "", // Added Case Status
        "Case Status": tempCaseStatus, // Added Case Status
        City: currentCityToAdd.city,
        County: currentCityToAdd.county,
        Region: currentCityToAdd.region,
        "Added On": new Date().toLocaleString(),
      };

      if (searchMode === "address") {
        let cleanedAddress = fullAddress;
        if (tempName) {
          cleanedAddress = fullAddress.replace(
            new RegExp(`^${tempName}\\s*,?\\s*`),
            ""
          );
        }
        newRow.Address = cleanedAddress;
      }

      setExcelData((prev) => [...prev, newRow]);
    }
    setShowNamePrompt(false);
    setCurrentCityToAdd(null);
  };

  const addAllResults = () => {
    if (searchMode === "address") {
      const { name: suggestedName } = extractNameFromInput(fullAddress);
      setTempName(suggestedName);
    } else {
      setTempName(name);
      setTempCaseName(caseName);
      setTempCaseNumber(caseNumber);
    }
    setShowNamePrompt(true);
  };

  const confirmAddAllToExcel = () => {
    const newRows: ExcelRow[] = results.map((city) => {
      const newRow: ExcelRow = {
        "ZIP Code": zipCode,
        // Name: tempName,
        Office: office,
        "Case Name": searchMode === "zip" ? tempCaseName : "",
        "Case #": tempCaseNumber,
        // "Case Status": searchMode === "zip" ? tempCaseStatus : "", // Added Case Status
        "Case Status": tempCaseStatus, // Added Case Status
        City: city.city,
        County: city.county,
        Region: city.region,
        "Added On": new Date().toLocaleString(),
      };

      if (searchMode === "address") {
        let cleanedAddress = fullAddress;
        if (tempName) {
          cleanedAddress = fullAddress.replace(
            new RegExp(`^${tempName}\\s*,?\\s*`),
            ""
          );
        }
        newRow.Address = cleanedAddress;
      }

      return newRow;
    });

    setExcelData((prev) => [...prev, ...newRows]);
    setShowNamePrompt(false);
  };

  const toggleExcelPanel = () => {
    setShowExcelPanel(!showExcelPanel);
  };

  const downloadExcel = () => {
    if (excelData.length === 0) {
      setError("No data to export");
      return;
    }

    // Prepare data with all required fields
    const dataToExport = excelData.map((row) => ({
      "ZIP Code": row["ZIP Code"],
      Office: row["Office"],
      "Case Name": row["Case Name"],
      "Case #": row["Case #"],
      "Case Status": row["Case Status"], // Ensure Case Status is included
      City: row["City"],
      County: row["County"],
      Region: row["Region"],
      "Added On": row["Added On"],
      ...(row.Address && { Address: row.Address }), // Conditionally include Address
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ZipCodeData");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, fileName);
  };

  const clearExcelData = () => {
    if (confirm("Are you sure you want to clear all Excel data?")) {
      setExcelData([]);
    }
  };

  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setFullAddress(input);
    setResults([]);
    setError(null);

    const { name: extractedName, address: extractedAddress } =
      extractNameFromInput(input);
    setName(extractedName);
    setAddress(extractedAddress);
  };

  const handleZipInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipCode(e.target.value);
    setResults([]);
    setError(null);
    setName("");
    setAddress("");
    setFullAddress("");
  };

  const handleCaseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaseName(e.target.value);
  };

  const handleCaseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaseNumber(e.target.value);
  };

  const prioritizedResults = results.map((city) => ({
    city,
    priority: californiaAreas["True list"].some(
      (t) => t.city === city.city && t.county === city.county
    )
      ? 1
      : 0,
  }));

  prioritizedResults.sort(
    (a, b) => b.priority - a.priority || a.city.city.localeCompare(b.city.city)
  );

  const trueListResults =
    prioritizedResults.length > 0 ? [prioritizedResults[0].city] : [];

  const otherResults = prioritizedResults.slice(1).map((item) => item.city);

  return (
    <div className={styles.container}>
      {showNamePrompt && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Confirm Details for Entry</h3>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Office:</label>
              <select
                value={office}
                onChange={(e) => setOffice(e.target.value)}
                className={styles.selectInput}
                required
              >
                <option value="">Select an office</option>
                <option value="Law office of Robin Jacobs">
                  Law office of Robin Jacobs
                </option>
                <option value="Law office of Sam Schmuel">
                  Law office of Sam Schmuel
                </option>
              </select>
            </div>
            {searchMode === "zip" && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Case Name:</label>
                <input
                  type="text"
                  value={tempCaseName}
                  onChange={(e) => setTempCaseName(e.target.value)}
                  className={styles.input}
                />
              </div>
            )}
            <div className={styles.inputGroup}>
              <label className={styles.label}>Case #:</label>
              <input
                type="text"
                value={tempCaseNumber}
                onChange={(e) => setTempCaseNumber(e.target.value)}
                className={styles.input}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Case Status:</label>
              <input
                type="text"
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value)}
                placeholder="Enter case status"
                className={styles.input}
              />
            </div>

            {/* {searchMode === "zip" && (
              <div className={styles.inputGroup}>
                <label className={styles.label}>Case Status:</label>
                <input
                  type="text"
                  value={tempCaseStatus}
                  onChange={(e) => setTempCaseStatus(e.target.value)}
                  className={styles.input}
                />
              </div>
            )} */}
            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  if (currentCityToAdd) {
                    confirmAddToExcel();
                  } else {
                    confirmAddAllToExcel();
                  }
                }}
                className={styles.button}
              >
                Confirm
              </button>
              <button
                onClick={() => setShowNamePrompt(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.mainContent}>
        {/* Left side - Form */}
        <div className={styles.formSection}>
          <div className={styles.card}>
            <h1 className={styles.title}>California Information by Zip</h1>

            {!searchMode ? (
              <div className={styles.searchOptions}>
                <h3 className={styles.subtitle}>
                  How would you like to search?
                </h3>
                <button
                  onClick={() => setSearchMode("zip")}
                  className={styles.searchOptionButton}
                >
                  Search by ZIP Code Only
                </button>
                {/* <button
                onClick={() => setSearchMode("address")}
                className={styles.searchOptionButton}
              >
                Search by Full Address
              </button> */}
              </div>
            ) : (
              <>
                {searchMode === "zip" && (
                  <>
                    <div className={styles.twoColumnForm}>
                      {/* Left Column */}
                      <div className={styles.formColumn}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>
                            Enter ZIP Code:
                          </label>
                          <input
                            type="text"
                            value={zipCode}
                            onChange={handleZipInputChange}
                            placeholder="e.g., 90210 or 90210-1234"
                            className={styles.input}
                            maxLength={10}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Case Name:</label>
                          <input
                            type="text"
                            value={caseName}
                            onChange={handleCaseNameChange}
                            placeholder="Enter case name"
                            className={styles.input}
                          />
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Case Status:</label>
                          <input
                            type="text"
                            value={caseStatus}
                            onChange={(e) => setCaseStatus(e.target.value)}
                            placeholder="Enter case status"
                            className={styles.input}
                          />
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className={styles.formColumn}>
                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Office:</label>
                          <select
                            value={office}
                            onChange={(e) => setOffice(e.target.value)}
                            className={styles.selectInput}
                            required
                          >
                            <option value="">Select an office</option>
                            <option value="Law office of Robin Jacobs">
                              Law office of Robin Jacobs
                            </option>
                            <option value="Law office of Sam Schmuel">
                              Law office of Sam Schmuel
                            </option>
                          </select>
                        </div>

                        <div className={styles.inputGroup}>
                          <label className={styles.label}>Case #:</label>
                          <input
                            type="text"
                            value={caseNumber}
                            onChange={handleCaseNumberChange}
                            placeholder="Enter case number"
                            className={styles.input}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Full width buttons below the columns */}
                    <div className={styles.formActions}>
                      <button onClick={findCityByZip} className={styles.button}>
                        Find Location
                      </button>

                      <button
                        onClick={() => {
                          setSearchMode(null);
                          setZipCode("");
                          setFullAddress("");
                          setName("");
                          setCaseName("");
                          setCaseNumber("");
                          setCaseStatus("");
                          setResults([]);
                          setError(null);
                        }}
                        className={styles.secondaryButton}
                      >
                        Change Search Method
                      </button>
                    </div>
                  </>
                )}

                {/* {searchMode === "address" && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Enter full address:</label>
                  <input
                    type="text"
                    value={fullAddress}
                    onChange={handleAddressInputChange}
                    placeholder="e.g., John Smith, 123 Main Street, Anytown, CA 91234 or 91234-1234"
                    className={styles.input}
                  />
                  {name && (
                    <div className={styles.namePreview}>
                      <span className={styles.smallText}>Detected name: </span>
                      <span className={styles.mediumText}>{name}</span>
                    </div>
                  )}
                </div>
              )} */}

                {/* <button onClick={findCityByZip} className={styles.button}>
                  Find Location
                </button>

                <button
                  onClick={() => {
                    setSearchMode(null);
                    setZipCode("");
                    setFullAddress("");
                    setName("");
                    setCaseName("");
                    setCaseNumber("");
                    setCaseStatus("");
                    setResults([]);
                    setError(null);
                  }}
                  className={styles.secondaryButton}
                >
                  Change Search Method
                </button> */}
              </>
            )}

            {error && <p className={styles.error}>{error}</p>}

            {results.length > 0 && (
              <div className={styles.resultsActions}>
                <button onClick={addAllResults} className={styles.addButton}>
                  Add All to Excel
                </button>
              </div>
            )}

            {trueListResults.length > 0 && (
              <div className={styles.resultsContainer}>
                {trueListResults.map((city, index) => (
                  <div key={`true-${index}`} className={styles.resultCard}>
                    <button
                      onClick={() => prepareToAdd(city)}
                      className={styles.addIconButton}
                      title="Add to Excel"
                    >
                      Add
                    </button>
                    <div className={styles.trueListBadge}>Preferred Choice</div>

                    {name && (
                      <div className={styles.smallText}>
                        <span>Input Info: </span>
                        <span className={styles.mediumText}>{name}</span>
                      </div>
                    )}
                    {searchMode === "zip" && caseName && (
                      <div className={styles.smallText}>
                        <span>Case Name: </span>
                        <span className={styles.mediumText}>{caseName}</span>
                      </div>
                    )}
                    {searchMode === "zip" && caseNumber && (
                      <div className={styles.smallText}>
                        <span>Case #: </span>
                        <span className={styles.mediumText}>{caseNumber}</span>
                      </div>
                    )}
                    {searchMode === "address" && (
                      <div className={styles.smallText}>
                        <span> </span>
                        <span className={styles.mediumText}>{address}</span>
                      </div>
                    )}
                    <div>
                      <span className={styles.smallText}>Region: </span>
                      <span className={styles.boldText}>
                        {city.region} California
                      </span>
                    </div>
                    <div>
                      <span className={styles.smallText}>City: </span>
                      <span className={styles.mediumText}>{city.city}</span>
                    </div>
                    <div>
                      <span className={styles.smallText}>County: </span>
                      <span className={styles.mediumText}>{city.county}</span>
                    </div>
                    <div>
                      <span className={styles.smallText}>ZIP Code: </span>
                      <span className={styles.mediumText}>{zipCode}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {otherResults.length > 0 && (
              <div>
                <button
                  onClick={() => setShowOthers(!showOthers)}
                  className={styles.toggleButton}
                >
                  {showOthers
                    ? "Hide Result"
                    : `Show Other Result for this city (${otherResults.length})`}
                </button>

                {showOthers && (
                  <div className={styles.otherResultsContainer}>
                    {otherResults.map((city, index) => (
                      <div
                        key={`other-${index}`}
                        className={styles.otherResultCard}
                      >
                        <button
                          onClick={() => prepareToAdd(city)}
                          className={styles.addIconButton}
                          title="Add to Excel"
                        >
                          Add
                        </button>

                        <div>
                          <span className={styles.smallText}>City: </span>
                          <span className={styles.mediumText}>{city.city}</span>
                        </div>
                        <div>
                          <span className={styles.smallText}>County: </span>
                          <span className={styles.mediumText}>
                            {city.county}
                          </span>
                        </div>
                        <div>
                          <span className={styles.smallText}>Region:</span>
                          <span className={styles.mediumText}>
                            {city.region} California
                          </span>
                        </div>
                        <div>
                          <span className={styles.smallText}>ZIP Code: </span>
                          <span className={styles.mediumText}>{zipCode}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Right side - Dashboard */}
        <div className={styles.dashboardSection}>
          <ZipDashboard onUpload={handleUploadedData} excelData={excelData} />
        </div>
      </div>

      <button
        onClick={toggleExcelPanel}
        className={styles.toggleExcelButton}
        title="Toggle Excel Panel"
      >
        📊
        {excelData.length > 0 && (
          <span className={styles.badge}>{excelData.length}</span>
        )}
      </button>

      {showExcelPanel && (
        <div className={styles.excelPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Excel Data Collection</h2>
            <button onClick={toggleExcelPanel} className={styles.closeButton}>
              &times;
            </button>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Filename:</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className={styles.fileInput}
            />
          </div>

          <div className={styles.actionButtons}>
            <button
              onClick={downloadExcel}
              className={styles.downloadButton}
              disabled={excelData.length === 0}
            >
              Download Excel
            </button>
            <button
              onClick={clearExcelData}
              className={styles.clearButton}
              disabled={excelData.length === 0}
            >
              Clear Data
            </button>
          </div>

          <div className={styles.dataSection}>
            <div className={styles.dataHeader}>
              <h3 className={styles.mediumText}>Collected Data</h3>
              <span className={styles.dataCount}>
                {excelData.length} entries
              </span>
            </div>

            <div className={styles.dataList}>
              {excelData.length === 0 ? (
                <p className={styles.emptyData}>No data collected yet</p>
              ) : (
                excelData.map((row, i) => (
                  <div key={i} className={styles.dataItem}>
                    <div className={styles.dataItemHeader}>
                      {/* <span className={styles.mediumText}>
                        {row.Name || "No name"}
                      </span> */}
                      {searchMode === "zip" && row["Case Name"] && (
                        <span className={styles.mediumText}>
                          {row["Case Name"]}
                        </span>
                      )}
                      {searchMode === "zip" && row["Case #"] && (
                        <span className={styles.mediumText}>
                          {row["Case #"]}
                        </span>
                      )}
                      {/* <span className={styles.dataItemMeta}>
                        {row["Added On"]}
                      </span> */}
                      <button
                        onClick={() => {
                          setExcelData((prev) =>
                            prev.filter((_, index) => index !== i)
                          );
                        }}
                        className={styles.deleteButton}
                        title="Delete entry"
                      >
                        ×
                      </button>
                    </div>
                    <div className={styles.mediumText}>{row.City}</div>
                    <div className={styles.dataItemMeta}>
                      {row["ZIP Code"]} • {row.County}
                      {searchMode === "address" &&
                        row.Address &&
                        ` • ${row.Address}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
