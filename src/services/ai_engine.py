import os
from typing import List, Dict, Any
import google.generativeai as genai
from src.database.models import Customer
from src.config import GEMINI_API_KEY, GEMINI_MODEL

# Configure Gemini if key is provided
is_gemini_available = False
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        is_gemini_available = True
    except Exception as e:
        print(f"Failed to configure Gemini API: {e}")

def get_deterministic_fallback(customer: Customer, warnings: List[str], churn_prob: float) -> Dict[str, Any]:
    """
    High-fidelity deterministic fallback engine to generate natural-sounding explanations 
    and recommended actions if the Gemini API is offline or not configured.
    """
    risk_level = "High" if churn_prob > 0.6 else "Medium" if churn_prob > 0.3 else "Low"
    
    # 1. Generate explanation narrative
    reasons = []
    for w in warnings:
        if "activity score" in w or "login" in w:
            reasons.append("a significant drop in platform activity and login frequency")
        elif "support ticket" in w:
            reasons.append("unresolved customer support issues causing service friction")
        elif "Month-to-month" in w:
            reasons.append("the lack of a long-term commitment on their month-to-month plan")
        elif "check" in w:
            reasons.append("potential billing friction associated with manual electronic check payments")
        elif "charges" in w:
            reasons.append("high subscription costs compared to typical customer plans")

    if not reasons:
        if risk_level == "Low":
            explanation = "This customer shows stable usage patterns, zero billing complaints, and strong contract commitment, indicating a healthy account status."
        else:
            explanation = f"Account shows a {churn_prob:.1%} churn risk, primarily driven by underlying behavioral and contract configurations."
    else:
        if len(reasons) == 1:
            reason_str = reasons[0]
        elif len(reasons) == 2:
            reason_str = f"{reasons[0]} and {reasons[1]}"
        else:
            reason_str = f"{', '.join(reasons[:-1])}, and {reasons[-1]}"
        explanation = f"Customer has a {churn_prob:.1%} ({risk_level} Risk) likelihood of churn. This is primarily triggered by {reason_str}."

    # 2. Generate actionable recommendations
    recommendations = []
    has_usage_drop = any("activity" in w or "login" in w for w in warnings)
    has_support = any("support" in w for w in warnings)
    has_m2m = any("contract" in w or "Month-to-month" in w for w in warnings)
    has_high_cost = any("charges" in w for w in warnings)

    if has_support:
        recommendations.append("Prioritize outstanding support tickets: Escalate current open tickets to Tier-2 support for immediate resolution.")
        recommendations.append("CSM Outreach: Schedule a customer success call to address billing/technical frustrations directly.")
    if has_usage_drop:
        recommendations.append("Re-engagement Campaign: Send a personalized feature highlight email based on their plan (DSL/Fiber optic).")
        recommendations.append("Onboarding Review: Offer a complimentary refresher walkthrough session to re-establish platform value.")
    if has_m2m:
        recommendations.append("Contract Conversion Campaign: Pitch a 1-year or 2-year contract conversion, offering a 10-15% monthly discount incentive.")
    if has_high_cost:
        recommendations.append("Plan Right-Sizing: Review customer service usage (e.g. streaming, tech support) to offer a more cost-effective bundle.")
    
    # Generic recommendations if none triggered
    if not recommendations:
        if risk_level == "Low":
            recommendations.append("Maintain Standard Engagement: Offer early access to upcoming features and newsletters.")
            recommendations.append("Upsell Check: Identify potential upsell opportunities for additional services (e.g., Online Security/Cloud Backup).")
        else:
            recommendations.append("Proactive Check-in: Schedule a general feedback survey or customer health check call.")
            recommendations.append("Loyalty Incentive: Offer a loyalty reward package or monthly fee discount.")

    return {
        "explanation": explanation,
        "recommendations": recommendations
    }

def generate_ai_narrative(customer: Customer, warnings: List[str], churn_prob: float) -> Dict[str, Any]:
    """
    Call Gemini API to generate professional explanations and retention actions.
    Falls back to a high-quality deterministic model if API is offline.
    """
    fallback_data = get_deterministic_fallback(customer, warnings, churn_prob)
    
    if not is_gemini_available:
        return fallback_data

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        prompt = f"""
        You are an expert Customer Success Director at a leading telecommunications company.
        Analyze this customer profile and generate a structured response containing:
        1. A 2-sentence explanation of why they are likely to churn, written in a professional, objective tone.
        2. A list of 3-4 specific, actionable retention actions the account manager should take.

        Customer Stats:
        - Customer ID: {customer.id}
        - Tenure: {customer.tenure} months
        - Monthly Cost: ${customer.monthly_charges:.2f}
        - Contract Type: {customer.contract}
        - Internet Service: {customer.internet_service}
        - Payment Method: {customer.payment_method}
        - Predicted Churn Probability: {churn_prob:.1%}
        - Detected Warning Flags: {", ".join(warnings) if warnings else "None"}

        Format your response strictly as JSON with two keys:
        - "explanation": (string) The explanation.
        - "recommendations": (list of strings) The 3-4 actionable steps.
        
        Example JSON format:
        {{
            "explanation": "Customer has a 75% churn risk driven by a 40% drop in login activity and unresolved billing disputes.",
            "recommendations": [
                "Prioritize billing ticket resolution and offer a one-time refund.",
                "Pitch a 1-year contract conversion with a 15% discount."
            ]
        }}
        """
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean markdown wrappers if returned
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        import json
        data = json.loads(response_text)
        
        if "explanation" in data and "recommendations" in data:
            return {
                "explanation": data["explanation"],
                "recommendations": data["recommendations"]
            }
        else:
            return fallback_data
            
    except Exception as e:
        print(f"Gemini API call failed, using deterministic fallback. Error: {e}")
        return fallback_data
