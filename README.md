# 🛡️ ChurnShield AI  
## End-to-End Customer Churn Prediction & Business Insight System

Predicting customer churn isn't just about achieving high accuracy scores — it’s about **understanding human behavior and delivering actionable business insights**.

**ChurnShield AI** is an end-to-end, production-ready machine learning system that transforms raw telecom customer data into an **Early Warning System** for churn, complete with a live interactive dashboard.

---

## 🚀 Live Demo

👉 **Interactive Dashboard:**  
🔗 https://customerchurnshield.streamlit.app/

---

## 📌 Project Overview

This project leverages the **Telco Customer Churn Dataset (IBM Sample Data)** to predict customer churn in the telecommunications domain.

- 📊 **Dataset Size:** 7,043 customer records  
- 🎯 **Goal:** Identify high-risk customers *before* churn happens  
- 💡 **Outcome:** Actionable churn drivers to maximize retention ROI  

Rather than treating this as a Kaggle-style task, the project emphasizes:
- Business-driven metric selection  
- Leakage-free feature engineering  
- Interpretability-first model choice  
- Deployment-ready ML pipelines  

---

## ✨ Key Features

### 🔍 Exploratory Data Analysis
- Automated profiling using **ydata-profiling**
- Manual visualizations for deeper business reasoning

### 🧠 Leakage-Free Feature Engineering
- Created **AvgCharges** to capture long-term spending behavior
- Ensured no target leakage during feature construction

### 🧪 Multi-Model Benchmarking
Compared multiple models using ROC-AUC and recall:
- Logistic Regression (L1 Regularization)
- Random Forest
- XGBoost
- Decision Tree

### 🚀 Production Deployment
- End-to-end **Streamlit** app
- Real-time input scaling and prediction
- Clean SaaS-style UI for business users

---

## 📊 Key Business Insights

### ✅ Retention Drivers (Green Flags)
Customers are **less likely to churn** when they have:
- Long customer tenure
- Two-year contracts
- Higher average monthly charges

### ⚠️ Churn Risk Factors (Red Flags)
Customers are **more likely to churn** when they use:
- Fiber optic internet service
- Electronic check payment method
- Month-to-month contracts

These insights allow businesses to:
- Design targeted retention campaigns  
- Offer contract upgrades proactively  
- Reduce churn before revenue loss  

---

## 🛠️ Tech Stack

### 📦 Data & Analysis
- Pandas
- NumPy

### 📊 Visualization
- Matplotlib
- Seaborn
- ydata-profiling

### 🤖 Machine Learning
- Scikit-learn  
  - Logistic Regression (L1)
  - RFE
  - StandardScaler  
- XGBoost

### 🚀 Deployment
- Streamlit
- Joblib

---

## ⚙️ Installation & Usage

1️⃣ Clone the Repository
git clone https://github.com/sanjayrk2007/customer_churn_prediction.git

2️⃣ Install Dependencies
pip install -r requirements.txt

3️⃣ Run the App Locally
streamlit run app.py

---

## 📈 Model Performance

Final Model: L1-Regularized Logistic Regression

ROC-AUC: 0.845

## 🧠 Why Logistic Regression?

### Competitive performance vs tree-based models

### High interpretability for business stakeholders

### Clear feature coefficients → actionable insights

### This balance made it the most production-ready choice.

📌 Key Takeaway

This project demonstrates how machine learning becomes truly valuable when predictive power meets business interpretability and deployment readiness.

⭐ If you found this project insightful, feel free to star the repository!


---

