"""
Semantic Search Service
Natural language job search using embeddings + MongoDB text search
"""

import json
import re
from typing import Optional
from loguru import logger
import google.generativeai as genai
import numpy as np

from utils.config import settings
from models.job import Job
from models.job_match import JobMatch

# Configure the Gemini SDK with the API key
genai.configure(api_key=settings.GEMINI_API_KEY)


class SearchService:
    async def semantic_search(
        self,
        query: str,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """
        Natural language search with:
        1. Query parsing (extract intent, filters)
        2. Vector similarity (if embeddings available)
        3. MongoDB text search fallback
        """
        # Parse natural language query
        parsed = await self._parse_query(query)

        # Build MongoDB query from parsed intent
        mongo_filter = {"is_active": True}

        if parsed.get("min_salary"):
            mongo_filter["salary_min_lpa"] = {"$gte": parsed["min_salary"]}

        if parsed.get("remote_only"):
            mongo_filter["remote"] = True

        if parsed.get("job_type"):
            mongo_filter["job_type"] = parsed["job_type"]

        if parsed.get("platforms"):
            mongo_filter["source_platform"] = {"$in": parsed["platforms"]}

        # Text search on keywords
        keywords = parsed.get("keywords", [])
        if keywords:
            search_text = " ".join(keywords)
            mongo_filter["$text"] = {"$search": search_text}

        # Execute search
        total = await Job.find(mongo_filter).count()
        jobs = await Job.find(mongo_filter).sort(-Job.scraped_at).skip((page - 1) * per_page).limit(per_page).to_list()

        # Get match scores
        job_ids = [str(j.id) for j in jobs]
        matches = await JobMatch.find(
            JobMatch.user_id == user_id,
            {"job_id": {"$in": job_ids}},
        ).to_list()
        match_map = {m.job_id: m.match_percentage for m in matches}

        results = []
        for job in jobs:
            jid = str(job.id)
            results.append({
                "id": jid,
                "title": job.title,
                "company": job.company,
                "location": job.location,
                "remote": job.remote,
                "salary_display": job.salary_display,
                "salary_min_lpa": job.salary_min_lpa,
                "skills_required": job.skills_required,
                "apply_url": job.apply_url,
                "source_platform": job.source_platform,
                "posted_at": job.posted_at.isoformat() if job.posted_at else None,
                "match_score": match_map.get(jid),
                "job_type": job.job_type,
            })

        return {
            "query": query,
            "parsed_intent": parsed,
            "jobs": results,
            "total": total,
            "page": page,
            "per_page": per_page,
        }

    async def _parse_query(self, query: str) -> dict:
        """Use LLM to parse natural language search into structured filters"""
        prompt = f"""Parse this job search query into structured filters.

Query: "{query}"

Return JSON:
{{
  "keywords": ["search terms for job title/skills"],
  "min_salary": <number or null, in LPA>,
  "remote_only": <boolean>,
  "job_type": "full_time|internship|null",
  "platforms": ["platform names or empty list"],
  "location": "city/country or null"
}}

Examples:
"remote AI fresher jobs above 10 LPA" → {{"keywords": ["AI", "engineer"], "min_salary": 10, "remote_only": true}}
"Python backend developer Bangalore" → {{"keywords": ["Python", "backend"], "location": "Bangalore"}}

Return ONLY valid JSON."""

        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=200,
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text.strip())
        except Exception:
            # Fallback: simple keyword extraction
            return {"keywords": query.split(), "min_salary": None, "remote_only": False}

    async def get_suggestions(self, q: str) -> list[str]:
        common = [
            "AI Engineer fresher", "Backend Developer Python",
            "Full Stack Developer React", "GenAI Engineer",
            "Remote jobs above 10 LPA", "SDE 1 Bangalore",
            "Machine Learning Engineer fresher", "DevOps Engineer entry level",
        ]
        return [s for s in common if q.lower() in s.lower()][:5]
