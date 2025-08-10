/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

interface DocumentField {
  name: string;
  label: string;
  x?: number;
  y?: number;
  page?: number;
  width?: number;
  placeholder?: string;
  defaultValue?: string;
}

interface DocumentFillerProps {
  templateUrl?: string;
  fields?: DocumentField[];
  downloadFileName?: string;
  file?: File;
  acceptedFormats?: string[];
  onFileUpload?: (file: File) => void;
}

const DEFAULT_FIELDS: DocumentField[] = [
  { name: "caseNumber", label: "Case #", placeholder: "Enter case number" },
  { name: "caseName", label: "Case Name", placeholder: "Enter case name" },
  { name: "adjNumber", label: "ADJ #", placeholder: "Enter ADJ number" },
  { name: "claimNumber", label: "Claim #", placeholder: "Enter claim number" },
  { name: "dob", label: "DOB", placeholder: "Enter date of birth" },
  { name: "name", label: "Name", placeholder: "Enter name" },
  { name: "phone", label: "Phone", placeholder: "Enter phone number" },
  {
    name: "lawOffice",
    label: "Law Office",
    placeholder: "Enter law office name",
  },
  {
    name: "addressLine1",
    label: "Address Line 1",
    placeholder: "Enter address line 1",
  },
  {
    name: "addressLine2",
    label: "Address Line 2",
    placeholder: "Enter address line 2",
  },
];

const STORAGE_KEY = "documentFillerData";

export const DocumentFiller = ({
  templateUrl,
  fields = DEFAULT_FIELDS,
  downloadFileName = "filled-document",
  file,
  acceptedFormats = [".pdf", ".docx"],
  onFileUpload,
}: DocumentFillerProps) => {
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    }
    return fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue || "";
      return acc;
    }, {} as Record<string, string>);
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputFormat, setOutputFormat] = useState<"pdf" | "docx">("pdf");
  const [templatePreview, setTemplatePreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTemplatePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [file]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formValues));
  }, [formValues]);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = containerRect.right - e.clientX;

      if (newWidth > 300 && newWidth < 800) {
        setPreviewWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        if (onFileUpload) {
          onFileUpload(acceptedFiles[0]);
        }
        setError(null);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    multiple: false,
  });

  const handleInputChange = (fieldName: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handlePreviewEdit = (fieldName: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const clearForm = () => {
    setFormValues(
      fields.reduce((acc, field) => {
        acc[field.name] = "";
        return acc;
      }, {} as Record<string, string>)
    );
  };

  const fillPDF = async (pdfBytes: Uint8Array): Promise<Uint8Array> => {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    fields.forEach((field) => {
      if (
        !formValues[field.name] ||
        field.x === undefined ||
        field.y === undefined
      )
        return;

      const pageIndex = field.page ? field.page - 1 : 0;
      const page = pdfDoc.getPage(pageIndex);

      page.drawText(formValues[field.name], {
        x: field.x,
        y: field.y,
        size: 12,
        font,
        color: rgb(0, 0, 0),
        maxWidth: field.width,
      });
    });

    return await pdfDoc.save();
  };

  const createWordDocument = async (): Promise<Document> => {
    const document = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Case #: ${formValues.caseNumber || ""}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Case Name: ${formValues.caseName || ""}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `ADJ #: ${formValues.adjNumber || ""}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Claim #: ${formValues.claimNumber || ""}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `DOB: ${formValues.dob || ""}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: formValues.name || "",
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: formValues.phone || "",
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: formValues.lawOffice || "",
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: formValues.addressLine1 || "",
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: formValues.addressLine2 || "",
                }),
              ],
            }),
          ],
        },
      ],
    });

    return document;
  };

  const generateFilledDocument = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      let outputBlob: Blob;
      const extension = outputFormat;

      if (outputFormat === "pdf") {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        let yPosition = 750;
        const lineHeight = 25;

        page.drawText(`Case #: ${formValues.caseNumber || ""}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;

        page.drawText(`Case Name: ${formValues.caseName || ""}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;

        page.drawText(`ADJ #: ${formValues.adjNumber || ""}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;

        page.drawText(`Claim #: ${formValues.claimNumber || ""}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;

        page.drawText(`DOB: ${formValues.dob || ""}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight * 2;

        page.drawText(formValues.name || "", {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;

        page.drawText(formValues.phone || "", {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;

        page.drawText(formValues.lawOffice || "", {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;

        page.drawText(formValues.addressLine1 || "", {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });
        yPosition -= lineHeight;

        page.drawText(formValues.addressLine2 || "", {
          x: 50,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        });

        const pdfBytes = await pdfDoc.save();
        outputBlob = new Blob([new Uint8Array(pdfBytes)], {
          type: "application/pdf",
        });
      } else {
        const doc = await createWordDocument();
        outputBlob = await Packer.toBlob(doc);
      }

      saveAs(outputBlob, `${downloadFileName}.${extension}`);
    } catch (err) {
      console.error("Error generating document:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Main form area */}
      <div
        className={`bg-white p-6 overflow-auto ${
          showPreview ? "w-2/3" : "w-full"
        }`}
        ref={containerRef}
      >
        <div className="space-y-6 max-w-3xl mx-auto">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {!file && !templateUrl && (
            <div
              {...getRootProps()}
              className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer ${
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the document here...</p>
              ) : (
                <p>Drag & drop a document here, or click to select a file</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: PDF, DOCX
              </p>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={formValues[field.name]}
                    onChange={(e) =>
                      handleInputChange(field.name, e.target.value)
                    }
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-full sm:w-auto">
                <button
                  onClick={clearForm}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Form
                </button>
              </div>

              <div className="w-full sm:w-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="outputFormat"
                      value="pdf"
                      checked={outputFormat === "pdf"}
                      onChange={() => setOutputFormat("pdf")}
                    />
                    <span className="ml-2">PDF</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="outputFormat"
                      value="docx"
                      checked={outputFormat === "docx"}
                      onChange={() => setOutputFormat("docx")}
                    />
                    <span className="ml-2">Word</span>
                  </label>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <button
                  onClick={generateFilledDocument}
                  disabled={isGenerating}
                  className={`w-full px-6 py-3 rounded-md font-medium text-white ${
                    isGenerating
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  }`}
                >
                  {isGenerating
                    ? "Generating Document..."
                    : `Download as ${outputFormat.toUpperCase()}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview panel */}
      {showPreview && (
        <div
          className="bg-white border-l border-gray-200 overflow-auto relative"
          style={{ width: `${previewWidth}px` }}
          ref={previewRef}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize"
            onMouseDown={() => setIsResizing(true)}
          ></div>

          <div className="p-4 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Document Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-gray-50 border border-gray-200 rounded">
              {templatePreview ? (
                <iframe
                  src={templatePreview}
                  className="w-full h-full border-0"
                  title="Template Preview"
                />
              ) : (
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <input
                      type="text"
                      value={`Case #: ${formValues.caseNumber}`}
                      onChange={(e) =>
                        handlePreviewEdit(
                          "caseNumber",
                          e.target.value.replace("Case #: ", "")
                        )
                      }
                      className="w-full bg-transparent border-none focus:ring-0 font-bold"
                    />
                  </div>
                  <div className="border-b pb-2">
                    <input
                      type="text"
                      value={`Case Name: ${formValues.caseName}`}
                      onChange={(e) =>
                        handlePreviewEdit(
                          "caseName",
                          e.target.value.replace("Case Name: ", "")
                        )
                      }
                      className="w-full bg-transparent border-none focus:ring-0 font-bold"
                    />
                  </div>
                  <div className="border-b pb-2">
                    <input
                      type="text"
                      value={`ADJ #: ${formValues.adjNumber}`}
                      onChange={(e) =>
                        handlePreviewEdit(
                          "adjNumber",
                          e.target.value.replace("ADJ #: ", "")
                        )
                      }
                      className="w-full bg-transparent border-none focus:ring-0 font-bold"
                    />
                  </div>
                  <div className="border-b pb-2">
                    <input
                      type="text"
                      value={`Claim #: ${formValues.claimNumber}`}
                      onChange={(e) =>
                        handlePreviewEdit(
                          "claimNumber",
                          e.target.value.replace("Claim #: ", "")
                        )
                      }
                      className="w-full bg-transparent border-none focus:ring-0 font-bold"
                    />
                  </div>
                  <div className="border-b pb-2">
                    <input
                      type="text"
                      value={`DOB: ${formValues.dob}`}
                      onChange={(e) =>
                        handlePreviewEdit(
                          "dob",
                          e.target.value.replace("DOB: ", "")
                        )
                      }
                      className="w-full bg-transparent border-none focus:ring-0 font-bold"
                    />
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      value={formValues.name}
                      onChange={(e) =>
                        handlePreviewEdit("name", e.target.value)
                      }
                      className="w-full bg-transparent border-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formValues.phone}
                      onChange={(e) =>
                        handlePreviewEdit("phone", e.target.value)
                      }
                      className="w-full bg-transparent border-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formValues.lawOffice}
                      onChange={(e) =>
                        handlePreviewEdit("lawOffice", e.target.value)
                      }
                      className="w-full bg-transparent border-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formValues.addressLine1}
                      onChange={(e) =>
                        handlePreviewEdit("addressLine1", e.target.value)
                      }
                      className="w-full bg-transparent border-none focus:ring-0"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={formValues.addressLine2}
                      onChange={(e) =>
                        handlePreviewEdit("addressLine2", e.target.value)
                      }
                      className="w-full bg-transparent border-none focus:ring-0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show preview button when preview is hidden */}
      {!showPreview && (
        <button
          onClick={() => setShowPreview(true)}
          className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-l-lg shadow-md border border-r-0 border-gray-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
