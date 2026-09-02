from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.expense import Expense


router = APIRouter(
    prefix="/expenses",
    tags=["Expenses"]
)


# =========================================================
# CREATE EXPENSE
# =========================================================
@router.post("/")
def create_expense(
    amount: float,
    category: str,
    description: str,
    date: str,
    db: Session = Depends(get_db)
):

    expense = Expense(
        amount=amount,
        category=category,
        description=description,
        date=date
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


# =========================================================
# GET ALL EXPENSES
# =========================================================
@router.get("/")
def get_expenses(
    db: Session = Depends(get_db)
):

    return db.query(Expense).all()


# =========================================================
# DELETE ALL EXPENSES
# =========================================================
@router.delete("/all")
def delete_all_expenses(
    db: Session = Depends(get_db)
):

    expenses = db.query(Expense).all()

    if not expenses:
        return {
            "message": "No expenses to delete"
        }

    for expense in expenses:
        db.delete(expense)

    db.commit()

    return {
        "message": "All expenses deleted successfully"
    }


# =========================================================
# DELETE SINGLE EXPENSE
# =========================================================
@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db)
):

    expense = db.query(Expense).filter(
        Expense.id == expense_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return {
        "message": "Expense deleted successfully"
    }


# =========================================================
# UPDATE EXPENSE
# =========================================================
@router.put("/{expense_id}")
def update_expense(
    expense_id: int,
    amount: float,
    description: str,
    category: str,
    date: str,
    db: Session = Depends(get_db)
):

    expense = db.query(Expense).filter(
        Expense.id == expense_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    expense.amount = amount
    expense.description = description
    expense.category = category
    expense.date = date

    db.commit()
    db.refresh(expense)

    return expense