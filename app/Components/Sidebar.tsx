"use client";
import Link from "next/link";
import { useState } from "react";
import styles from "../styles/Sidebar.module.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        onClick={toggleSidebar}
        className={`${styles.sidebarButton} ${
          isOpen ? styles.sidebarButtonOpen : ""
        }`}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? (
          <>
            <span className={styles.closeIcon}>✕</span> Close
          </>
        ) : (
          <>
            <span className={styles.menuIcon}>☰</span> Menu
          </>
        )}
      </button>

      <div className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarContent}>
          <h2 className={styles.sidebarTitle}>Quick Navigation</h2>
          <ul className={styles.sidebarList}>
            <li>
              <Link
                href="/"
                className={styles.sidebarLink}
                onClick={() => setIsOpen(false)}
              >
                🏠 Home
              </Link>
            </li>
            <li>
              <Link
                href="/Zip"
                className={styles.sidebarLink}
                onClick={() => setIsOpen(false)}
              >
                📍 Zip Code Search
              </Link>
            </li>
            <li>
              <Link
                href="/MainQME"
                className={styles.sidebarLink}
                onClick={() => setIsOpen(false)}
              >
                🩺 QME
              </Link>
            </li>
            <li>
              <Link
                href="/Management"
                className={styles.sidebarLink}
                onClick={() => setIsOpen(false)}
              >
                💼 Management
              </Link>
            </li>
            <li>
              <Link
                href="/Depo-bill"
                className={styles.sidebarLink}
                onClick={() => setIsOpen(false)}
              >
                💵 Depo Bill
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
        onClick={toggleSidebar}
      />
    </>
  );
}
