
# 🚀 Customer Churn Prediction

### End-to-End Machine Learning Project (Production-Style)

---

## 🧠 Project Overview

**Customer churn** is one of the most critical problems for **subscription-based businesses**.
This project builds a **complete, end-to-end machine learning pipeline** to predict customer churn using the **Telco Customer Churn dataset (IBM Sample Data)**.

Instead of focusing only on model scores, this project emphasizes **how real ML systems should be built and reasoned about**.

### 🔑 What this project focuses on

* #### Correct Problem Framing
* #### Exploratory Data Analysis (EDA with reasoning)
* #### Feature Engineering and feature reasoning
* #### Metric Selection aligned with business goals
* #### Evidence Based Model Selection
* #### Debugging So-Called Too Good Results

---

## 🎯 Problem Statement

**Can we predict which customers are likely to churn so that proactive retention strategies can be applied?**

* **Problem Type:** Binary Classification
* **Target Variable:** `Churn` (Yes / No)
* **Key Challenge:**

  * #ClassImbalance
  * #MisleadingAccuracyMetrics

---

## 📁 Dataset Summary

* **Dataset:** Telco Customer Churn (IBM Sample Data)
* **Records:** 7,043 customers
* **Features:** 21

### Feature Types

* Categorical
* Boolean
* Numerical
* Identifier (`customerID`)

Each row represents a customer’s:

* Service subscriptions
* Account and billing details
* Demographic information

---

## 🧭 Project Workflow

This project follows a **real-world ML workflow**, avoiding shortcut-driven modeling:

1. Data understanding
2. Automated EDA
3. Manual EDA & visualization
4. Feature cleaning and encoding
5. Model experimentation (baseline → advanced)
6. Debugging & leakage detection
7. Feature engineering
8. Fair model comparison
9. Final model selection

#RealWorldML #NoShortcuts

---

## 🔍 Exploratory Data Analysis (EDA)

### ⚙️ Automated EDA

Used **ydata-profiling** to obtain a fast, global overview.

Identified:

* Feature distributions
* Correlations
* Class imbalance
* Redundant relationships

> Automated EDA was used as a **diagnostic tool**, not a replacement for reasoning.

---

### 🔎 Manual EDA

To build intuition and validate automated findings, manual EDA included:

* Churn distribution
* Churn vs contract type
* Tenure vs churn
* Charges vs churn
* Correlation heatmap (numerical features only)

### 📌 Key Insights

* #ShortTenure customers churn more
* #MonthToMonth contracts have higher churn
* Higher charges increase churn risk
* Strong correlation between **tenure** and **TotalCharges**

---

## 🧹 Data Preprocessing

* Dropped `customerID` (identifier only)
* Encoded categorical features (one-hot encoding)
* Converted boolean features to numeric
* Performed **stratified train–test split**
* Verified class distribution after splitting

#CleanData #Reproducibility

---

## 📐 Metric Selection

Because churn datasets are **imbalanced**:

* **Primary Metric:** ROC-AUC
* **Business Priority:** Recall for churned customers (`Churn = 1`)
* **Accuracy:** Used only as a secondary sanity check

#MetricsMatter #BusinessFirst

---

## 🧪 Modeling Strategy

Models were trained **incrementally** to ensure fair comparison:

1. Logistic Regression (baseline)
2. Logistic Regression + L1 regularization
3. Decision Tree
4. Random Forest
5. XGBoost

#BaselineToAdvanced

---

## 🚨 Critical Debugging Moment: Feature Redundancy

During tree-based modeling, an **ROC-AUC of 1.0** was observed.

Instead of celebrating, the result was **questioned**.

### 🔍 Root Cause Identified

```
TotalCharges ≈ MonthlyCharges × tenure
```

* Created strong redundancy
* Tree models exploited it
* Inflated performance unrealistically

⚠️ This was **not label leakage**, but **feature leakage-like behavior**.

#DebuggingML #TooGoodToBeTrue

---

## 🛠️ Feature Engineering Fix

To restore realistic performance:

* Engineered a new feature

  ```
  AvgCharges = TotalCharges / (tenure + 1)
  ```
* Dropped `TotalCharges`
* Re-trained **all models from scratch**

This step restored **trustworthy, generalizable results**.

---

## 📊 Final Model Comparison

| Model                    | ROC-AUC   |
| ------------------------ | --------- |
| Logistic Regression (L1) | **0.845** |
| Random Forest            | 0.843     |
| XGBoost                  | 0.839     |
| Decision Tree            | 0.834     |

---

## 🏆 Final Model Selection

**Logistic Regression with L1 regularization** was selected as the final model.

### ✅ Why this model?

* Highest ROC-AUC
* Strong recall for churn
* Stable, well-calibrated probabilities
* Interpretable coefficients
* Competitive with complex models

> This result demonstrates that **well-engineered features can allow simple models to outperform advanced ones**.


---

## 🧠 Key Learnings

This project reinforced core machine learning principles:

* Metrics must align with **business objectives**
* Automated tools should **support**, not replace, thinking
* “Too good to be true” results must be investigated
* Feature engineering matters more than model complexity
* Clean tabular data favors simpler models
* Debugging and reasoning are **core ML skills**, not optional

#MachineLearningMindset #ThinkingOverTuning

---


