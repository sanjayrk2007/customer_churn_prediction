import streamlit as st
import joblib
import pandas as pd
import numpy as np
import os

# 1. Branding & Styling
st.set_page_config(page_title="ChurnShield AI", page_icon="🛡️", layout="wide")

# Custom CSS for "Top-to-Bottom" visual appeal and color accents
st.markdown("""
    <style>
    .main {
        background-color: #f5f7f9;
    }
    .stButton>button {
        width: 100%;
        border-radius: 5px;
        height: 3em;
        background-color: #007bff;
        color: white;
    }
    .prediction-box {
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        margin-top: 20px;
    }
    </style>
    """, unsafe_allow_stdio=True)

# 2. Asset Loading
base_path = os.path.dirname(__file__)

@st.cache_resource
def load_assets():
    try:
        model = joblib.load(os.path.join(base_path, 'churn_model.pkl'))
        scaler = joblib.load(os.path.join(base_path, 'scaler.pkl'))
        return model, scaler
    except:
        return None, None

model, scaler = load_assets()

# 3. Header Section
st.title("🛡️ ChurnShield: Telco Retention AI")
st.info("This AI analyzes customer behavior to predict potential churn risk and suggest retention strategies.")

if model and scaler:
    # 4. Form Layout: Organized in vertical sections
    with st.container():
        st.subheader("📋 Customer Profile")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            tenure = st.number_input("Tenure (Months)", min_value=0, max_value=72, value=12)
            senior_citizen = st.selectbox("Senior Citizen?", ["No", "Yes"])
        with col2:
            monthly_charges = st.number_input("Monthly Charges ($)", min_value=0.0, value=70.0)
            contract = st.selectbox("Contract Type", ["Month-to-month", "One year", "Two year"])
        with col3:
            avg_charges = st.number_input("Avg Lifetime Charges ($)", min_value=0.0, value=60.0)
            internet = st.selectbox("Internet Service", ["Fiber optic", "DSL", "No"])

        st.divider()
        st.subheader("🛠️ Services & Billing")
        col4, col5, col6 = st.columns(3)
        
        with col4:
            multi_lines = st.selectbox("Multiple Lines?", ["No", "Yes", "No phone service"])
            paperless = st.selectbox("Paperless Billing?", ["Yes", "No"])
        with col5:
            streaming_tv = st.selectbox("Streaming TV?", ["No", "Yes", "No internet service"])
            payment = st.selectbox("Payment Method", ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"])
        with col6:
            streaming_movies = st.selectbox("Streaming Movies?", ["No", "Yes", "No internet service"])

    # 5. Prediction Engine
    if st.button("🚀 Analyze Churn Risk"):
        # Data Preparation & Feature Alignment
        raw_data = {
            'SeniorCitizen': 1 if senior_citizen == "Yes" else 0,
            'tenure': tenure,
            'MonthlyCharges': monthly_charges,
            'AvgCharges': avg_charges,
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

        input_df = pd.DataFrame([raw_data])
        expected_features = scaler.feature_names_in_
        for col in expected_features:
            if col not in input_df.columns:
                input_df[col] = 0
        input_df = input_df[expected_features]

        # Get results
        scaled_input = scaler.transform(input_df)
        prob = model.predict_proba(scaled_input)[0][1]

        # 6. Visualized Results
        st.write("### Analysis Result")
        
        # Risk Meter
        st.progress(prob)
        
        if prob > 0.6:
            st.error(f"### 🚨 High Risk Detected: {prob:.1%}")
            st.write("**Recommended Action:** Immediate retention discount or concierge outreach.")
        elif prob > 0.3:
            st.warning(f"### ⚠️ Medium Risk: {prob:.1%}")
            st.write("**Recommended Action:** Upsell to a long-term contract.")
        else:
            st.success(f"### ✅ Low Risk: {prob:.1%}")
            st.write("**Recommended Action:** Maintain standard engagement.")
