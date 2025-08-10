"use client";
// app/deposition-bill/page.tsx
import DepositionCalculator from "../../Components/DepositionCalculator";

export default function DepositionBillPage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Deposition Bill Calculation</h1>
      <DepositionCalculator />
    </main>
  );
}
