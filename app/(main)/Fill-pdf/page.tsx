"use client";
import { DocumentFiller } from "../../Components/pdf-filler";
import { useState } from "react";

export default function DocumentFormPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [documentFile, setDocumentFile] = useState<File | undefined>(undefined);
  const [useTemplate, setUseTemplate] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fields = [
    {
      name: "fullName",
      label: "Full Name",
      x: 100,
      y: 500,
      page: 1,
      width: 200,
      placeholder: "Enter your full name",
    },
    {
      name: "date",
      label: "Date",
      x: 100,
      y: 480,
      page: 1,
      placeholder: "Enter the date",
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileChange = (file: File) => {
    setDocumentFile(file);
    setUseTemplate(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Document Form Filler</h1>

      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">
          1. Select Document Source
        </h2>

        <div className="flex items-center mb-4">
          <input
            type="radio"
            id="useTemplate"
            checked={useTemplate}
            onChange={() => setUseTemplate(true)}
            className="mr-2"
          />
          <label htmlFor="useTemplate" className="mr-4">
            Use Template Document
          </label>

          <input
            type="radio"
            id="uploadDocument"
            checked={!useTemplate}
            onChange={() => setUseTemplate(false)}
            className="mr-2"
          />
          <label htmlFor="uploadDocument">Upload Your Own Document</label>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">2. Fill the Form</h2>

      <DocumentFiller downloadFileName="case-document" />
    </div>
  );
}
