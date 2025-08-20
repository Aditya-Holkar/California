"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "../app/styles/Home.module.css";

export default function Home() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const correctPassword = "Aditya@2001";

  const konamiCode = ["ArrowUp", "ArrowUp"];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newSequence = [...keySequence, e.key];
      setKeySequence(newSequence.slice(-konamiCode.length));

      if (newSequence.join() === konamiCode.join()) {
        setShowPasswordInput(true);
        setKeySequence([]);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [keySequence]);

  useEffect(() => {
    if (tapCount >= 3) {
      setShowPasswordInput(true);
      setTapCount(0);
    }
  }, [tapCount]);

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
    <div className={styles.container}>
      <h1 className={styles.title}>
        Scr*w your qualifications.
        <br />
        But, <span className={styles.highlight}>CAN YOU COOK</span>{" "}
        {!authenticated && !showPasswordInput && (
          <span
            onClick={() => setTapCount((prev) => prev + 1)}
            style={{ cursor: "pointer" }}
            className={styles.pillEmoji}
          >
            💊
          </span>
        )}
        ?
      </h1>

      <div className={styles.divider}></div>

      <p className={styles.subtitle}>
        See the below Tabs That you wanted to cook inside.
      </p>

      <div className={styles.linkContainer}>
        <Link href="/Zip" className={styles.link}>
          Zip Code Search
        </Link>
        <Link href="/Depo-bill" className={styles.link}>
          Depo Bill
        </Link>

        {authenticated ? (
          <>
            <Link href="/MainQME" className={styles.link}>
              QME
            </Link>

            <Link href="/Call" className={styles.link}>
              Call
            </Link>

            <Link href="/Management" className={styles.link}>
              Management
            </Link>
          </>
        ) : (
          showPasswordInput && (
            <div className={styles.passwordContainer}>
              <form onSubmit={handlePasswordSubmit}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret password"
                  className={styles.passwordInput}
                  autoFocus
                />
                <button type="submit" className={styles.passwordButton}>
                  Unlock
                </button>
              </form>
            </div>
          )
        )}
      </div>
    </div>
  );
}
