"use client";

import { useState } from "react";
import * as cheerio from "cheerio";
import styles from "../../styles/HtmlViewer.module.css";

interface WebsiteData {
  html: string;
  headers: Record<string, string>;
  status: number;
  finalUrl: string;
}

interface ContentBlock {
  type: "heading" | "paragraph" | "button" | "list" | "image" | "separator";
  content: string;
  level?: number; // For heading levels (h1-h6)
  href?: string; // For buttons and links
}

interface ExtractedData {
  metadata: Record<string, string>;
  links: { text: string; href: string }[];
  scripts: { src?: string; content?: string }[];
  styles: { href?: string; content?: string }[];
  images: { src: string; alt: string }[];
  tables: { html: string; text: string }[];
  contentBlocks: ContentBlock[];
  fullHtml?: string;
  headers?: Record<string, string>;
  status?: number;
  finalUrl?: string;
}

export default function HtmlViewer() {
  const [url, setUrl] = useState("https://hurtbadly.com/");
  const [extractedData, setExtractedData] = useState<ExtractedData>({
    metadata: {},
    links: [],
    scripts: [],
    styles: [],
    images: [],
    tables: [],
    contentBlocks: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAndParseHtml = async () => {
    if (!url) {
      setError("Please enter a URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/Api/fetch-html?url=${encodeURIComponent(url)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const data: WebsiteData = await response.json();
      const $ = cheerio.load(data.html);

      // Remove unwanted elements before extraction
      const unwantedSelectors = [
        "nav",
        "footer",
        "script",
        "style",
        "iframe",
        ".navbar",
        ".footer",
        ".sidebar",
        ".header",
        ".menu",
        ".social-links",
        ".ad",
        ".ads",
        ".advertisement",
        ".cookie-consent",
        ".newsletter",
        ".popup",
        ".modal",
        ".elementor-menu-toggle",
      ];

      unwantedSelectors.forEach((selector) => {
        $(selector).remove();
      });

      const extracted: ExtractedData = {
        metadata: {},
        links: [],
        scripts: [],
        styles: [],
        images: [],
        tables: [],
        contentBlocks: [],
        fullHtml: data.html,
        headers: data.headers,
        status: data.status,
        finalUrl: data.finalUrl,
      };

      // Extract metadata
      $("meta").each((i, element) => {
        const name =
          $(element).attr("name") || $(element).attr("property") || `meta-${i}`;
        const content = $(element).attr("content") || "";
        extracted.metadata[name] = content;
      });

      // Extract all links
      $("a").each((i, element) => {
        const href = $(element).attr("href");
        const text = $(element).text().trim();
        if (href) {
          extracted.links.push({
            text: text || "[no text]",
            href: new URL(href, data.finalUrl).toString(),
          });
        }
      });

      // Extract scripts
      $("script").each((i, element) => {
        const src = $(element).attr("src");
        const content = $(element).html();
        extracted.scripts.push({
          src: src ? new URL(src, data.finalUrl).toString() : undefined,
          content: content || undefined,
        });
      });

      // Extract styles
      $('style, link[rel="stylesheet"]').each((i, element) => {
        const tagName = $(element).prop("tagName")?.toLowerCase();
        if (tagName === "style") {
          extracted.styles.push({
            content: $(element).html() || undefined,
          });
        } else {
          const href = $(element).attr("href");
          if (href) {
            extracted.styles.push({
              href: new URL(href, data.finalUrl).toString(),
            });
          }
        }
      });

      // Extract images
      $("img").each((i, element) => {
        const src = $(element).attr("src");
        const alt = $(element).attr("alt") || "";
        if (src) {
          extracted.images.push({
            src: new URL(src, data.finalUrl).toString(),
            alt,
          });
        }
      });

      // Extract tables
      $("table").each((i, element) => {
        extracted.tables.push({
          html: $(element).html() || "",
          text: $(element).text().trim().replace(/\s+/g, " "),
        });
      });

      // Extract content blocks in order
      const contentBlocks: ContentBlock[] = [];

      // Process headings
      $("h1, h2, h3, h4, h5, h6").each((i, element) => {
        const tagName = $(element).prop("tagName").toLowerCase();
        const level = parseInt(tagName.replace("h", ""));
        const text = $(element).text().trim();
        if (text) {
          contentBlocks.push({
            type: "heading",
            content: text,
            level,
          });
        }
      });

      // Process paragraphs
      $("p").each((i, element) => {
        const text = $(element).text().trim();
        if (text && text.length > 20) {
          contentBlocks.push({
            type: "paragraph",
            content: text,
          });
        }
      });

      // Process buttons
      $(".elementor-button-text, button, .btn, .button").each((i, element) => {
        const text = $(element).text().trim();
        const href =
          $(element).attr("href") || $(element).closest("a").attr("href");
        if (text) {
          contentBlocks.push({
            type: "button",
            content: text,
            href: href ? new URL(href, data.finalUrl).toString() : undefined,
          });
        }
      });

      // Process lists
      $("ul, ol").each((i, element) => {
        const items: string[] = [];
        $(element)
          .find("li")
          .each((j, li) => {
            const text = $(li).text().trim();
            if (text) items.push(text);
          });

        if (items.length > 0) {
          contentBlocks.push({
            type: "list",
            content: items.join("\n• "),
          });
        }
      });

      // Add separators between sections
      $("section, .section, .elementor-section").each((i, element) => {
        const hasContent =
          $(element).find("h1, h2, h3, h4, h5, h6, p").length > 0;
        if (hasContent && contentBlocks.length > 0) {
          contentBlocks.push({
            type: "separator",
            content: "---",
          });
        }
      });

      // Filter and clean blocks
      extracted.contentBlocks = contentBlocks.filter(
        (block) =>
          block.content &&
          !block.content.match(/^\s*$/) &&
          !block.content.match(/[<>{}]/) &&
          !block.content.match(/^\s*(http|www\.)/i)
      );

      setExtractedData(extracted);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch or parse HTML"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderContentBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case "heading":
        const HeadingTag = `h${Math.min(
          6,
          block.level || 2
        )}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag key={index} className={styles.contentHeading}>
            {block.content}
          </HeadingTag>
        );

      case "paragraph":
        return (
          <p key={index} className={styles.contentParagraph}>
            {block.content}
          </p>
        );

      case "button":
        return (
          <div key={index} className={styles.contentButtonWrapper}>
            <a
              href={block.href || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contentButton}
            >
              {block.content}
            </a>
          </div>
        );

      case "list":
        return (
          <ul key={index} className={styles.contentList}>
            {block.content
              .split("•")
              .filter((item) => item.trim())
              .map((item, i) => (
                <li key={i}>{item.trim()}</li>
              ))}
          </ul>
        );

      case "separator":
        return <hr key={index} className={styles.contentSeparator} />;

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Complete Website Data Extractor</h1>

      <div className={styles.inputGroup}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL"
          className={styles.urlInput}
        />
        <button
          onClick={fetchAndParseHtml}
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? "Loading..." : "Extract All Data"}
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {extractedData.finalUrl && (
        <section className={styles.dataSection}>
          <h2 className={styles.sectionTitle}>Request Information</h2>
          <div className={styles.dataContainer}>
            <p>
              <strong>Final URL:</strong> {extractedData.finalUrl}
            </p>
            <p>
              <strong>Status Code:</strong> {extractedData.status}
            </p>
          </div>
        </section>
      )}

      {extractedData.contentBlocks.length > 0 && (
        <section className={styles.dataSection}>
          <h2 className={styles.sectionTitle}>Content Blocks</h2>
          <div
            className={`${styles.dataContainer} ${styles.contentBlocksContainer}`}
          >
            {extractedData.contentBlocks.map((block, index) =>
              renderContentBlock(block, index)
            )}
          </div>
        </section>
      )}

      {/* Other sections (metadata, links, images, etc.) remain the same */}
      {Object.keys(extractedData.metadata).length > 0 && (
        <section className={styles.dataSection}>
          <h2 className={styles.sectionTitle}>Metadata</h2>
          <div className={styles.dataContainer}>
            <ul className={styles.specificDataList}>
              {Object.entries(extractedData.metadata).map(([key, value]) => (
                <li key={key} className={styles.specificDataItem}>
                  <span className={styles.specificDataKey}>{key}:</span>
                  <div className={styles.specificDataValue}>
                    {value || "Not specified"}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {extractedData.links.length > 0 && (
        <section className={styles.dataSection}>
          <h2 className={styles.sectionTitle}>
            Links ({extractedData.links.length})
          </h2>
          <div className={styles.dataContainer}>
            <ul className={styles.linkList}>
              {extractedData.links.map((link, index) => (
                <li key={index} className={styles.linkItem}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.link}
                  >
                    {link.text} →{" "}
                    <span className={styles.linkUrl}>{link.href}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {extractedData.images.length > 0 && (
        <section className={styles.dataSection}>
          <h2 className={styles.sectionTitle}>
            Images ({extractedData.images.length})
          </h2>
          <div className={styles.dataContainer}>
            <div className={styles.imageGrid}>
              {extractedData.images.map((image, index) => (
                <div key={index} className={styles.imageItem}>
                  <img
                    src={image.src}
                    alt={image.alt}
                    className={styles.imageThumbnail}
                    loading="lazy"
                  />
                  <div className={styles.imageInfo}>
                    <div className={styles.imageAlt}>
                      {image.alt || "No alt text"}
                    </div>
                    <a
                      href={image.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.imageLink}
                    >
                      View Image
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {extractedData.tables.length > 0 && (
        <section className={styles.dataSection}>
          <h2 className={styles.sectionTitle}>
            Tables ({extractedData.tables.length})
          </h2>
          <div className={styles.dataContainer}>
            {extractedData.tables.map((table, index) => (
              <details key={index} className={styles.tableDetails}>
                <summary className={styles.tableSummary}>
                  Table {index + 1} ({table.text.substring(0, 50)}...)
                </summary>
                <div
                  className={styles.tableContent}
                  dangerouslySetInnerHTML={{ __html: table.html }}
                />
                <div className={styles.tableText}>
                  {table.text.substring(0, 500)}
                  {table.text.length > 500 ? "..." : ""}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {extractedData.fullHtml && (
        <section className={styles.dataSection}>
          <h2 className={styles.sectionTitle}>Complete HTML</h2>
          <div className={styles.dataContainer}>
            <details>
              <summary className={styles.tableSummary}>
                View Full HTML Content
              </summary>
              <pre
                className={`${styles.preformatted} ${styles.preformattedText}`}
              >
                {extractedData.fullHtml.substring(0, 5000)}
                {extractedData.fullHtml.length > 5000 ? "..." : ""}
              </pre>
            </details>
          </div>
        </section>
      )}
    </div>
  );
}
