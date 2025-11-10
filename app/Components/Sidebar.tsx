"use client";
import Link from "next/link";
import { useState } from "react";
import styles from "../styles/Sidebar.module.css";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const correctPassword = "Aditya@2001"; // Use your password

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    setShowPasswordInput(false); // Reset password input when closing
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setAuthenticated(true);
      setShowPasswordInput(false);
    } else {
      alert("Incorrect password!");
      setPassword("");
    }
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
                href="/Temp"
                className={styles.sidebarLink}
                onClick={() => setIsOpen(false)}
              >
                Templates
              </Link>
            </li>

            {/* <li>
              <Link
                href="/Visualize"
                className={styles.sidebarLink}
                onClick={() => setIsOpen(false)}
              >
                Dashboards
              </Link>
            </li> */}

            {/* Protected Links */}
            {authenticated ? (
              <>
                <li>
                  <Link
                    href="/Depos"
                    className={styles.sidebarLink}
                    onClick={() => setIsOpen(false)}
                  >
                    💵 Depo Bill
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
                    href="/Call"
                    className={styles.sidebarLink}
                    onClick={() => setIsOpen(false)}
                  >
                    📞 Call
                  </Link>
                </li>
                {/* <li>
                  <Link
                    href="/Management"
                    className={styles.sidebarLink}
                    onClick={() => setIsOpen(false)}
                  >
                    💼 Management
                  </Link>
                </li> */}
              </>
            ) : (
              <li>
                {showPasswordInput ? (
                  <form
                    onSubmit={handlePasswordSubmit}
                    className={styles.sidebarPasswordForm}
                  >
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className={styles.sidebarPasswordInput}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className={styles.sidebarPasswordButton}
                    >
                      Unlock
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowPasswordInput(true)}
                    className={styles.sidebarAuthButton}
                  >
                    🔒 Unlock Features
                  </button>
                )}
              </li>
            )}
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
