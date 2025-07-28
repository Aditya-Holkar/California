import Link from "next/link";
import styles from "../app/styles/Home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      Scr*w your qualifications. But,CAN YOU COOK 💊 ?
      <br className={styles.lineBreak}></br>
      <br className={styles.lineBreak}></br>
      <br className={styles.lineBreak}></br>
      Get the Info by putting Zip Codes:-
      <Link href={"Zip"} className={styles.link}>
        open
      </Link>
    </div>
  );
}
