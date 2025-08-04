// types.ts
export interface Category {
  id: string;
  name: string;
  type: "income" | "expense" | "uncategorized";
}

export interface Transaction {
  id: string;
  categoryId: string | null; // Allow null for uncategorized
  amount: number;
  date: Date;
  description: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  uncategorizedAmount: number;
  balance: number;
  expensesByCategory: { [categoryId: string]: number };
}
