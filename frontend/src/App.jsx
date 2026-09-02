import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "./App.css";


// ======================================================
// API
// ======================================================

const API = "http://127.0.0.1:8000";


// ======================================================
// COLORS
// ======================================================

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
];


// ======================================================
// CATEGORIES
// ======================================================

const CATEGORIES = [
  "Food",
  "Grocery",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Other",
];


// ======================================================
// APP
// ======================================================

function App() {

  // ====================================================
  // STATES
  // ====================================================

  const [expenses, setExpenses] = useState([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("All");

  const [editingExpense, setEditingExpense] = useState(null);

  const [deletingId, setDeletingId] = useState(null);


  // ====================================================
  // LOAD EXPENSES FROM DATABASE
  // ====================================================

  const loadExpenses = async () => {

    try {

      console.log("🔥 Loading expenses from backend...");

      const response = await axios.get(
        `${API}/expenses/`,
        {
          timeout: 10000,
        }
      );

      console.log(
        "🔥 Backend response:",
        response.data
      );


      // IMPORTANT:
      // Backend must return an array.
      // This prevents:
      // "expenses.filter is not a function"

      if (Array.isArray(response.data)) {

        setExpenses(response.data);

      } else {

        console.error(
          "❌ Backend did not return an array:",
          response.data
        );

        setExpenses([]);

      }

    } catch (error) {

      console.error(
        "❌ Failed to load expenses:",
        error
      );

      if (error.response) {

        console.error(
          "Backend status:",
          error.response.status
        );

        console.error(
          "Backend response:",
          error.response.data
        );

      } else if (error.request) {

        console.error(
          "❌ Backend did not respond."
        );

      } else {

        console.error(
          "❌ Request error:",
          error.message
        );

      }

    }

  };


  // ====================================================
  // LOAD DATABASE WHEN APP STARTS
  // ====================================================

  useEffect(() => {

    console.log(
      "🚀 App started - loading database..."
    );

    loadExpenses();

  }, []);


  // ====================================================
  // ADD EXPENSE USING AI
  // ====================================================

  const addExpense = async () => {

    if (!message.trim()) {

      alert(
        "Please enter an expense."
      );

      return;

    }


    setLoading(true);


    try {

      console.log(
        "🤖 Sending expense to AI:",
        message
      );


      // -----------------------------------------------
      // STEP 1: AI extracts expense information
      // -----------------------------------------------

      const aiResponse = await axios.post(
        `${API}/ai/extract`,
        null,
        {
          params: {
            message: message,
          },

          timeout: 30000,
        }
      );


      const expense = aiResponse.data;


      console.log(
        "🤖 AI extracted:",
        expense
      );


      // -----------------------------------------------
      // Validate AI response
      // -----------------------------------------------

      if (
        !expense ||
        expense.amount === undefined ||
        !expense.category ||
        !expense.description ||
        !expense.date
      ) {

        console.error(
          "❌ Invalid AI response:",
          expense
        );

        alert(
          "AI could not understand the expense."
        );

        return;

      }


      // -----------------------------------------------
      // STEP 2: Save expense to database
      // -----------------------------------------------

      await axios.post(
        `${API}/expenses/`,
        null,
        {
          params: {
            amount: expense.amount,
            category: expense.category,
            description: expense.description,
            date: expense.date,
          },

          timeout: 10000,
        }
      );


      console.log(
        "✅ Expense saved to database."
      );


      // -----------------------------------------------
      // Clear input
      // -----------------------------------------------

      setMessage("");


      // -----------------------------------------------
      // Reload database
      // -----------------------------------------------

      await loadExpenses();


    } catch (error) {

      console.error(
        "❌ Error adding expense:",
        error
      );


      if (error.response) {

        console.error(
          "Backend status:",
          error.response.status
        );

        console.error(
          "Backend response:",
          error.response.data
        );

      }


      alert(
        "Unable to add expense. Please make sure the backend and AI API are running."
      );


    } finally {

      setLoading(false);

    }

  };


  // ====================================================
  // UPDATE EXPENSE
  // ====================================================

  const updateExpense = async () => {

    if (!editingExpense) {

      return;

    }


    try {

      console.log(
        "✏️ Updating expense:",
        editingExpense
      );


      await axios.put(
        `${API}/expenses/${editingExpense.id}`,
        null,
        {
          params: {

            amount:
              Number(
                editingExpense.amount
              ),

            description:
              editingExpense.description,

            category:
              editingExpense.category,

            date:
              editingExpense.date,

          },

          timeout: 10000,
        }
      );


      console.log(
        "✅ Expense updated."
      );


      setEditingExpense(null);


      await loadExpenses();


    } catch (error) {

      console.error(
        "❌ Update failed:",
        error
      );


      if (error.response) {

        console.error(
          "Backend response:",
          error.response.data
        );

      }


      alert(
        "Failed to update expense."
      );

    }

  };


  // ====================================================
  // DELETE EXPENSE
  // ====================================================

  const deleteExpense = async (id) => {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this expense?"
      );


    if (!confirmed) {

      return;

    }


    setDeletingId(id);


    try {

      console.log(
        "🗑️ Deleting expense:",
        id
      );


      await axios.delete(
        `${API}/expenses/${id}`,
        {
          timeout: 10000,
        }
      );


      console.log(
        "✅ Expense deleted."
      );


      await loadExpenses();


    } catch (error) {

      console.error(
        "❌ Delete failed:",
        error
      );


      alert(
        "Failed to delete expense."
      );


    } finally {

      setDeletingId(null);

    }

  };


  // ====================================================
  // DATE PARSER
  // ====================================================
  //
  // Supports:
  //
  // 2026-08-26
  //
  // 26/08/2026
  //
  // 26-08-2026
  //
  // ====================================================

  const parseExpenseDate = (dateValue) => {

    if (!dateValue) {

      return null;

    }


    const value =
      String(dateValue).trim();


    // YYYY-MM-DD

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

      const [
        year,
        month,
        day,
      ] = value.split("-").map(Number);


      const date =
        new Date(
          year,
          month - 1,
          day
        );


      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {

        return date;

      }

    }


    // DD/MM/YYYY

    if (
      /^\d{2}\/\d{2}\/\d{4}$/.test(value)
    ) {

      const [
        day,
        month,
        year,
      ] = value.split("/").map(Number);


      const date =
        new Date(
          year,
          month - 1,
          day
        );


      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {

        return date;

      }

    }


    // DD-MM-YYYY

    if (
      /^\d{2}-\d{2}-\d{4}$/.test(value)
    ) {

      const [
        day,
        month,
        year,
      ] = value.split("-").map(Number);


      const date =
        new Date(
          year,
          month - 1,
          day
        );


      if (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
      ) {

        return date;

      }

    }


    // Fallback

    const parsed =
      new Date(value);


    if (
      !isNaN(parsed.getTime())
    ) {

      return parsed;

    }


    return null;

  };


  // ====================================================
  // FILTERED EXPENSES
  // ====================================================

  const filteredExpenses = useMemo(() => {

    return expenses.filter(
      (expense) => {

        const description =
          String(
            expense.description || ""
          );


        const category =
          String(
            expense.category || ""
          );


        const searchText =
          search.toLowerCase().trim();


        const matchesSearch =
          description
            .toLowerCase()
            .includes(searchText);


        const matchesCategory =
          categoryFilter === "All" ||
          category.toLowerCase() ===
            categoryFilter.toLowerCase();


        return (
          matchesSearch &&
          matchesCategory
        );

      }
    );

  }, [
    expenses,
    search,
    categoryFilter,
  ]);


  // ====================================================
  // TOTAL SPENDING
  // ====================================================

  const total = useMemo(() => {

    return expenses.reduce(
      (sum, expense) => {

        return (
          sum +
          Number(
            expense.amount || 0
          )
        );

      },
      0
    );

  }, [expenses]);


  // ====================================================
  // HIGHEST EXPENSE
  // ====================================================

  const highestExpense = useMemo(() => {

    if (
      expenses.length === 0
    ) {

      return null;

    }


    return expenses.reduce(
      (highest, expense) => {

        return Number(
          expense.amount || 0
        ) >
          Number(
            highest.amount || 0
          )
          ? expense
          : highest;

      },
      expenses[0]
    );

  }, [expenses]);


  // ====================================================
  // AVERAGE EXPENSE
  // ====================================================

  const averageExpense =
    expenses.length > 0
      ? total / expenses.length
      : 0;


  // ====================================================
  // CATEGORY TOTALS
  // ====================================================

  const categoryData = useMemo(() => {

    const totals =
      expenses.reduce(
        (acc, expense) => {

          const category =
            expense.category ||
            "Other";


          const amount =
            Number(
              expense.amount || 0
            );


          acc[category] =
            (acc[category] || 0) +
            amount;


          return acc;

        },
        {}
      );


    return Object.entries(
      totals
    ).map(
      ([category, amount]) => ({

        name: category,

        value: Number(
          amount.toFixed(2)
        ),

      })
    );

  }, [expenses]);


  // ====================================================
  // MONTHLY SPENDING
  // ====================================================

  const monthlyData = useMemo(() => {

    const totals =
      expenses.reduce(
        (acc, expense) => {

          const date =
            parseExpenseDate(
              expense.date
            );


          if (!date) {

            return acc;

          }


          const month =
            date.toLocaleString(
              "en-US",
              {
                month: "short",
              }
            );


          const amount =
            Number(
              expense.amount || 0
            );


          acc[month] =
            (acc[month] || 0) +
            amount;


          return acc;

        },
        {}
      );


    const monthOrder = [

      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",

    ];


    return monthOrder
      .filter(
        (month) =>
          totals[month] !==
          undefined
      )
      .map(
        (month) => ({

          month,

          amount:
            Number(
              totals[month].toFixed(2)
            ),

        })
      );

  }, [expenses]);


  // ====================================================
  // THIS MONTH SPENDING
  // ====================================================

  const thisMonthSpending =
    useMemo(() => {

      const now =
        new Date();


      return expenses.reduce(
        (sum, expense) => {

          const date =
            parseExpenseDate(
              expense.date
            );


          if (!date) {

            return sum;

          }


          const sameMonth =
            date.getMonth() ===
            now.getMonth();


          const sameYear =
            date.getFullYear() ===
            now.getFullYear();


          if (
            sameMonth &&
            sameYear
          ) {

            return (
              sum +
              Number(
                expense.amount || 0
              )
            );

          }


          return sum;

        },
        0
      );

    }, [expenses]);


  // ====================================================
  // TOP CATEGORY
  // ====================================================

  const topCategory = useMemo(() => {

    if (
      categoryData.length === 0
    ) {

      return null;

    }


    return categoryData.reduce(
      (highest, category) => {

        return category.value >
          highest.value
          ? category
          : highest;

      },
      categoryData[0]
    );

  }, [categoryData]);


  // ====================================================
  // FORMAT CURRENCY
  // ====================================================

  const formatCurrency = (
    amount
  ) => {

    return `₹${Number(
      amount || 0
    ).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;

  };


  // ====================================================
  // FORMAT DATE FOR DISPLAY
  // ====================================================

  const formatDate = (
    date
  ) => {

    if (!date) {

      return "-";

    }


    return String(date);

  };


  // ====================================================
  // UI
  // ====================================================

  return (

    <div className="app">


      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="header">

        <div>

          <h1>
            🤖 AI Expense Tracker
          </h1>

          <p>
            Track and manage your expenses
            using natural language and AI.
          </p>

        </div>


        <div className="header-badge">

          <span>●</span>

          AI System Active

        </div>

      </header>


      {/* ================================================= */}
      {/* AI EXPENSE INPUT */}
      {/* ================================================= */}

      <section className="ai-box">

        <div className="section-title">

          <span className="ai-icon">
            ✨
          </span>


          <div>

            <h2>
              Add Expense with AI
            </h2>

            <p>
              Simply describe your expense
              and AI will understand it.
            </p>

          </div>

        </div>


        <div className="input-row">

          <input
            type="text"
            placeholder='Example: "I spent ₹500 on dinner today"'
            value={message}
            onChange={(e) =>
              setMessage(
                e.target.value
              )
            }
            onKeyDown={(e) => {

              if (
                e.key === "Enter" &&
                !loading
              ) {

                addExpense();

              }

            }}
            disabled={loading}
          />


          <button
            className="add-button"
            onClick={addExpense}
            disabled={loading}
          >

            {loading
              ? "🤖 Processing..."
              : "✨ Add Expense"}

          </button>

        </div>


        <div className="ai-hints">

          <span>
            💡 Try:
          </span>


          <button
            onClick={() =>
              setMessage(
                "I spent ₹500 on dinner today"
              )
            }
          >
            Dinner ₹500
          </button>


          <button
            onClick={() =>
              setMessage(
                "I spent ₹200 on Uber today"
              )
            }
          >
            Uber ₹200
          </button>


          <button
            onClick={() =>
              setMessage(
                "I spent ₹1000 on shopping today"
              )
            }
          >
            Shopping ₹1000
          </button>

        </div>

      </section>


      {/* ================================================= */}
      {/* MAIN SUMMARY */}
      {/* ================================================= */}

      <section className="summary">


        {/* TOTAL */}

        <div className="card">

          <div className="card-icon">
            💰
          </div>


          <div>

            <span>
              Total Spending
            </span>

            <strong>
              {formatCurrency(total)}
            </strong>

          </div>

        </div>


        {/* TRANSACTIONS */}

        <div className="card">

          <div className="card-icon">
            📊
          </div>


          <div>

            <span>
              Transactions
            </span>

            <strong>
              {expenses.length}
            </strong>

          </div>

        </div>


        {/* THIS MONTH */}

        <div className="card">

          <div className="card-icon">
            📅
          </div>


          <div>

            <span>
              This Month
            </span>

            <strong>
              {formatCurrency(
                thisMonthSpending
              )}
            </strong>

          </div>

        </div>


        {/* AI */}

        <div className="card">

          <div className="card-icon">
            🤖
          </div>


          <div>

            <span>
              AI Powered
            </span>

            <strong>
              Active
            </strong>

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* ADVANCED SUMMARY */}
      {/* ================================================= */}

      <section className="summary advanced-summary">


        {/* AVERAGE */}

        <div className="card">

          <div className="card-icon">
            📈
          </div>


          <div>

            <span>
              Average Expense
            </span>

            <strong>
              {formatCurrency(
                averageExpense
              )}
            </strong>

          </div>

        </div>


        {/* HIGHEST */}

        <div className="card">

          <div className="card-icon">
            🔥
          </div>


          <div>

            <span>
              Highest Expense
            </span>


            <strong>

              {highestExpense
                ? formatCurrency(
                    highestExpense.amount
                  )
                : "₹0.00"}

            </strong>


            {highestExpense && (

              <small>
                {
                  highestExpense.description
                }
              </small>

            )}

          </div>

        </div>


        {/* TOP CATEGORY */}

        <div className="card">

          <div className="card-icon">
            🏆
          </div>


          <div>

            <span>
              Top Category
            </span>


            <strong>

              {topCategory
                ? topCategory.name
                : "None"}

            </strong>


            {topCategory && (

              <small>

                {formatCurrency(
                  topCategory.value
                )}

              </small>

            )}

          </div>

        </div>

      </section>


      {/* ================================================= */}
      {/* ANALYTICS */}
      {/* ================================================= */}

      <section className="analytics-grid">


        {/* CATEGORY PIE CHART */}

        <div className="analytics">

          <div className="analytics-header">

            <div>

              <h2>
                Spending by Category
              </h2>

              <p>
                See where your money is going.
              </p>

            </div>

          </div>


          {categoryData.length === 0 ? (

            <div className="analytics-empty">

              <div>
                📊
              </div>

              <p>
                Add expenses to see your
                spending breakdown.
              </p>

            </div>

          ) : (

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <PieChart>

                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={115}
                    innerRadius={55}
                    paddingAngle={3}
                    label
                  >

                    {categoryData.map(
                      (entry, index) => (

                        <Cell
                          key={
                            `category-${index}`
                          }
                          fill={
                            COLORS[
                              index %
                              COLORS.length
                            ]
                          }
                        />

                      )
                    )}

                  </Pie>


                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(
                        value
                      )
                    }
                  />


                  <Legend />

                </PieChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>


        {/* MONTHLY BAR CHART */}

        <div className="analytics">

          <div className="analytics-header">

            <div>

              <h2>
                Monthly Spending
              </h2>

              <p>
                Track your spending
                throughout the year.
              </p>

            </div>

          </div>


          {monthlyData.length === 0 ? (

            <div className="analytics-empty">

              <div>
                📈
              </div>

              <p>
                Add expenses to see your
                monthly spending.
              </p>

            </div>

          ) : (

            <div className="chart-container">

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <BarChart
                  data={monthlyData}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />


                  <XAxis
                    dataKey="month"
                  />


                  <YAxis />


                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(
                        value
                      )
                    }
                  />


                  <Legend />


                  <Bar
                    dataKey="amount"
                    name="Spending"
                    radius={[
                      8,
                      8,
                      0,
                      0,
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>

      </section>


      {/* ================================================= */}
      {/* FILTERS */}
      {/* ================================================= */}

      <section className="filter-section">

        <div className="filters">

          <input
            type="text"
            placeholder="🔎 Search expenses..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />


          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
          >

            <option value="All">
              All Categories
            </option>


            {CATEGORIES.map(
              (category) => (

                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>

              )
            )}

          </select>

        </div>


        {(search ||
          categoryFilter !== "All") && (

          <button
            className="clear-filter"
            onClick={() => {

              setSearch("");

              setCategoryFilter(
                "All"
              );

            }}
          >
            Clear Filters
          </button>

        )}

      </section>


      {/* ================================================= */}
      {/* EXPENSE TABLE */}
      {/* ================================================= */}

      <section className="expenses">

        <div className="expenses-header">

          <div>

            <h2>
              Recent Expenses
            </h2>

            <p>
              Your latest transactions
            </p>

          </div>


          <span className="transaction-count">

            {filteredExpenses.length}

            {" "}

            transaction
            {filteredExpenses.length !==
            1
              ? "s"
              : ""}

          </span>

        </div>


        {filteredExpenses.length ===
        0 ? (

          <div className="empty-state">

            <div>
              💸
            </div>

            <h3>
              No expenses found
            </h3>

            <p>
              Add an expense or change
              your search/filter.
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredExpenses.map(
                  (expense) => (

                    <tr
                      key={
                        expense.id
                      }
                    >

                      <td>
                        {formatDate(
                          expense.date
                        )}
                      </td>


                      <td className="description">

                        {
                          expense.description
                        }

                      </td>


                      <td>

                        <span className="category">

                          {
                            expense.category
                          }

                        </span>

                      </td>


                      <td className="amount">

                        {formatCurrency(
                          expense.amount
                        )}

                      </td>


                      <td className="actions">


                        {/* EDIT */}

                        <button
                          className="edit"
                          onClick={() =>
                            setEditingExpense({
                              ...expense,
                            })
                          }
                        >

                          ✏️ Edit

                        </button>


                        {/* DELETE */}

                        <button
                          className="delete"
                          onClick={() =>
                            deleteExpense(
                              expense.id
                            )
                          }
                          disabled={
                            deletingId ===
                            expense.id
                          }
                        >

                          {deletingId ===
                          expense.id
                            ? "Deleting..."
                            : "🗑️ Delete"}

                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer>

        <p>
          AI Expense Tracker • React +
          FastAPI + Groq
        </p>

        <p>
          AI-powered expense management
          system
        </p>

      </footer>


      {/* ================================================= */}
      {/* EDIT MODAL */}
      {/* ================================================= */}

      {editingExpense && (

        <div
          className="modal-overlay"
          onClick={(e) => {

            if (
              e.target.className ===
              "modal-overlay"
            ) {

              setEditingExpense(
                null
              );

            }

          }}
        >


          <div className="modal">

            <h2>
              ✏️ Edit Expense
            </h2>


            <p className="modal-subtitle">
              Update your transaction
              details.
            </p>


            {/* DESCRIPTION */}

            <label>
              Description
            </label>


            <input
              value={
                editingExpense.description ||
                ""
              }
              onChange={(e) =>
                setEditingExpense({
                  ...editingExpense,

                  description:
                    e.target.value,

                })
              }
            />


            {/* AMOUNT */}

            <label>
              Amount
            </label>


            <input
              type="number"
              min="0"
              step="0.01"
              value={
                editingExpense.amount
              }
              onChange={(e) =>
                setEditingExpense({
                  ...editingExpense,

                  amount:
                    e.target.value,

                })
              }
            />


            {/* CATEGORY */}

            <label>
              Category
            </label>


            <select
              value={
                editingExpense.category ||
                "Other"
              }
              onChange={(e) =>
                setEditingExpense({
                  ...editingExpense,

                  category:
                    e.target.value,

                })
              }
            >

              {CATEGORIES.map(
                (category) => (

                  <option
                    key={category}
                    value={category}
                  >

                    {category}

                  </option>

                )
              )}

            </select>


            {/* DATE */}

            <label>
              Date
            </label>


            <input
              type="date"
              value={
                editingExpense.date ||
                ""
              }
              onChange={(e) =>
                setEditingExpense({
                  ...editingExpense,

                  date:
                    e.target.value,

                })
              }
            />


            {/* ACTIONS */}

            <div className="modal-actions">


              <button
                className="cancel"
                onClick={() =>
                  setEditingExpense(
                    null
                  )
                }
              >

                Cancel

              </button>


              <button
                className="save"
                onClick={
                  updateExpense
                }
              >

                💾 Save Changes

              </button>


            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default App;