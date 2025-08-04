// app/MainQME/QMESC/page.tsx
"use client";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import ViewQmeData from "../../../Components/ScheduledQmePanel";
import { QmeRecord } from "@/app/Utils/qme";

export default function QMESCPage() {
  const [savedRecords] = useLocalStorage<QmeRecord[]>("qmeRecords", []);

  return (
    <main className="container">
      <h1>QME Records</h1>
      <ViewQmeData records={savedRecords} />
    </main>
  );
}
