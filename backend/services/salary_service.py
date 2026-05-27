"""
Salary Estimation Service
Uses heuristics + OpenAI to estimate missing salaries
Uses heuristics + Gemini to estimate missing salaries
"""

import json
import re
from typing import Optional
from loguru import logger
import google.generativeai as genai

from utils.config import settings

# Configure the Gemini SDK with the API key
genai.configure(api_key=settings.GEMINI_API_KEY)

# Heuristic salary data (₹ LPA) for freshers in India
COMPANY_TIER = {
    "tier1": {
        "companies": ["google", "microsoft", "amazon", "meta", "apple", "netflix", "uber", "airbnb",
                      "stripe", "anthropic", "openai", "deepmind", "nvidia"],
        "min_lpa": 30, "max_lpa": 60,
    },
    "tier2": {
        "companies": ["flipkart", "swiggy", "zomato", "razorpay", "paytm", "phonepe", "meesho",
                      "cred", "byju", "unacademy", "nykaa", "ola", "dunzo", "freshworks",
                      "zoho", "atlassian", "salesforce", "adobe", "oracle", "sap"],
        "min_lpa": 15, "max_lpa": 30,
    },
    "tier3": {
        "companies": ["tcs", "infosys", "wipro", "hcl", "tech mahindra", "cognizant", "capgemini",
                      "accenture", "mphasis", "hexaware"],
        "min_lpa": 3.5, "max_lpa": 8,
    },
    "default_startup": {"min_lpa": 8, "max_lpa": 18},
    "default_mnc": {"min_lpa": 6, "max_lpa": 14},
    "default": {"min_lpa": 5, "max_lpa": 10},
}

ROLE_MULTIPLIER = {
    "ai": 1.5, "ml": 1.4, "machine learning": 1.4, "genai": 1.6, "llm": 1.5,
    "backend": 1.1, "frontend": 1.0, "fullstack": 1.15, "full stack": 1.15,
    "devops": 1.2, "cloud": 1.2, "security": 1.25, "data": 1.1,
    "sde": 1.0, "software engineer": 1.0, "python": 1.1,
}


class SalaryEstimationService:
    def __init__(self):
        pass

    async def estimate(
        self,
        title: str,
        company: str,
        location: str,
        skills: list[str],
    ) -> dict:
        """Estimate salary range using heuristics first, LLM as fallback"""
        # Try heuristics first (fast & free)
        try:
            val = self._heuristic_estimate(title, company, location, skills)
            if val:
                return val
        except Exception as e:
            logger.warning(f"Heuristic salary estimation failed: {e}")

        # Fallback to LLM
        try:
            return await self._llm_estimate(title, company, location, skills)
        except Exception as e:
            logger.error(f"LLM salary estimation failed: {e}")
            return {"min_lpa": 8, "max_lpa": 15, "confidence": "low", "method": "fallback"}

    def _heuristic_estimate(self, title: str, company: str, location: str, skills: list) -> Optional[dict]:
        # Simple tier/role lookup logic
        company_lower = company.lower()
        title_lower = title.lower()

        # Check tier
        base = COMPANY_TIER["default"]
        confidence = "low"
        
        for tier, data in COMPANY_TIER.items():
            if tier == "default" or tier.startswith("default_"):
                continue
            if any(c in company_lower for c in data["companies"]):
                base = data
                confidence = "high"
                break
        
        if confidence == "low":
            # MNC check
            if any(kw in company_lower for kw in ["tata", "reliance", "wipro", "tcs", "cognizant", "accenture", "ibm", "capgemini"]):
                base = COMPANY_TIER["default_mnc"]
                confidence = "medium"
            elif len(company) > 3:  # default to startup/general
                base = COMPANY_TIER["default_startup"]
                confidence = "medium"

        # Apply multiplier
        multiplier = 1.0
        for role_keyword, mult in ROLE_MULTIPLIER.items():
            if role_keyword in title_lower:
                multiplier = max(multiplier, mult)
                break
        
        min_lpa = round(base["min_lpa"] * multiplier, 1)
        max_lpa = round(base["max_lpa"] * multiplier, 1)

        return {
            "min_lpa": min_lpa,
            "max_lpa": max_lpa,
            "confidence": confidence,
            "method": "heuristic",
        }

    async def _llm_estimate(self, title: str, company: str, location: str, skills: list) -> dict:
        prompt = f"""Estimate the salary range for this entry-level tech job in India (in LPA - Lakhs Per Annum).

Job Title: {title}
Company: {company}
Location: {location}
Required Skills: {', '.join(skills[:10])}
Experience: 0-1 years (fresher)

Respond ONLY with a JSON object, no explanation:
{{"min_lpa": <number>, "max_lpa": <number>, "confidence": "high|medium|low"}}"""

        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=100,
                    response_mime_type="application/json",
                ),
            )
            data = json.loads(response.text.strip())
            data["method"] = "llm"
            return data
        except Exception as e:
            logger.error(f"Gemini LLM salary estimation failed: {e}")
            return {"min_lpa": 8, "max_lpa": 15, "confidence": "low", "method": "fallback"}
