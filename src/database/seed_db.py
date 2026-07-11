import os
import pandas as pd
import numpy as np
import random
from src.database.db import init_db, SessionLocal
from src.database.models import Customer, ActivityLog, SupportTicket

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

CSV_PATH = '/Users/rksanjayaanand/Projects/customer_churn_prediction/customer_churn_prediction/WA_Fn-UseC_-Telco-Customer-Churn.csv'

def seed():
    print("Initializing Database...")
    init_db()
    session = SessionLocal()

    # Check if database is already seeded
    if session.query(Customer).count() > 0:
        print("Database already seeded. Skipping.")
        session.close()
        return

    print("Loading IBM Telco Customer Churn dataset...")
    df = pd.read_csv(CSV_PATH)

    # Impute missing TotalCharges as done in notebook
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
    total_charges_median = df['TotalCharges'].median()
    df['TotalCharges'] = df['TotalCharges'].fillna(total_charges_median)

    # Calculate AvgCharges
    df['AvgCharges'] = df['TotalCharges'] / (df['tenure'] + 1)

    print("Seeding customer profiles and generating historical logs...")
    
    customers_to_insert = []
    logs_to_insert = []
    tickets_to_insert = []

    # Choose a subset to make it extremely fast for testing but large enough to look real
    # Let's seed all 7043 records, since SQLite bulk insert handles this in < 5 seconds.
    for index, row in df.iterrows():
        cust_id = row['customerID']
        is_churn = 1 if row['Churn'] == 'Yes' else 0
        
        customer = Customer(
            id=cust_id,
            gender=row['gender'],
            senior_citizen=int(row['SeniorCitizen']),
            partner=row['Partner'],
            dependents=row['Dependents'],
            tenure=int(row['tenure']),
            phone_service=row['PhoneService'],
            multiple_lines=row['MultipleLines'],
            internet_service=row['InternetService'],
            online_security=row['OnlineSecurity'],
            online_backup=row['OnlineBackup'],
            device_protection=row['DeviceProtection'],
            tech_support=row['TechSupport'],
            streaming_tv=row['StreamingTV'],
            streaming_movies=row['StreamingMovies'],
            contract=row['Contract'],
            paperless_billing=row['PaperlessBilling'],
            payment_method=row['PaymentMethod'],
            monthly_charges=float(row['MonthlyCharges']),
            avg_charges=float(row['AvgCharges']),
            actual_churn=is_churn
        )
        customers_to_insert.append(customer)

        # Generate 6 months of historical activity logs
        # Month 1 is 5 months ago, Month 6 is the current month
        base_activity = random.randint(55, 85)
        base_logins = random.randint(12, 28)

        for month in range(1, 7):
            if is_churn:
                # Churning customers show drops in platform usage
                # We decrease score significantly in months 5 and 6
                if month >= 5:
                    activity_score = max(5.0, base_activity * (1 - 0.25 * (month - 4)) - random.randint(5, 15))
                    login_count = max(1, int(base_logins * (1 - 0.20 * (month - 4)) - random.randint(2, 5)))
                else:
                    activity_score = max(10.0, base_activity + random.randint(-5, 5))
                    login_count = max(2, base_logins + random.randint(-2, 2))
            else:
                # Retained customers have stable scores
                activity_score = max(10.0, base_activity + random.randint(-6, 6))
                login_count = max(2, base_logins + random.randint(-2, 2))

            log = ActivityLog(
                customer_id=cust_id,
                month_offset=month,
                login_count=login_count,
                activity_score=round(activity_score, 2)
            )
            logs_to_insert.append(log)

        # Support tickets generation
        # Churning customers have a higher chance of open billing/technical support complaints
        if is_churn:
            if random.random() < 0.6:  # 60% chance of ticket
                status = "Open" if random.random() < 0.7 else "Resolved"
                ticket_type = random.choice(["Billing", "Technical"])
                description = (
                    "Customer called complaining about high internet charges and wants a discount." 
                    if ticket_type == "Billing" else 
                    "Fiber optic connection is dropping frequently. Highly dissatisfied with the speed."
                )
                ticket = SupportTicket(
                    customer_id=cust_id,
                    ticket_type=ticket_type,
                    status=status,
                    description=description
                )
                tickets_to_insert.append(ticket)
        else:
            if random.random() < 0.15:  # 15% chance of ticket for loyal customers
                ticket = SupportTicket(
                    customer_id=cust_id,
                    ticket_type=random.choice(["Billing", "Technical", "General"]),
                    status="Resolved",
                    description="Inquiry about contract renewal details. Resolved successfully."
                )
                tickets_to_insert.append(ticket)

    # Perform bulk inserts for speed
    print("Writing customers to database...")
    session.bulk_save_objects(customers_to_insert)
    session.commit()

    print("Writing activity logs to database...")
    session.bulk_save_objects(logs_to_insert)
    session.commit()

    print("Writing support tickets to database...")
    session.bulk_save_objects(tickets_to_insert)
    session.commit()

    print(f"Seeding completed successfully! Seeded {len(customers_to_insert)} customers.")
    session.close()

if __name__ == "__main__":
    seed()
