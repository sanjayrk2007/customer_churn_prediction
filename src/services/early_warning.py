from typing import List
from src.database.models import Customer, ActivityLog, SupportTicket

def detect_early_warnings(customer: Customer) -> List[str]:
    warnings = []

    # 1. Check for Usage Drop Alert
    logs = customer.activity_logs
    if len(logs) >= 5:
        # Sort by month_offset (1 to 6)
        sorted_logs = sorted(logs, key=lambda x: x.month_offset)
        
        # Calculate baseline from earlier months (offsets 1, 2, 3, 4)
        earlier_scores = [log.activity_score for log in sorted_logs[:-2]]
        avg_baseline = sum(earlier_scores) / len(earlier_scores) if earlier_scores else 0
        
        # Check current month (offset 6)
        current_score = sorted_logs[-1].activity_score
        
        if avg_baseline > 0:
            percentage_drop = ((avg_baseline - current_score) / avg_baseline) * 100
            if percentage_drop >= 30.0:
                warnings.append(f"Platform activity score dropped by {percentage_drop:.1f}% over the last 2 months.")

        # Check logins count drop
        earlier_logins = [log.login_count for log in sorted_logs[:-2]]
        avg_logins_baseline = sum(earlier_logins) / len(earlier_logins) if earlier_logins else 0
        current_logins = sorted_logs[-1].login_count
        
        if avg_logins_baseline > 0:
            logins_drop = ((avg_logins_baseline - current_logins) / avg_logins_baseline) * 100
            if logins_drop >= 30.0:
                warnings.append(f"Monthly login frequency dropped by {logins_drop:.1f}% in current month.")

    # 2. Check for Support Friction Alert (Open tickets)
    open_tickets = [ticket for ticket in customer.support_tickets if ticket.status == "Open"]
    if len(open_tickets) > 0:
        warnings.append(f"Customer has {len(open_tickets)} open unresolved support ticket(s) ({', '.join([t.ticket_type for t in open_tickets])}).")

    # 3. Contract Risks (Month-to-month is a heavy churn driver in IBM dataset)
    if customer.contract == "Month-to-month":
        warnings.append("Month-to-month contract exposes account to higher transactional churn risk.")

    # 4. Payment Method Warning (Electronic checks are correlated with higher churn rates)
    if customer.payment_method == "Electronic check":
        warnings.append("High-churn billing method (Electronic check) currently active.")

    # 5. Financial Exposure Alert
    if customer.monthly_charges >= 90.0:
        warnings.append(f"Premium subscription level ($ {customer.monthly_charges:.2f}/mo) increases financial churn probability.")

    return warnings
