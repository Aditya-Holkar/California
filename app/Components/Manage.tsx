/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Manage.tsx
import { useState, useEffect } from "react";
import { Category, Transaction, FinancialSummary } from "../Utils/manage";
import styles from "../styles/Manage.module.css";

const Manage = () => {
  // State management
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editingTransactionData, setEditingTransactionData] =
    useState<Transaction | null>(null);
  const [editingCategoryData, setEditingCategoryData] =
    useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    type: "expense" as "income" | "expense",
  });
  const [newTransaction, setNewTransaction] = useState({
    categoryId: null as string | null,
    amount: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    uncategorizedAmount: 0,
    balance: 0,
    expensesByCategory: {},
  });
  const [editingTransactionId, setEditingTransactionId] = useState<
    string | null
  >(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null
  );

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadData = () => {
      try {
        const savedCategories = localStorage.getItem("categories");
        const savedTransactions = localStorage.getItem("transactions");

        if (savedCategories) setCategories(JSON.parse(savedCategories));
        if (savedTransactions) {
          const parsedTransactions = JSON.parse(savedTransactions);
          const transactionsWithDates = parsedTransactions.map((t: any) => ({
            ...t,
            date: new Date(t.date),
          }));
          setTransactions(transactionsWithDates);
        }
      } catch (error) {
        console.error("Failed to load data from localStorage", error);
      }
    };

    loadData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  // Calculate summary whenever transactions or categories change
  useEffect(() => {
    calculateSummary();
  }, [transactions, categories]);

  const calculateSummary = () => {
    let totalIncome = 0;
    let totalExpenses = 0;
    let uncategorizedAmount = 0;
    const expensesByCategory: { [key: string]: number } = {};

    transactions.forEach((transaction) => {
      if (transaction.categoryId === null) {
        uncategorizedAmount += transaction.amount;
        return;
      }

      const category = categories.find((c) => c.id === transaction.categoryId);
      if (category) {
        if (category.type === "income") {
          totalIncome += transaction.amount;
        } else {
          totalExpenses += transaction.amount;
          expensesByCategory[category.id] =
            (expensesByCategory[category.id] || 0) + transaction.amount;
        }
      }
    });

    setSummary({
      totalIncome,
      totalExpenses,
      uncategorizedAmount,
      balance: totalIncome - totalExpenses,
      expensesByCategory,
    });
  };

  // Update the category editing functions
  const startEditingCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryData({ ...category });
  };

  const cancelEditingCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryData(null);
  };

  const saveCategory = () => {
    if (editingCategoryData) {
      updateCategory(editingCategoryId!, editingCategoryData);
    }
  };

  // Update the transaction editing functions
  const startEditingTransaction = (transaction: Transaction) => {
    setEditingTransactionId(transaction.id);
    setEditingTransactionData({ ...transaction });
  };

  const cancelEditingTransaction = () => {
    setEditingTransactionId(null);
    setEditingTransactionData(null);
  };

  const saveTransaction = () => {
    if (editingTransactionData) {
      updateTransaction(editingTransactionId!, editingTransactionData);
    }
  };

  const addCategory = () => {
    if (!newCategory.name.trim()) return;

    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      type: newCategory.type,
    };

    setCategories([...categories, category]);
    setNewCategory({
      name: "",
      type: "expense",
    });
  };

  const updateCategory = (id: string, updatedCategory: Partial<Category>) => {
    setCategories(
      categories.map((cat) =>
        cat.id === id ? { ...cat, ...updatedCategory } : cat
      )
    );
    setEditingCategoryId(null);
  };

  const deleteCategory = (id: string) => {
    // Check if category is used in any transactions
    const isUsed = transactions.some((t) => t.categoryId === id);
    if (isUsed) {
      alert(
        "Cannot delete category that is used in transactions. Please reassign those transactions first."
      );
      return;
    }

    if (confirm("Are you sure you want to delete this category?")) {
      setCategories(categories.filter((cat) => cat.id !== id));
    }
  };

  const addTransaction = () => {
    if (newTransaction.amount <= 0) return;

    const transaction: Transaction = {
      id: Date.now().toString(),
      categoryId: newTransaction.categoryId,
      amount: parseFloat(newTransaction.amount.toString()),
      description: newTransaction.description,
      date: new Date(newTransaction.date),
    };

    setTransactions([...transactions, transaction]);
    setNewTransaction({
      categoryId: null,
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const updateTransaction = (
    id: string,
    updatedTransaction: Partial<Transaction>
  ) => {
    setTransactions(
      transactions.map((t) =>
        t.id === id ? { ...t, ...updatedTransaction } : t
      )
    );
    setEditingTransactionId(null);
  };

  const deleteTransaction = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      setTransactions(transactions.filter((t) => t.id !== id));
    }
  };

  const deleteAllData = () => {
    if (
      confirm(
        "Are you sure you want to delete ALL data? This cannot be undone."
      )
    ) {
      localStorage.removeItem("categories");
      localStorage.removeItem("transactions");
      setCategories([]);
      setTransactions([]);
    }
  };

  const assignCategoryToTransaction = (
    transactionId: string,
    categoryId: string | null
  ) => {
    setTransactions(
      transactions.map((t) =>
        t.id === transactionId ? { ...t, categoryId } : t
      )
    );
  };

  const [showRail, setShowRail] = useState(false);

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Financial Management</h1>

      <>
        {/* Enhanced Toggle Button with Icon */}
        <button
          className={styles.railToggle}
          onClick={() => setShowRail(!showRail)}
          style={{ display: window.innerWidth <= 768 ? "flex" : "none" }}
        >
          {showRail ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Hide
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
              Summary
            </>
          )}
        </button>

        {/* Enhanced Summary Card */}
        <div
          className={`${styles.rightSideSummary} ${
            showRail || window.innerWidth > 768 ? styles.show : ""
          }`}
        >
          <div className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Financial Overview</h3>
            <div className={styles.summaryItem}>
              <span>Income</span>
              <span className={styles.income}>
                ${summary.totalIncome.toFixed(2)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span>Expenses</span>
              <span className={styles.expense}>
                ${summary.totalExpenses.toFixed(2)}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span>Balance</span>
              <span
                className={
                  summary.balance >= 0 ? styles.positive : styles.negative
                }
              >
                ${summary.balance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </>

      {/* Financial Summary */}
      <div className={styles.summaryContainer}>
        <h2 className={styles.summaryTitle}>Summary</h2>
        <div className={styles.summaryGrid}>
          <div className={`${styles.summaryCard} ${styles.incomeCard}`}>
            <p className={styles.summaryCardLabel}>Total Income</p>
            <p className={`${styles.summaryCardValue} ${styles.incomeValue}`}>
              ${summary.totalIncome.toFixed(2)}
            </p>
          </div>
          <div className={`${styles.summaryCard} ${styles.expenseCard}`}>
            <p className={styles.summaryCardLabel}>Total Expenses</p>
            <p className={`${styles.summaryCardValue} ${styles.expenseValue}`}>
              ${summary.totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className={`${styles.summaryCard} ${styles.uncategorizedCard}`}>
            <p className={styles.summaryCardLabel}>Uncategorized</p>
            <p
              className={`${styles.summaryCardValue} ${styles.uncategorizedValue}`}
            >
              ${summary.uncategorizedAmount.toFixed(2)}
            </p>
          </div>
          <div
            className={`${styles.summaryCard} ${
              summary.balance >= 0
                ? styles.balanceCardPositive
                : styles.balanceCardNegative
            }`}
          >
            <p className={styles.summaryCardLabel}>Balance</p>
            <p
              className={`${styles.summaryCardValue} ${
                summary.balance >= 0
                  ? styles.balanceValuePositive
                  : styles.balanceValueNegative
              }`}
            >
              ${summary.balance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className={styles.formLayout}>
        {/* Categories Section */}
        <div className={styles.formPanel}>
          <h2 className={styles.formTitle}>Categories</h2>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>New Category Name</label>
            <input
              type="text"
              placeholder="e.g. Groceries, Salary"
              className={styles.formInput}
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Type</label>
            <select
              className={styles.formSelect}
              value={newCategory.type}
              onChange={(e) =>
                setNewCategory({
                  ...newCategory,
                  type: e.target.value as "income" | "expense",
                })
              }
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          <button
            onClick={addCategory}
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            Add Category
          </button>

          {/* Categories List */}
          {/* Categories List */}
          <div className={styles.categoriesList}>
            <h3 className={styles.subTitle}>Existing Categories</h3>
            {categories.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>📋</div>
                <p>No categories yet. Add your first category above!</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.categoriesTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className={
                          editingCategoryId === category.id
                            ? styles.editingRow
                            : ""
                        }
                      >
                        <td>
                          {editingCategoryId === category.id ? (
                            <input
                              type="text"
                              value={editingCategoryData?.name || ""}
                              onChange={(e) =>
                                setEditingCategoryData((prev) =>
                                  prev
                                    ? { ...prev, name: e.target.value }
                                    : null
                                )
                              }
                              className={styles.inlineInput}
                            />
                          ) : (
                            <span className={styles.categoryName}>
                              {category.name}
                            </span>
                          )}
                        </td>
                        <td>
                          {editingCategoryId === category.id ? (
                            <select
                              value={editingCategoryData?.type || "expense"}
                              onChange={(e) =>
                                setEditingCategoryData((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        type: e.target.value as
                                          | "income"
                                          | "expense",
                                      }
                                    : null
                                )
                              }
                              className={styles.inlineSelect}
                            >
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                          ) : (
                            <span
                              className={
                                category.type === "income"
                                  ? styles.incomeType
                                  : styles.expenseType
                              }
                            >
                              {category.type.charAt(0).toUpperCase() +
                                category.type.slice(1)}
                            </span>
                          )}
                        </td>
                        <td className={styles.actionsCell}>
                          {editingCategoryId === category.id ? (
                            <>
                              <button
                                onClick={saveCategory}
                                className={`${styles.button} ${styles.buttonSmall} ${styles.buttonSuccess}`}
                              >
                                Save
                              </button>
                              <button
                                onClick={cancelEditingCategory}
                                className={`${styles.button} ${styles.buttonSmall} ${styles.buttonDanger}`}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditingCategory(category)}
                                className={`${styles.button} ${styles.buttonSmall} ${styles.buttonPrimary}`}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteCategory(category.id)}
                                className={`${styles.button} ${styles.buttonSmall} ${styles.buttonDanger}`}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Transaction Section */}
        <div className={styles.formPanel}>
          <h2 className={styles.formTitle}>Add Transaction</h2>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Amount</label>
            <input
              type="number"
              placeholder="0.00"
              className={styles.formInput}
              value={newTransaction.amount}
              onChange={(e) =>
                setNewTransaction({
                  ...newTransaction,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description</label>
            <input
              type="text"
              placeholder="What was this for?"
              className={styles.formInput}
              value={newTransaction.description}
              onChange={(e) =>
                setNewTransaction({
                  ...newTransaction,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Date</label>
            <input
              type="date"
              className={styles.formInput}
              value={newTransaction.date}
              onChange={(e) =>
                setNewTransaction({ ...newTransaction, date: e.target.value })
              }
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Category (optional)</label>
            <select
              className={styles.formSelect}
              value={newTransaction.categoryId || ""}
              onChange={(e) =>
                setNewTransaction({
                  ...newTransaction,
                  categoryId: e.target.value || null,
                })
              }
            >
              <option value="">-- Uncategorized --</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.type})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={addTransaction}
            className={`${styles.button} ${styles.buttonSuccess}`}
          >
            Add Transaction
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      {/* Transactions Table Section */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.formTitle}>Transactions</h2>
          {/* <button
            onClick={deleteAllData}
            className={`${styles.button} ${styles.buttonDanger}`}
          >
            Delete All Data
          </button> */}
        </div>

        {transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📊</div>
            <p>No transactions yet. Add your first transaction above!</p>
          </div>
        ) : (
          <table className={styles.transactionsTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...transactions]
                .sort((a, b) => b.date.getTime() - a.date.getTime())
                .map((transaction) => {
                  const category = transaction.categoryId
                    ? categories.find((c) => c.id === transaction.categoryId)
                    : null;

                  return (
                    <tr
                      key={transaction.id}
                      className={
                        editingTransactionId === transaction.id
                          ? styles.editingRow
                          : ""
                      }
                    >
                      <td>
                        {editingTransactionId === transaction.id ? (
                          <input
                            type="date"
                            value={
                              editingTransactionData?.date
                                .toISOString()
                                .split("T")[0] || ""
                            }
                            onChange={(e) =>
                              setEditingTransactionData((prev) =>
                                prev
                                  ? { ...prev, date: new Date(e.target.value) }
                                  : null
                              )
                            }
                            className={styles.inlineInput}
                          />
                        ) : (
                          transaction.date.toLocaleDateString()
                        )}
                      </td>
                      <td>
                        {editingTransactionId === transaction.id ? (
                          <input
                            type="text"
                            value={editingTransactionData?.description || ""}
                            onChange={(e) =>
                              setEditingTransactionData((prev) =>
                                prev
                                  ? { ...prev, description: e.target.value }
                                  : null
                              )
                            }
                            className={styles.inlineInput}
                          />
                        ) : (
                          transaction.description
                        )}
                      </td>
                      <td
                        className={
                          category?.type === "income"
                            ? styles.incomeText
                            : styles.expenseText
                        }
                      >
                        {editingTransactionId === transaction.id ? (
                          <input
                            type="number"
                            value={editingTransactionData?.amount || 0}
                            onChange={(e) =>
                              setEditingTransactionData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      amount: parseFloat(e.target.value) || 0,
                                    }
                                  : null
                              )
                            }
                            className={styles.inlineInput}
                          />
                        ) : (
                          <>
                            {category?.type === "income" ? "+" : "-"}$
                            {Math.abs(transaction.amount).toFixed(2)}
                          </>
                        )}
                      </td>
                      <td>
                        {editingTransactionId === transaction.id ? (
                          <select
                            value={editingTransactionData?.categoryId || ""}
                            onChange={(e) =>
                              setEditingTransactionData((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      categoryId: e.target.value || null,
                                    }
                                  : null
                              )
                            }
                            className={styles.inlineSelect}
                          >
                            <option value="">-- Uncategorized --</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.type})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={transaction.categoryId || ""}
                            onChange={(e) =>
                              assignCategoryToTransaction(
                                transaction.id,
                                e.target.value || null
                              )
                            }
                            className={styles.tableSelect}
                          >
                            <option value="">-- Uncategorized --</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name} ({cat.type})
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className={styles.actionsCell}>
                        {editingTransactionId === transaction.id ? (
                          <>
                            <button
                              onClick={saveTransaction}
                              className={`${styles.button} ${styles.buttonSmall} ${styles.buttonSuccess}`}
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditingTransaction}
                              className={`${styles.button} ${styles.buttonSmall} ${styles.buttonDanger}`}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() =>
                                startEditingTransaction(transaction)
                              }
                              className={`${styles.button} ${styles.buttonSmall} ${styles.buttonPrimary}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className={`${styles.button} ${styles.buttonSmall} ${styles.buttonDanger}`}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Manage;
