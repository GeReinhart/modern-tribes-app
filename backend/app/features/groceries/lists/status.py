from datetime import date


def effective_list_status(list_status: str, scheduled_date: date) -> str:
    """A planned list whose scheduled date has passed is shown as passed; a done list stays done regardless of date."""
    if list_status == "planned" and scheduled_date < date.today():
        return "passed"
    return list_status
