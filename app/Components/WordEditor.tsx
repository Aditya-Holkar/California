/* eslint-disable @typescript-eslint/no-unused-vars */
// components/WordEditor/WordEditor.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import styles from "../styles/WordEditor.module.css";
import { processDocxFile } from "../Utils/docxProcessor";

interface Replacement {
  find: string;
  replace: string;
}

interface WordEditorProps {
  onContentChange?: (content: string) => void;
}

const WordEditor: React.FC<WordEditorProps> = ({ onContentChange }) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [replacements, setReplacements] = useState<Replacement[]>([
    { find: "", replace: "" },
  ]);
  const [fileName, setFileName] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedContent, setEditedContent] = useState<string>("");

  // Extract words within <> brackets from content
  const extractBracketedWords = (content: string): string[] => {
    const regex = /<([^>]+)>/g;
    const matches = content.match(regex);
    if (!matches) return [];

    // Remove the < and > brackets and return unique values
    return Array.from(
      new Set(matches.map((match) => match.replace(/<|>/g, "").trim()))
    );
  };

  // Update replacements when content changes
  useEffect(() => {
    if (htmlContent) {
      const bracketedWords = extractBracketedWords(htmlContent);
      if (bracketedWords.length > 0) {
        const newReplacements = bracketedWords.map((word) => ({
          find: word,
          replace: "",
        }));
        setReplacements(newReplacements);
      }
    }
  }, [htmlContent]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    try {
      const content = await processDocxFile(file);
      setHtmlContent(content);
      setEditedContent(content);
      setIsEditing(true);
      onContentChange?.(content);
    } catch (error) {
      console.error("Error processing Word document:", error);
      alert(
        "Error processing Word document. Please make sure it's a valid .docx file."
      );
    }
  };

  const handleAddReplacement = () => {
    setReplacements([...replacements, { find: "", replace: "" }]);
  };

  const handleReplacementChange = (
    index: number,
    field: keyof Replacement,
    value: string
  ) => {
    const newReplacements = [...replacements];
    newReplacements[index][field] = value;
    setReplacements(newReplacements);
  };

  const handleRemoveReplacement = (index: number) => {
    if (replacements.length > 1) {
      setReplacements(replacements.filter((_, i) => i !== index));
    }
  };

  const handleApplyReplacements = () => {
    let newContent = editedContent;

    replacements.forEach(({ find, replace }) => {
      if (find) {
        // Create a regex pattern that accounts for potential whitespace variations
        // This will match <replace word 1>, < replace word 1 >, etc.
        const pattern = new RegExp(`<\\s*${find}\\s*>`, "gi");
        newContent = newContent.replace(pattern, replace);
      }
    });

    setEditedContent(newContent);
    onContentChange?.(newContent);
  };

  const handleContentEdit = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.innerHTML;
    setEditedContent(newContent);
    onContentChange?.(newContent);
  };

  const handleDownload = () => {
    // Create a blob and download link for the edited content
    const blob = new Blob([editedContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName
      ? `edited_${fileName.replace(".docx", ".html")}`
      : "edited_document.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      {/* File Upload Section */}
      <div className={styles.uploadSection}>
        <h2>Word Document Editor</h2>
        <div className={styles.uploadArea}>
          <input
            type="file"
            id="file-upload"
            accept=".docx,.doc"
            onChange={handleFileUpload}
            className={styles.fileInput}
          />
          <label htmlFor="file-upload" className={styles.fileInputLabel}>
            <div className={styles.uploadContent}>
              <span className={styles.uploadIcon}>📄</span>
              <p className={styles.uploadText}>
                Choose a Word document to upload
              </p>
              <p className={styles.uploadSubtext}>
                Supports .doc and .docx files
              </p>
            </div>
          </label>
        </div>

        {fileName && (
          <div className={styles.fileInfo}>
            <span className={styles.fileIcon}>📋</span>
            <span className={styles.fileName}>{fileName}</span>
          </div>
        )}
      </div>

      {/* Replacements Form */}
      {isEditing && (
        <div className={styles.replacementsSection}>
          <div className={styles.sectionCard}>
            <h3>Word Replacement</h3>
            <p className={styles.instruction}>
              Words in &lt;brackets&gt; from your document have been
              automatically detected. Enter replacement values for each.
            </p>

            {replacements.map((replacement, index) => (
              <div key={index} className={styles.replacementRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Find Word</label>
                  <input
                    type="text"
                    value={replacement.find}
                    onChange={(e) =>
                      handleReplacementChange(index, "find", e.target.value)
                    }
                    placeholder="Enter word to find"
                    className={styles.textInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>Replace With</label>
                  <input
                    type="text"
                    value={replacement.replace}
                    onChange={(e) =>
                      handleReplacementChange(index, "replace", e.target.value)
                    }
                    placeholder="Enter replacement word"
                    className={styles.textInput}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveReplacement(index)}
                  className={styles.removeButton}
                  disabled={replacements.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}

            <div className={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleAddReplacement}
                className={styles.addButton}
              >
                Add Another Replacement
              </button>

              <button
                type="button"
                onClick={handleApplyReplacements}
                className={styles.applyButton}
              >
                Apply Replacements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview/Editor */}
      {isEditing && (
        <div className={styles.editorSection}>
          <div className={styles.sectionCard}>
            <div className={styles.editorHeader}>
              <h3>Document Editor</h3>
              <button
                onClick={handleDownload}
                className={styles.downloadButton}
              >
                Download Edited Document
              </button>
            </div>

            <div
              contentEditable
              dangerouslySetInnerHTML={{ __html: editedContent }}
              onInput={handleContentEdit}
              className={styles.editor}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WordEditor;
