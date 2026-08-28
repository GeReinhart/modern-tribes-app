from datetime import date
from typing import Optional


def effective_list_status(list_status: str, scheduled_date: Optional[date]) -> str:
    """A planned list whose scheduled date has passed is shown as passed; a done list stays done
    regardless of date; a list with no date yet is never considered passed."""
    if list_status == "planned" and scheduled_date is not None and scheduled_date < date.today():
        return "passed"
    return list_status
