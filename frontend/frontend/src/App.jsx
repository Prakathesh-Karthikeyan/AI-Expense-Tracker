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

const API_BASE_URL = "http://127.0.0.1:8000";

const CATEGORY_COLORS = [
  "#7c5cff",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

const CATEGORY_ICONS = {
  Food: "🍔",
  Shopping: "🛍️",
  Transport: "🚕",
  Travel: "✈️",
  Entertainment: "🎬",
  Bills: "🧾",
  Health: "❤️",
  Education: "📚",
  Groceries: "🛒",
  Rent: "🏠",
  Other: "💳",
};

function App() {
  const [expenses, setExpenses] = useState([]);
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [addingExpense, setAddingExpense] = useState(false);

  const [activePage, setActivePage] = useState("dashboard");

  const [notification, setNotification] = useState({
    show: false,
    type: "",
    text: "",
  });

  /* =========================================================
     NOTIFICATION
  ========================================================= */

  const showNotification = (type, text) => {
    setNotification({
      show: true,
      type,
      text,
    });

    setTimeout(() => {
      setNotification({
        show: false,
        type: "",
        text: "",
      });
    }, 3500);
  };

  /* =========================================================
     LOAD EXPENSES
  ========================================================= */

  const loadExpenses = async () => {
    try {
      console.log("🔥 Loading expenses from backend...");

      const response = await axios.get(`${API_BASE_URL}/expenses/`, {
        timeout: 15000,
      });

      console.log("✅ Expenses received:", response.data);

      /*
       * IMPORTANT:
       * Backend should return an array.
       * This prevents:
       * expenses.filter is not a function
       */

      if (Array.isArray(response.data)) {
        setExpenses(response.data);
      } else {
        console.error("Backend returned unexpected data:", response.data);
        setExpenses([]);
        showNotification(
          "error",
          "Backend returned an invalid expense format."
        );
      }
    } catch (error) {
      console.error("❌ Failed to load expenses:", error);

      setExpenses([]);

      showNotification(
        "error",
        "Unable to load expenses. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    console.log("🚀 App started - loading database...");
    loadExpenses();
  }, []);

  /* =========================================================
     ADD EXPENSE USING AI
  ========================================================= */

  const handleAddExpense = async () => {
    if (!message.trim()) {
      showNotification(
        "error",
        "Please describe your expense first."
      );
      return;
    }

    try {
      setAddingExpense(true);

      console.log("🤖 Sending expense to AI:", message);

      /*
       * Your backend endpoint:
       * POST /ai/extract?message=...
       */

      const aiResponse = await axios.post(
        `${API_BASE_URL}/ai/extract`,
        null,
        {
          params: {
            message: message.trim(),
          },
          timeout: 30000,
        }
      );

      console.log("🤖 AI response:", aiResponse.data);

      const extracted = aiResponse.data;

      /*
       * Support either:
       *
       * {
       *   amount,
       *   category,
       *   description,
       *   date
       * }
       *
       * or:
       *
       * {
       *   expense: {...}
       * }
       */

      const expenseData = extracted?.expense || extracted;

      if (
        !expenseData ||
        expenseData.amount === undefined ||
        !expenseData.category
      ) {
        throw new Error("AI returned invalid expense data.");
      }

      const newExpense = {
        amount: Number(expenseData.amount),
        category: expenseData.category || "Other",
        description:
          expenseData.description || message.trim(),
        date:
          expenseData.date ||
          new Date().toISOString().split("T")[0],
      };

      console.log("💾 Saving expense:", newExpense);

      /*
       * Your FastAPI create endpoint accepts
       * amount/category/description/date as query parameters.
       */

      const saveResponse = await axios.post(
        `${API_BASE_URL}/expenses/`,
        null,
        {
          params: newExpense,
          timeout: 15000,
        }
      );

      console.log("✅ Expense saved:", saveResponse.data);

      /*
       * Add returned database record directly.
       */

      if (saveResponse.data) {
        setExpenses((currentExpenses) => [
          saveResponse.data,
          ...currentExpenses,
        ]);
      } else {
        await loadExpenses();
      }

      setMessage("");

      showNotification(
        "success",
        `₹${Number(newExpense.amount).toLocaleString("en-IN")} expense added successfully.`
      );
    } catch (error) {
      console.error("❌ Failed to add expense:", error);

      if (error.response) {
        console.error(
          "Backend response:",
          error.response.data
        );
      }

      showNotification(
        "error",
        "Unable to add expense. Please check that the backend and AI API are running."
      );
    } finally {
      setAddingExpense(false);
    }
  };

  /* =========================================================
     DELETE EXPENSE
  ========================================================= */

  const handleDeleteExpense = async (id) => {
    if (!id) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/expenses/${id}`,
        {
          timeout: 15000,
        }
      );

      setExpenses((currentExpenses) =>
        currentExpenses.filter(
          (expense) => expense.id !== id
        )
      );

      showNotification(
        "success",
        "Expense deleted successfully."
      );
    } catch (error) {
      console.error("❌ Delete failed:", error);

      showNotification(
        "error",
        "Unable to delete this expense."
      );
    }
  };

  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    setLoading(true);
    await loadExpenses();
  };

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatShortCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  const getCategoryIcon = (category) => {
    return CATEGORY_ICONS[category] || "💳";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "Unknown date";

    /*
     * Handles:
     * 2026-08-27
     * 27/08/2026
     */

    let date;

    if (
      typeof dateValue === "string" &&
      /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)
    ) {
      const [day, month, year] = dateValue.split("/");
      date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );
    } else {
      date = new Date(dateValue);
    }

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isCurrentMonth = (dateValue) => {
    if (!dateValue) return false;

    let date;

    if (
      typeof dateValue === "string" &&
      /^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)
    ) {
      const [day, month, year] = dateValue.split("/");

      date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      );
    } else {
      date = new Date(dateValue);
    }

    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  /* =========================================================
     NORMALIZED EXPENSES
  ========================================================= */

  const normalizedExpenses = useMemo(() => {
    if (!Array.isArray(expenses)) {
      return [];
    }

    return expenses.map((expense) => ({
      ...expense,
      amount: Number(expense.amount) || 0,
      category: expense.category || "Other",
      description:
        expense.description || "No description",
      date: expense.date || "",
    }));
  }, [expenses]);

  /* =========================================================
     STATISTICS
  ========================================================= */

  const statistics = useMemo(() => {
    const total = normalizedExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const transactionCount = normalizedExpenses.length;

    const monthlyTotal = normalizedExpenses
      .filter((expense) => isCurrentMonth(expense.date))
      .reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

    const average =
      transactionCount > 0
        ? total / transactionCount
        : 0;

    const highest =
      normalizedExpenses.length > 0
        ? normalizedExpenses.reduce(
            (highestExpense, expense) =>
              expense.amount >
              highestExpense.amount
                ? expense
                : highestExpense,
            normalizedExpenses[0]
          )
        : null;

    return {
      total,
      transactionCount,
      monthlyTotal,
      average,
      highest,
    };
  }, [normalizedExpenses]);

  /* =========================================================
     CATEGORY DATA
  ========================================================= */

  const categoryData = useMemo(() => {
    const categories = {};

    normalizedExpenses.forEach((expense) => {
      const category = expense.category || "Other";

      if (!categories[category]) {
        categories[category] = 0;
      }

      categories[category] += expense.amount;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [normalizedExpenses]);

  /* =========================================================
     TOP CATEGORY
  ========================================================= */

  const topCategory = useMemo(() => {
    if (categoryData.length === 0) {
      return null;
    }

    return categoryData[0];
  }, [categoryData]);

  /* =========================================================
     MONTHLY DATA
  ========================================================= */

  const monthlyData = useMemo(() => {
    const now = new Date();

    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      months.push({
        month: date.toLocaleDateString("en-US", {
          month: "short",
        }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        amount: 0,
      });
    }

    normalizedExpenses.forEach((expense) => {
      if (!expense.date) return;

      let date;

      if (
        typeof expense.date === "string" &&
        /^\d{2}\/\d{2}\/\d{4}$/.test(
          expense.date
        )
      ) {
        const [day, month, year] =
          expense.date.split("/");

        date = new Date(
          Number(year),
          Number(month) - 1,
          Number(day)
        );
      } else {
        date = new Date(expense.date);
      }

      if (Number.isNaN(date.getTime())) return;

      const matchingMonth = months.find(
        (month) =>
          month.year === date.getFullYear() &&
          month.monthIndex === date.getMonth()
      );

      if (matchingMonth) {
        matchingMonth.amount += expense.amount;
      }
    });

    return months;
  }, [normalizedExpenses]);

  /* =========================================================
     RECENT EXPENSES
  ========================================================= */

  const recentExpenses = useMemo(() => {
    return [...normalizedExpenses]
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        return (
          (Number.isNaN(dateB) ? 0 : dateB) -
          (Number.isNaN(dateA) ? 0 : dateA)
        );
      })
      .slice(0, 8);
  }, [normalizedExpenses]);

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigationItems = [
    {
      id: "dashboard",
      icon: "⌂",
      label: "Dashboard",
    },
    {
      id: "expenses",
      icon: "▤",
      label: "Expenses",
    },
    {
      id: "analytics",
      icon: "◔",
      label: "Analytics",
    },
  ];

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const renderDashboard = () => {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              FINANCIAL OVERVIEW
            </p>

            <h1>
              Good evening
              <span className="heading-dot">.</span>
            </h1>

            <p className="page-subtitle">
              Here's what's happening with your
              spending.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            <span
              className={
                loading ? "spin" : ""
              }
            >
              ↻
            </span>
            Refresh
          </button>
        </div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-card-top">
              <div className="stat-icon">
                ₹
              </div>

              <span className="stat-label">
                Total spending
              </span>
            </div>

            <div className="stat-value">
              {formatCurrency(
                statistics.total
              )}
            </div>

            <div className="stat-footer">
              Across all transactions
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon blue">
                #
              </div>

              <span className="stat-label">
                Transactions
              </span>
            </div>

            <div className="stat-value">
              {statistics.transactionCount}
            </div>

            <div className="stat-footer">
              Recorded expenses
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon green">
                ◷
              </div>

              <span className="stat-label">
                This month
              </span>
            </div>

            <div className="stat-value">
              {formatCurrency(
                statistics.monthlyTotal
              )}
            </div>

            <div className="stat-footer">
              Current month spending
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon purple">
                ✦
              </div>

              <span className="stat-label">
                AI powered
              </span>
            </div>

            <div className="stat-value ai-status">
              <span className="online-dot"></span>
              Active
            </div>

            <div className="stat-footer">
              Natural language enabled
            </div>
          </div>
        </div>

        {/* =================================================
            AI INPUT + QUICK STATS
        ================================================= */}

        <div className="main-grid">
          <section className="ai-card">
            <div className="ai-card-header">
              <div className="ai-title-wrapper">
                <div className="ai-logo">
                  ✦
                </div>

                <div>
                  <p className="section-kicker">
                    SMART INPUT
                  </p>

                  <h2>
                    Add an expense with AI
                  </h2>

                  <p>
                    Describe your expense naturally.
                    AI handles the rest.
                  </p>
                </div>
              </div>

              <div className="ai-badge">
                <span></span>
                AI ready
              </div>
            </div>

            <div className="ai-input-row">
              <input
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !addingExpense
                  ) {
                    handleAddExpense();
                  }
                }}
                placeholder='Try: "I spent ₹500 on dinner today"'
                disabled={addingExpense}
              />

              <button
                className="ai-submit-button"
                onClick={handleAddExpense}
                disabled={
                  addingExpense ||
                  !message.trim()
                }
              >
                {addingExpense ? (
                  <>
                    <span className="button-spinner"></span>
                    Processing
                  </>
                ) : (
                  <>
                    ✦ Add expense
                  </>
                )}
              </button>
            </div>

            <div className="quick-prompts">
              <span className="quick-label">
                Try it
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

          <div className="insight-card">
            <div className="insight-icon">
              ◈
            </div>

            <div>
              <p className="section-kicker">
                QUICK INSIGHT
              </p>

              <h3>
                {topCategory
                  ? `${topCategory.name} is your top category`
                  : "Start tracking your expenses"}
              </h3>

              <p>
                {topCategory
                  ? `${formatCurrency(
                      topCategory.value
                    )} spent in this category.`
                  : "Add your first expense using the AI assistant."}
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            CHARTS
        ================================================= */}

        <div className="charts-grid">
          <section className="panel chart-panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">
                  BREAKDOWN
                </p>

                <h2>
                  Spending by category
                </h2>

                <p>
                  See where your money is going.
                </p>
              </div>
            </div>

            {categoryData.length === 0 ? (
              <div className="empty-chart">
                <div>◔</div>
                <h3>No spending data yet</h3>
                <p>
                  Add an expense to see your
                  category breakdown.
                </p>
              </div>
            ) : (
              <div className="pie-chart-wrapper">
                <ResponsiveContainer
                  width="100%"
                  height={310}
                >
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="48%"
                      innerRadius={78}
                      outerRadius={112}
                      paddingAngle={4}
                    >
                      {categoryData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              CATEGORY_COLORS[
                                index %
                                  CATEGORY_COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                      contentStyle={{
                        background:
                          "#111827",
                        border:
                          "1px solid #26324a",
                        borderRadius: "12px",
                        color: "#ffffff",
                      }}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="panel chart-panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">
                  TREND
                </p>

                <h2>
                  Monthly spending
                </h2>

                <p>
                  Your spending over the last six
                  months.
                </p>
              </div>
            </div>

            <div className="bar-chart-wrapper">
              <ResponsiveContainer
                width="100%"
                height={310}
              >
                <BarChart
                  data={monthlyData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 6"
                    stroke="#202b42"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    stroke="#6f7d96"
                    tick={{
                      fill: "#8793aa",
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    stroke="#6f7d96"
                    tick={{
                      fill: "#8793aa",
                      fontSize: 11,
                    }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) =>
                      `₹${value}`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                    contentStyle={{
                      background:
                        "#111827",
                      border:
                        "1px solid #26324a",
                      borderRadius: "12px",
                      color: "#ffffff",
                    }}
                  />

                  <Bar
                    dataKey="amount"
                    radius={[
                      8,
                      8,
                      3,
                      3,
                    ]}
                    fill="#7c5cff"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* =================================================
            LOWER DASHBOARD
        ================================================= */}

        <div className="lower-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">
                  ACTIVITY
                </p>

                <h2>
                  Recent transactions
                </h2>

                <p>
                  Your latest recorded expenses.
                </p>
              </div>

              <button
                className="text-button"
                onClick={() =>
                  setActivePage("expenses")
                }
              >
                View all →
              </button>
            </div>

            <TransactionList
              expenses={recentExpenses}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getCategoryIcon={
                getCategoryIcon
              }
              onDelete={handleDeleteExpense}
              compact
            />
          </section>

          <section className="panel overview-panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">
                  SUMMARY
                </p>

                <h2>
                  Spending overview
                </h2>

                <p>
                  Key numbers from your data.
                </p>
              </div>
            </div>

            <div className="overview-list">
              <OverviewRow
                label="Average transaction"
                value={formatCurrency(
                  statistics.average
                )}
              />

              <OverviewRow
                label="Highest expense"
                value={
                  statistics.highest
                    ? formatCurrency(
                        statistics.highest
                          .amount
                      )
                    : "₹0.00"
                }
              />

              <OverviewRow
                label="Top category"
                value={
                  topCategory
                    ? topCategory.name
                    : "None"
                }
              />

              <OverviewRow
                label="Categories used"
                value={categoryData.length}
              />
            </div>

            {statistics.highest && (
              <div className="highest-expense">
                <div className="highest-icon">
                  🔥
                </div>

                <div>
                  <span>
                    Highest expense
                  </span>

                  <strong>
                    {formatCurrency(
                      statistics.highest
                        .amount
                    )}
                  </strong>

                  <small>
                    {
                      statistics.highest
                        .description
                    }
                  </small>
                </div>
              </div>
            )}
          </section>
        </div>
      </>
    );
  };

  /* =========================================================
     EXPENSES PAGE
  ========================================================= */

  const renderExpenses = () => {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              TRANSACTION MANAGEMENT
            </p>

            <h1>
              All expenses
              <span className="heading-dot">.</span>
            </h1>

            <p className="page-subtitle">
              Manage and review every expense in
              your database.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>

        <section className="panel expenses-panel">
          <div className="expenses-summary">
            <div>
              <span>
                Total transactions
              </span>

              <strong>
                {normalizedExpenses.length}
              </strong>
            </div>

            <div>
              <span>
                Total spending
              </span>

              <strong>
                {formatCurrency(
                  statistics.total
                )}
              </strong>
            </div>

            <div>
              <span>
                This month
              </span>

              <strong>
                {formatCurrency(
                  statistics.monthlyTotal
                )}
              </strong>
            </div>
          </div>

          <TransactionList
            expenses={normalizedExpenses}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getCategoryIcon={getCategoryIcon}
            onDelete={handleDeleteExpense}
          />
        </section>
      </>
    );
  };

  /* =========================================================
     ANALYTICS PAGE
  ========================================================= */

  const renderAnalytics = () => {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              FINANCIAL INTELLIGENCE
            </p>

            <h1>
              Analytics
              <span className="heading-dot">.</span>
            </h1>

            <p className="page-subtitle">
              Understand your spending patterns
              and habits.
            </p>
          </div>
        </div>

        <div className="analytics-stat-grid">
          <div className="analytics-stat">
            <span>Total spending</span>
            <strong>
              {formatCurrency(
                statistics.total
              )}
            </strong>
          </div>

          <div className="analytics-stat">
            <span>Average expense</span>
            <strong>
              {formatCurrency(
                statistics.average
              )}
            </strong>
          </div>

          <div className="analytics-stat">
            <span>Highest expense</span>
            <strong>
              {statistics.highest
                ? formatCurrency(
                    statistics.highest.amount
                  )
                : "₹0.00"}
            </strong>
          </div>

          <div className="analytics-stat">
            <span>Top category</span>
            <strong>
              {topCategory
                ? topCategory.name
                : "None"}
            </strong>
          </div>
        </div>

        <div className="charts-grid">
          <section className="panel chart-panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">
                  CATEGORIES
                </p>

                <h2>
                  Category performance
                </h2>
              </div>
            </div>

            {categoryData.length === 0 ? (
              <div className="empty-chart">
                <div>◔</div>
                <h3>
                  No analytics available
                </h3>
                <p>
                  Add expenses to generate
                  insights.
                </p>
              </div>
            ) : (
              <div className="category-ranking">
                {categoryData.map(
                  (category, index) => {
                    const percentage =
                      statistics.total > 0
                        ? (category.value /
                            statistics.total) *
                          100
                        : 0;

                    return (
                      <div
                        className="category-row"
                        key={category.name}
                      >
                        <div className="category-row-top">
                          <div className="category-name">
                            <span
                              className="category-dot"
                              style={{
                                background:
                                  CATEGORY_COLORS[
                                    index %
                                      CATEGORY_COLORS.length
                                  ],
                              }}
                            ></span>

                            <span>
                              {
                                getCategoryIcon(
                                  category.name
                                )
                              }
                            </span>

                            <strong>
                              {category.name}
                            </strong>
                          </div>

                          <span className="category-amount">
                            {formatCurrency(
                              category.value
                            )}
                          </span>
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-value"
                            style={{
                              width: `${percentage}%`,
                              background:
                                CATEGORY_COLORS[
                                  index %
                                    CATEGORY_COLORS.length
                                ],
                            }}
                          ></div>
                        </div>

                        <small>
                          {percentage.toFixed(
                            1
                          )}
                          % of total spending
                        </small>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="section-kicker">
                  MONTHLY TREND
                </p>

                <h2>
                  Spending movement
                </h2>

                <p>
                  Compare your recent monthly
                  spending.
                </p>
              </div>
            </div>

            <div className="analytics-month-list">
              {monthlyData.map((month) => (
                <div
                  className="month-row"
                  key={`${month.year}-${month.monthIndex}`}
                >
                  <span>
                    {month.month}{" "}
                    {month.year}
                  </span>

                  <div className="month-bar">
                    <div
                      style={{
                        width: `${
                          Math.min(
                            100,
                            statistics.total >
                              0
                              ? (month.amount /
                                  Math.max(
                                    ...monthlyData.map(
                                      (item) =>
                                        item.amount
                                    ),
                                    1
                                  )) *
                                100
                              : 0
                          )}%`,
                      }}
                    ></div>
                  </div>

                  <strong>
                    {formatShortCurrency(
                      month.amount
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>
        </div>
      </>
    );
  };

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <div className="app-shell">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            ✦
          </div>

          <div>
            <strong>
              Expense<span>AI</span>
            </strong>

            <small>
              Intelligent finance
            </small>
          </div>
        </div>

        <div className="sidebar-section">
          <span className="sidebar-heading">
            WORKSPACE
          </span>

          <nav>
            {navigationItems.map((item) => (
              <button
                key={item.id}
                className={
                  activePage === item.id
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setActivePage(item.id)
                }
              >
                <span className="nav-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>

                {item.id === "expenses" &&
                  normalizedExpenses.length >
                    0 && (
                    <span className="nav-count">
                      {
                        normalizedExpenses.length
                      }
                    </span>
                  )}
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-ai">
          <div className="sidebar-ai-icon">
            ✦
          </div>

          <div>
            <strong>
              AI Assistant
            </strong>

            <p>
              Natural language expense tracking
            </p>
          </div>

          <span className="sidebar-online"></span>
        </div>

        <div className="sidebar-bottom">
          <div className="system-status">
            <span></span>

            <div>
              <strong>
                System operational
              </strong>

              <small>
                Backend connected
              </small>
            </div>
          </div>

          <div className="sidebar-footer">
            <span>
              ExpenseAI
            </span>

            <span>
              v1.0
            </span>
          </div>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-mark">
              ✦
            </div>

            <strong>
              Expense<span>AI</span>
            </strong>
          </div>

          <div className="topbar-right">
            <div className="connection-status">
              <span></span>
              API connected
            </div>

            <button
              className="topbar-icon"
              onClick={handleRefresh}
              title="Refresh data"
            >
              ↻
            </button>

            <div className="profile">
              <div className="profile-avatar">
                P
              </div>

              <div className="profile-info">
                <strong>
                  Personal account
                </strong>

                <span>
                  Expense dashboard
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-container">
          {loading && normalizedExpenses.length === 0 ? (
            <LoadingScreen />
          ) : (
            <>
              {activePage === "dashboard" &&
                renderDashboard()}

              {activePage === "expenses" &&
                renderExpenses()}

              {activePage === "analytics" &&
                renderAnalytics()}
            </>
          )}
        </div>
      </main>

      {/* =====================================================
          NOTIFICATION
      ===================================================== */}

      {notification.show && (
        <div
          className={`notification ${notification.type}`}
        >
          <div className="notification-icon">
            {notification.type === "success"
              ? "✓"
              : "!"}
          </div>

          <div>
            <strong>
              {notification.type === "success"
                ? "Success"
                : "Something went wrong"}
            </strong>

            <p>
              {notification.text}
            </p>
          </div>

          <button
            onClick={() =>
              setNotification({
                show: false,
                type: "",
                text: "",
              })
            }
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TRANSACTION LIST
========================================================= */

function TransactionList({
  expenses,
  formatCurrency,
  formatDate,
  getCategoryIcon,
  onDelete,
  compact = false,
}) {
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          ✦
        </div>

        <h3>
          No expenses yet
        </h3>

        <p>
          Add an expense using the AI assistant
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "transaction-list compact"
          : "transaction-list"
      }
    >
      {expenses.map((expense) => (
        <div
          className="transaction"
          key={expense.id}
        >
          <div className="transaction-left">
            <div className="transaction-icon">
              {getCategoryIcon(
                expense.category
              )}
            </div>

            <div className="transaction-details">
              <strong>
                {expense.description}
              </strong>

              <span>
                {expense.category}
                <i>•</i>
                {formatDate(expense.date)}
              </span>
            </div>
          </div>

          <div className="transaction-right">
            <strong>
              {formatCurrency(
                expense.amount
              )}
            </strong>

            <button
              className="delete-button"
              onClick={() =>
                onDelete(expense.id)
              }
              title="Delete expense"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   OVERVIEW ROW
========================================================= */

function OverviewRow({ label, value }) {
  return (
    <div className="overview-row">
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   LOADING SCREEN
========================================================= */

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        ✦
      </div>

      <div className="loading-spinner"></div>

      <h2>
        Loading your dashboard
      </h2>

      <p>
        Connecting to your expense database...
      </p>
    </div>
  );
}
