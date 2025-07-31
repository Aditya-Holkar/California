// app/MainQME/layout.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import styles from "../../styles/lay.module.css";
import { Menu } from "lucide-react"; // Using just a simple menu icon

export default function MainQMELayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { name: "QME", href: "/MainQME/QME" },
    { name: "QMESC", href: "/MainQME/QMESC" },
  ];

  const handleTabClick = () => {
    setIsCollapsed(true); // Collapse the rail when a tab is clicked
  };

  return (
    <div className={styles.container}>
      {/* Toggle Button (Left Side) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={styles.toggleButton}
      >
        <Menu size={24} />
      </button>

      {/* Left Rail/Sidebar */}
      <div className={`${styles.rail} ${isCollapsed ? styles.collapsed : ""}`}>
        <div className={styles.railTabs}>
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`${styles.railTab} ${
                pathname.includes(tab.href) ? styles.railTabActive : ""
              }`}
              onClick={handleTabClick} // Add onClick handler to each tab
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>{children}</div>
    </div>
  );
}
