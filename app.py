import streamlit as st
import joblib
import pandas as pd
import numpy as np

# 1. Page Configuration
st.set_page_config(page_title="Customer Churn Predictor", layout="centered")
st.title("📊 Customer Churn Prediction App")
st.markdown("Enter customer details below to predict churn risk.")

# 2. Load Model and Scaler
@st.cache_resource # Caches model so it doesn't reload every time
def load_assets():
    model = joblib.load('churn_model.pkl')
    scaler = joblib.load('scaler.pkl')
    return model, scaler

model, scaler = load_assets()

# 3. User Inputs (Sidebar or Main Page)
st.sidebar.header("Customer Profile")
tenure = st.sidebar.slider("Tenure (Months)", 0, 72, 12)
monthly_charges = st.sidebar.number_input("Monthly Charges ($)", value=70.0)
avg_charges = st.sidebar.number_input("Average Lifetime Charges ($)", value=60.0)
senior_citizen = st.sidebar.selectbox("Senior Citizen?", ["No", "Yes"])

# Example for a categorical dropdown
contract = st.sidebar.selectbox("Contract Type", ["Month-to-month", "One year", "Two year"])
internet = st.sidebar.selectbox("Internet Service", ["DSL", "Fiber optic", "No"])

# 4. Prepare Data for Prediction
# NOTE: Ensure columns here match the EXACT order and names of your X_train columns
input_data = pd.DataFrame({
    'SeniorCitizen': [1 if senior_citizen == "Yes" else 0],
    'tenure': [tenure],
    'MonthlyCharges': [monthly_charges],
    'AvgCharges': [avg_charges],
    # Add dummy variables manually or use a mapping to match your one-hot encoding
    'InternetService_Fiber optic': [1 if internet == "Fiber optic" else 0],
    'Contract_One year': [1 if contract == "One year" else 0],
    'Contract_Two year': [1 if contract == "Two year" else 0],
    # ... add all other features your model expects ...
})

# 5. Prediction Logic
if st.button("Predict Churn Risk"):
    # Apply scaling to numeric features
    scaled_input = scaler.transform(input_data)
    
    # Get Probability
    prob = model.predict_proba(scaled_input)[0][1]
    
    st.subheader(f"Churn Probability: {prob:.2%}")
    
    if prob > 0.6:
        st.error("⚠️ High Risk of Churn")
    elif prob > 0.3:
        st.warning("🔸 Medium Risk")
    else:
        st.success("✅ Low Risk / Loyal Customer")
