import Link from "next/link";
import styles from "../styles/Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link href="/" className={styles.navLogo}>
          YourLogo
        </Link>
        <div className={styles.navLinks}>
          <Link href="/costing" className={styles.navLink}>
            Costing
          </Link>
          <Link href="Zip" className={styles.navLink}>
            Zip Codes
          </Link>
          <Link href="/about" className={styles.navLink}>
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
