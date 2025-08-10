"use client";
import dynamic from "next/dynamic";

const DepositionCalculator = dynamic(
  () => import("../../Components/DepositionCalculator"),
  { ssr: false }
);

export default function DepoBillPage() {
  return <DepositionCalculator />;
}
