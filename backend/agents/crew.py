"""
AI Agent Crew - CrewAI Multi-Agent System
Agents: Job Search, Salary Estimation, Resume Match, Notification, Skill Recommendation
"""

from crewai import Agent, Task, Crew, Process
from langchain_google_genai import ChatGoogleGenerativeAI
from typing import List, Optional
from loguru import logger

from utils.config import settings

# Shared LLM - Gemini 2.5 Flash via official LangChain Google integration
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=settings.GEMINI_API_KEY,
    temperature=0.3,
)


# ── Agent Definitions ─────────────────────────────────────────

def create_job_search_agent() -> Agent:
    return Agent(
        role="Senior Technical Recruiter",
        goal=(
            "Search and discover fresh entry-level jobs (0–1 years experience) "
            "from multiple platforms for freshers and new graduates. "
            "Focus on roles like SDE-1, AI Engineer, Backend Developer, Full Stack Developer."
        ),
        backstory=(
            "You are an expert technical recruiter with deep knowledge of the Indian and global "
            "tech job market. You specialize in helping fresh graduates and entry-level candidates "
            "find the best opportunities. You have extensive experience with LinkedIn, Naukri, "
            "Wellfound, and startup hiring platforms."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def create_salary_estimation_agent() -> Agent:
    return Agent(
        role="Compensation & Benefits Analyst",
        goal=(
            "Accurately estimate salary ranges for freshers in Indian tech companies "
            "when salary data is missing from job listings. "
            "Minimum threshold: ₹8 LPA for quality filtering."
        ),
        backstory=(
            "You are a compensation analyst with 10+ years of experience in the Indian tech industry. "
            "You have deep knowledge of salary benchmarks at top tech companies (TCS, Infosys, Wipro, "
            "Cognizant, MNCs, startups) for freshers and entry-level engineers. "
            "You use company reputation, role type, location, and market data to estimate salaries."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def create_resume_match_agent() -> Agent:
    return Agent(
        role="AI Career Advisor",
        goal=(
            "Analyze resumes against job descriptions, calculate semantic match scores, "
            "identify skill gaps, and rank job opportunities by compatibility."
        ),
        backstory=(
            "You are an expert career advisor and technical interviewer who has reviewed "
            "thousands of resumes and job descriptions. You deeply understand what makes "
            "a resume match a job posting, and can identify the most critical skills gaps "
            "and opportunities for improvement."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def create_notification_agent() -> Agent:
    return Agent(
        role="Job Alert Specialist",
        goal=(
            "Filter and send the most relevant, high-quality job alerts to users "
            "via Telegram and email. Prioritize jobs above ₹8 LPA with high match scores."
        ),
        backstory=(
            "You are a specialist in personalised job notifications. You craft compelling, "
            "concise alerts that give freshers exactly the information they need to act fast "
            "on great opportunities. You understand urgency and prioritisation."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


def create_skill_recommendation_agent() -> Agent:
    return Agent(
        role="Technical Skills Coach",
        goal=(
            "Analyse job market trends and the user's current skillset to recommend "
            "exactly what technologies and skills to learn next for maximum employability."
        ),
        backstory=(
            "You are a technical skills coach who has helped thousands of freshers land "
            "their first tech job. You stay up-to-date with the latest hiring trends, "
            "in-demand technologies, and can create personalised learning roadmaps."
        ),
        verbose=True,
        allow_delegation=False,
        llm=llm,
    )


# ── Crew Builder ──────────────────────────────────────────────

class JobHunterCrew:
    def __init__(self):
        self.job_search_agent = create_job_search_agent()
        self.salary_agent = create_salary_estimation_agent()
        self.resume_agent = create_resume_match_agent()
        self.notification_agent = create_notification_agent()
        self.skill_agent = create_skill_recommendation_agent()

    def run_salary_estimation(self, job_data: dict) -> dict:
        """Estimate salary for a job with missing compensation data"""
        task = Task(
            description=f"""
            Estimate the salary range for this job posting in INR LPA (Lakhs Per Annum).
            
            Job Details:
            - Title: {job_data.get('title')}
            - Company: {job_data.get('company')}
            - Location: {job_data.get('location')}
            - Skills Required: {', '.join(job_data.get('skills_required', []))}
            - Experience: {job_data.get('experience_min', 0)}–{job_data.get('experience_max', 1)} years
            
            Provide:
            1. Minimum salary estimate (LPA)
            2. Maximum salary estimate (LPA)
            3. Confidence level (high/medium/low)
            4. Brief reasoning
            
            Respond in JSON format:
            {{"min_lpa": <float>, "max_lpa": <float>, "confidence": "<str>", "reasoning": "<str>"}}
            """,
            expected_output="JSON with salary estimation",
            agent=self.salary_agent,
        )

        crew = Crew(agents=[self.salary_agent], tasks=[task], process=Process.sequential)
        result = crew.kickoff()
        return result

    def run_skill_recommendations(self, resume_skills: List[str], missing_skills: List[str]) -> dict:
        """Generate skill recommendations based on job market analysis"""
        task = Task(
            description=f"""
            Based on the following analysis, create a prioritised learning roadmap for a fresher:
            
            Current Skills: {', '.join(resume_skills)}
            Most Frequently Missing Skills in Top Jobs: {', '.join(missing_skills[:20])}
            
            Provide:
            1. Top 5 skills to learn immediately (highest ROI)
            2. Recommended learning resources for each
            3. Estimated time to become job-ready
            4. Career path suggestion
            
            Format response as structured JSON.
            """,
            expected_output="Structured skill recommendations in JSON",
            agent=self.skill_agent,
        )

        crew = Crew(agents=[self.skill_agent], tasks=[task], process=Process.sequential)
        result = crew.kickoff()
        return result

    def run_resume_analysis(self, resume_text: str, job_descriptions: List[str]) -> dict:
        """Analyse resume against multiple job descriptions"""
        task = Task(
            description=f"""
            Analyse this resume against the provided job descriptions.
            
            Resume:
            {resume_text[:3000]}
            
            Sample Job Descriptions:
            {chr(10).join(job_descriptions[:3])}
            
            Provide:
            1. Overall employability score (0–100)
            2. Key strengths
            3. Critical skill gaps
            4. Immediate improvement suggestions
            5. Best matching role types
            
            Format as JSON.
            """,
            expected_output="Resume analysis JSON",
            agent=self.resume_agent,
        )

        crew = Crew(agents=[self.resume_agent], tasks=[task], process=Process.sequential)
        result = crew.kickoff()
        return result


# Singleton instance
job_hunter_crew = JobHunterCrew()
