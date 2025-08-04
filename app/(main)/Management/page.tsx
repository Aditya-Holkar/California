// app/manage/page.tsx
"use client";

// import Manage from "../../Components/Manage";
import dynamic from "next/dynamic";

// Dynamically import the component that uses `window` with SSR disabled
const Manage = dynamic(
  () => import("../../Components/Manage"), // Replace with your component
  { ssr: false }
);

export default function ManagePage() {
  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Manage />
    </div>
  );
}
