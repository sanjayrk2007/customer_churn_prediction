import streamlit as st
import joblib
import pandas as pd
import numpy as np
import os

# 1. Setup Page Configuration
st.set_page_config(page_title="Telco Churn Predictor", layout="centered")
st.title("📊 Customer Churn Prediction App")
st.markdown("Enter customer details below to predict their likelihood of leaving (churning).")

# 2. Robust Asset Loading
base_path = os.path.dirname(__file__)

@st.cache_resource
def load_assets():
    try:
        model_path = os.path.join(base_path, 'churn_model.pkl')
        scaler_path = os.path.join(base_path, 'scaler.pkl')
        
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)
        return model, scaler
    except FileNotFoundError:
        st.error("Error: Model or Scaler files not found. Please ensure 'churn_model.pkl' and 'scaler.pkl' are in your GitHub repository.")
        return None, None

model, scaler = load_assets()

if model and scaler:
    # 3. User Inputs
    st.sidebar.header("Customer Details")
    
    # Numeric Inputs
    tenure = st.sidebar.slider("Tenure (Months)", 0, 72, 12)
    monthly_charges = st.sidebar.number_input("Monthly Charges ($)", value=70.0)
    avg_charges = st.sidebar.number_input("Average Lifetime Charges ($)", value=60.0)
    senior_citizen = st.sidebar.selectbox("Senior Citizen?", ["No", "Yes"])

    # Categorical Inputs
    contract = st.sidebar.selectbox("Contract Type", ["Month-to-month", "One year", "Two year"])
    internet = st.sidebar.selectbox("Internet Service", ["DSL", "Fiber optic", "No"])
    paperless = st.sidebar.selectbox("Paperless Billing?", ["No", "Yes"])
    payment = st.sidebar.selectbox("Payment Method", ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"])
    streaming_tv = st.sidebar.selectbox("Streaming TV?", ["No", "Yes", "No internet service"])
    streaming_movies = st.sidebar.selectbox("Streaming Movies?", ["No", "Yes", "No internet service"])
    multi_lines = st.sidebar.selectbox("Multiple Lines?", ["No", "Yes", "No phone service"])

    # 4. Data Preparation (Fixing the ValueError)
    # Start with a dictionary of the basic raw inputs
    raw_data = {
        'SeniorCitizen': 1 if senior_citizen == "Yes" else 0,
        'tenure': tenure,
        'MonthlyCharges': monthly_charges,
        'AvgCharges': avg_charges,
        # Map categorical variables to their one-hot encoded counterparts
        'InternetService_Fiber optic': 1 if internet == "Fiber optic" else 0,
        'InternetService_No': 1 if internet == "No" else 0,
        'Contract_One year': 1 if contract == "One year" else 0,
        'Contract_Two year': 1 if contract == "Two year" else 0,
        'PaperlessBilling_Yes': 1 if paperless == "Yes" else 0,
        'PaymentMethod_Credit card (automatic)': 1 if payment == "Credit card (automatic)" else 0,
        'PaymentMethod_Electronic check': 1 if payment == "Electronic check" else 0,
        'PaymentMethod_Mailed check': 1 if payment == "Mailed check" else 0,
        'StreamingTV_No internet service': 1 if streaming_tv == "No internet service" else 0,
        'StreamingTV_Yes': 1 if streaming_tv == "Yes" else 0,
        'StreamingMovies_No internet service': 1 if streaming_movies == "No internet service" else 0,
        'StreamingMovies_Yes': 1 if streaming_movies == "Yes" else 0,
        'MultipleLines_No phone service': 1 if multi_lines == "No phone service" else 0,
        'MultipleLines_Yes': 1 if multi_lines == "Yes" else 0,
    }

    # Convert to DataFrame
    input_df = pd.DataFrame([raw_data])

    # --- CRITICAL FIX: FEATURE ALIGNMENT ---
    # 1. Get the exact feature names the scaler was trained on
    expected_features = scaler.feature_names_in_ #

    # 2. Add any missing features from the original model with value 0
    for col in expected_features:
        if col not in input_df.columns:
            input_df[col] = 0 #

    # 3. Reorder columns to match the training data exactly
    input_df = input_df[expected_features] #

    # 5. Prediction Logic
    if st.button("Calculate Churn Risk"):
        # Scale only once features are perfectly aligned
        scaled_input = scaler.transform(input_df) #
        
        # Make prediction
        prob = model.predict_proba(scaled_input)[0][1]
        
        st.divider()
        st.subheader(f"Churn Probability: {prob:.2%}")
        
        if prob > 0.6:
            st.error("🚨 **High Risk:** This customer is very likely to leave.")
        elif prob > 0.3:
            st.warning("⚠️ **Medium Risk:** Consider a proactive retention offer.")
        else:
            st.success("✅ **Low Risk:** This customer appears loyal.")
