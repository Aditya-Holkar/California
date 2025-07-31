import Link from "next/link";
import styles from "../app/styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Scr*w your qualifications.
        <br />
        But, <span className={styles.highlight}>CAN YOU COOK</span> 💊?
      </h1>

      <div className={styles.divider}></div>

      <p className={styles.subtitle}>
        See the below Tabs That you are looking for
      </p>

      <div className={styles.linkContainer}>
        <Link href="/Zip" className={styles.link}>
          Zip Code Search
        </Link>
        <Link href="/MainQME" className={styles.link}>
          QME Management
        </Link>
        <Link href="/costing" className={styles.link}>
          Costing
        </Link>
      </div>
    </div>
  );
}
