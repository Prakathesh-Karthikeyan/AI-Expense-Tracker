# AI Expense Tracker

An AI-powered expense management web application designed to help users track expenses, manage personal finances, analyze spending patterns, and gain intelligent financial insights.

## 🚀 Features

- Add and manage expenses
- Categorize expenses
- Track income and spending
- Expense history
- Spending analysis
- AI-powered financial insights
- Dashboard with financial statistics
- Responsive web interface
- REST API backend

## 🛠️ Technologies

### Frontend
- React.js
- JavaScript
- HTML5
- CSS3
- Vite

### Backend
- Python
- FastAPI
- SQLAlchemy
- SQLite
- REST APIs

### AI
- AI-powered expense analysis
- Intelligent financial insights

### Tools
- Git
- GitHub
- VS Code

## 📂 Project Structure

AI-Expense-Tracker/
├── backend/
│   ├── app/
│   └── requirements.txt
├── frontend/
│   └── src/
└── .gitignore

## ⚙️ Installation

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

cd frontend
npm install
npm run dev


### Step 3 — Important

Don't add any `.env`, API keys, passwords, or database files to GitHub. Your `.gitignore` is already protecting those files.

After updating the README, commit and push:

```bat
git add README.md
git commit -m "Improve project documentation"
git push
