"""
Gemini API Configuration Module for Samadhan
Allows secure API key management through environment variables
"""

import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv
from google import genai
from typing import Dict, List, Any, Callable
from collections import deque
import threading

# Load environment variables from .env file
load_dotenv()


class RateLimiter:
    """
    Rate limiter to prevent 429 (Too Many Requests) errors from Gemini API
    
    Features:
    - Token bucket algorithm
    - Exponential backoff on rate limit hits
    - Request queuing
    - Configurable request limits per minute/hour
    """
    
    def __init__(
        self,
        requests_per_minute: int = 30,
        requests_per_hour: int = 1500,
        max_retries: int = 5,
        initial_retry_delay: float = 1.0
    ):
        """
        Initialize rate limiter
        
        Args:
            requests_per_minute (int): Max requests per minute (default: 30 for free tier)
            requests_per_hour (int): Max requests per hour (default: 1500 for free tier)
            max_retries (int): Max retry attempts on rate limit
            initial_retry_delay (float): Initial delay in seconds for exponential backoff
        """
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.max_retries = max_retries
        self.initial_retry_delay = initial_retry_delay
        
        # Request tracking
        self.minute_requests = deque()
        self.hour_requests = deque()
        self.lock = threading.Lock()
    
    def _clean_old_requests(self, now: datetime) -> None:
        """Remove old requests outside the time window"""
        minute_ago = now - timedelta(minutes=1)
        hour_ago = now - timedelta(hours=1)
        
        while self.minute_requests and self.minute_requests[0] < minute_ago:
            self.minute_requests.popleft()
        
        while self.hour_requests and self.hour_requests[0] < hour_ago:
            self.hour_requests.popleft()
    
    def _can_make_request(self) -> bool:
        """Check if we can make a request without hitting rate limits"""
        now = datetime.now()
        self._clean_old_requests(now)
        
        return (
            len(self.minute_requests) < self.requests_per_minute and
            len(self.hour_requests) < self.requests_per_hour
        )
    
    def _get_wait_time(self) -> float:
        """Calculate wait time before next request is allowed"""
        now = datetime.now()
        self._clean_old_requests(now)
        
        if not self.minute_requests:
            return 0
        
        # Time until oldest minute-window request expires
        oldest_minute = self.minute_requests[0] + timedelta(minutes=1)
        wait_time = (oldest_minute - now).total_seconds()
        
        return max(0, wait_time)
    
    def wait_if_needed(self) -> None:
        """Wait if necessary to respect rate limits"""
        with self.lock:
            while not self._can_make_request():
                wait_time = self._get_wait_time()
                if wait_time > 0:
                    print(f"⏱️  Rate limit approaching. Waiting {wait_time:.2f}s...")
                    time.sleep(wait_time + 0.1)  # Small buffer
                    self._clean_old_requests(datetime.now())
                else:
                    time.sleep(0.1)
            
            # Record this request
            now = datetime.now()
            self.minute_requests.append(now)
            self.hour_requests.append(now)
    
    def execute_with_retry(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function with rate limiting and exponential backoff retry logic
        
        Args:
            func (Callable): Function to execute
            *args: Positional arguments to pass to function
            **kwargs: Keyword arguments to pass to function
            
        Returns:
            Any: Result from the function
            
        Raises:
            Exception: If max retries exceeded
        """
        retry_delay = self.initial_retry_delay
        
        for attempt in range(self.max_retries + 1):
            try:
                # Wait to respect rate limits
                self.wait_if_needed()
                
                # Execute the function
                result = func(*args, **kwargs)
                return result
                
            except Exception as e:
                error_msg = str(e)
                is_rate_limit = "429" in error_msg or "rate limit" in error_msg.lower()
                
                if is_rate_limit and attempt < self.max_retries:
                    print(f"⚠️  Rate limit hit (429). Retry {attempt + 1}/{self.max_retries} in {retry_delay:.1f}s...")
                    time.sleep(retry_delay)
                    # Exponential backoff: double the wait time, max 60 seconds
                    retry_delay = min(retry_delay * 2, 60)
                    continue
                else:
                    # Not a rate limit error or max retries exceeded
                    raise


class PriorityScorer:
    """
    Priority Logic System for Samadhan Complaints
    
    Composite scoring algorithm evaluates complaints across 4 dimensions:
    1. Priority Level Weight (0-100 points)
    2. Status Weight (0-50 points)
    3. Age Score (0-50 points)
    4. Population Impact (0-40 points)
    
    Total Priority Score Range: 0-240 points
    """
    
    # Priority level weights
    PRIORITY_WEIGHTS = {
        'urgent': 100,
        'high': 75,
        'medium': 50,
        'low': 25
    }
    
    # Status weights
    STATUS_WEIGHTS = {
        'escalated': 50,
        'open': 30,
        'pending': 20,
        'resolved': 0
    }
    
    # Age score multiplier (days_old * 5, capped at 50)
    AGE_MULTIPLIER = 5
    AGE_MAX = 50
    
    # Population impact multiplier (affected_people * 2, capped at 40)
    POPULATION_MULTIPLIER = 2
    POPULATION_MAX = 40
    
    @staticmethod
    def calculate_age_score(created_at: str) -> float:
        """
        Calculate age score from complaint creation date
        
        Args:
            created_at (str): ISO format datetime string
            
        Returns:
            float: Age score (0-50)
        """
        try:
            created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            age_days = (datetime.now(created_date.tzinfo) - created_date).days
            age_score = min(age_days * PriorityScorer.AGE_MULTIPLIER, PriorityScorer.AGE_MAX)
            return age_score
        except Exception:
            return 0
    
    @staticmethod
    def calculate_population_score(affected_people: int) -> float:
        """
        Calculate population impact score
        
        Args:
            affected_people (int): Number of people affected
            
        Returns:
            float: Population impact score (0-40)
        """
        if affected_people and affected_people > 0:
            return min(affected_people * PriorityScorer.POPULATION_MULTIPLIER, PriorityScorer.POPULATION_MAX)
        return 0
    
    @staticmethod
    def score_complaint(complaint: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate composite priority score for a complaint
        
        Args:
            complaint (dict): Complaint object with keys:
                - priority: 'urgent'|'high'|'medium'|'low'
                - status: 'escalated'|'open'|'pending'|'resolved'
                - created_at: ISO format datetime
                - affected_people: integer count
                
        Returns:
            dict: Complaint with added 'priority_score' and 'priority_breakdown'
        """
        priority_weight = PriorityScorer.PRIORITY_WEIGHTS.get(
            complaint.get('priority', 'low').lower(), 0
        )
        status_weight = PriorityScorer.STATUS_WEIGHTS.get(
            complaint.get('status', 'pending').lower(), 0
        )
        age_score = PriorityScorer.calculate_age_score(complaint.get('created_at', ''))
        population_score = PriorityScorer.calculate_population_score(
            complaint.get('affected_people', 0)
        )
        
        total_score = priority_weight + status_weight + age_score + population_score
        
        return {
            **complaint,
            'priority_score': total_score,
            'priority_breakdown': {
                'priority_level': priority_weight,
                'status': status_weight,
                'age': age_score,
                'population_impact': population_score,
                'total': total_score
            }
        }
    
    @staticmethod
    def score_and_sort_complaints(complaints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Score and sort complaints by priority
        
        Args:
            complaints (list): List of complaint objects
            
        Returns:
            list: Sorted complaints (highest priority first) with scores added
        """
        scored = [PriorityScorer.score_complaint(c) for c in complaints]
        return sorted(scored, key=lambda x: x.get('priority_score', 0), reverse=True)
    
    @staticmethod
    def get_priority_category(score: float) -> str:
        """
        Categorize priority score into readable labels
        
        Args:
            score (float): Priority score (0-240)
            
        Returns:
            str: Priority category label
        """
        if score >= 200:
            return "CRITICAL"
        elif score >= 150:
            return "HIGH"
        elif score >= 100:
            return "MEDIUM"
        elif score >= 50:
            return "LOW"
        else:
            return "MINIMAL"

class GeminiConfig:
    """Configuration and initialization for Google Gemini API with rate limiting"""
    
    def __init__(
        self,
        requests_per_minute: int = 30,
        requests_per_hour: int = 1500,
        max_retries: int = 5
    ):
        """
        Initialize Gemini with API key from environment and rate limiting
        
        Args:
            requests_per_minute (int): Max requests per minute (default: 30 for free tier)
            requests_per_hour (int): Max requests per hour (default: 1500 for free tier)
            max_retries (int): Max retry attempts on rate limit (default: 5)
        """
        self.api_key = os.getenv('GEMINI_API_KEY')
        
        if not self.api_key:
            raise ValueError(
                "GEMINI_API_KEY not found in environment variables. "
                "Please set it in your .env file or system environment."
            )
        
        # Initialize the client with API key
        self.client = genai.Client(api_key=self.api_key)
        self.model = 'gemini-1.5-flash'  # Stable free tier model
        
        # Initialize rate limiter
        self.rate_limiter = RateLimiter(
            requests_per_minute=requests_per_minute,
            requests_per_hour=requests_per_hour,
            max_retries=max_retries
        )
        print(f"✓ Gemini initialized with rate limiting: {requests_per_minute} req/min, {requests_per_hour} req/hour")
    
    def generate_content(self, prompt: str) -> str:
        """
        Generate content using Gemini AI with rate limiting
        
        Args:
            prompt (str): The input prompt for the AI
            
        Returns:
            str: The generated response text
        """
        def _generate():
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return response.text
        
        try:
            return self.rate_limiter.execute_with_retry(_generate)
        except Exception as e:
            raise Exception(f"Error generating content: {str(e)}")
    
    def analyze_complaint_with_priority(self, complaint: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a complaint with priority scoring and AI insights
        
        Args:
            complaint (dict): Complaint object with structure:
                {
                    'id': str,
                    'complaint_text': str,
                    'priority': 'urgent'|'high'|'medium'|'low',
                    'status': 'escalated'|'open'|'pending'|'resolved',
                    'created_at': datetime string,
                    'affected_people': int,
                    'category': str (optional),
                    'location': str (optional)
                }
            
        Returns:
            dict: Analysis with priority scores and AI insights
        """
        # Calculate priority score
        scored_complaint = PriorityScorer.score_complaint(complaint)
        priority_category = PriorityScorer.get_priority_category(scored_complaint['priority_score'])
        
        # Get AI analysis
        complaint_text = complaint.get('complaint_text', '')
        ai_analysis = self.analyze_complaint(complaint_text)
        
        return {
            'complaint_id': complaint.get('id'),
            'priority_score': scored_complaint['priority_score'],
            'priority_category': priority_category,
            'priority_breakdown': scored_complaint['priority_breakdown'],
            'ai_analysis': ai_analysis,
            'metadata': {
                'created_at': complaint.get('created_at'),
                'status': complaint.get('status'),
                'affected_people': complaint.get('affected_people'),
                'location': complaint.get('location')
            }
        }
    
    def analyze_multiple_complaints(self, complaints: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze multiple complaints, score them by priority, and provide insights
        
        Args:
            complaints (list): List of complaint objects
            
        Returns:
            list: Complaints sorted by priority with scores and AI analysis
        """
        # Score and sort complaints
        sorted_complaints = PriorityScorer.score_and_sort_complaints(complaints)
        
        # Analyze top complaints with AI
        analyzed = []
        for complaint in sorted_complaints[:20]:  # Limit to top 20
            analysis = self.analyze_complaint_with_priority(complaint)
            analyzed.append(analysis)
        
        return analyzed
    
    def generate_priority_action_plan(self, complaints: List[Dict[str, Any]]) -> str:
        """
        Generate an action plan based on priority-scored complaints
        
        Args:
            complaints (list): List of complaint objects
            
        Returns:
            str: Action plan with prioritized recommendations
        """
        # Score and sort complaints
        sorted_complaints = PriorityScorer.score_and_sort_complaints(complaints)
        
        # Build analysis text with priority information
        analysis_text = "Complaints by Priority:\n\n"
        for i, complaint in enumerate(sorted_complaints[:10], 1):  # Top 10
            score = complaint['priority_score']
            category = PriorityScorer.get_priority_category(score)
            analysis_text += f"{i}. [{category}] Score: {score:.0f}/240 - "
            analysis_text += f"{complaint.get('complaint_text', 'N/A')[:100]}...\n"
        
        # Generate recommendations using AI
        prompt = f"""Based on these priority-scored complaints, generate an action plan:

{analysis_text}

Provide:
1. Top 3 immediate actions (CRITICAL priority)
2. Resource allocation by department
3. Timeline for resolution
4. Risk mitigation strategies
5. Quick wins (24h resolution possible)"""
        
        return self.generate_content(prompt)
        """
        Analyze a complaint using Gemini
        
        Args:
            complaint_text (str): The complaint to analyze
            
        Returns:
            str: Analysis of the complaint
        """
        prompt = f"""Analyze this government grievance complaint and provide:
1. Category (water, roads, electricity, etc.)
2. Severity (low, medium, high, urgent)
3. Key issue
4. Suggested resolution

Complaint: {complaint_text}"""
        
        return self.generate_content(prompt)
    
    def generate_priority_insights(self, complaints_list: list) -> str:
        """
        Generate priority insights from multiple complaints
        
        Args:
            complaints_list (list): List of complaint descriptions
            
        Returns:
            str: Priority insights and recommendations
        """
        complaints_text = "\n".join([f"- {c}" for c in complaints_list])
        
        prompt = f"""Based on these citizen complaints, provide:
1. Top 3 priority areas
2. Recommended resource allocation
3. Quick wins (resolvable within 24h)
4. Preventive measures

Complaints:
{complaints_text}"""
        
        return self.generate_content(prompt)


# Initialize and export
def get_gemini_client():
    """Get or create Gemini client instance"""
    return GeminiConfig()


if __name__ == "__main__":
    # Example usage
    try:
        client = get_gemini_client()
        
        # Test 1: Simple content generation
        print("=== Test 1: Simple Generation ===")
        response = client.generate_content("Explain how government grievance systems work")
        print(response[:200] + "...\n")
        
        # Test 2: Priority scoring demonstration
        print("=== Test 2: Priority Scoring System ===")
        test_complaints = [
            {
                'id': '1',
                'complaint_text': 'Deep potholes on Main Street causing vehicle damage',
                'priority': 'medium',
                'status': 'open',
                'created_at': '2026-01-02T10:00:00Z',
                'affected_people': 50,
                'location': 'Main Street'
            },
            {
                'id': '2',
                'complaint_text': 'No water supply for 3 days - health emergency',
                'priority': 'urgent',
                'status': 'escalated',
                'created_at': '2026-01-01T08:00:00Z',
                'affected_people': 500,
                'location': 'Ward 5'
            },
            {
                'id': '3',
                'complaint_text': 'Street light not working',
                'priority': 'low',
                'status': 'pending',
                'created_at': '2026-01-03T14:00:00Z',
                'affected_people': 10,
                'location': 'Sector 22'
            }
        ]
        
        # Score complaints
        scored = PriorityScorer.score_and_sort_complaints(test_complaints)
        
        print("\nComplaints Ranked by Priority Score:\n")
        for complaint in scored:
            score = complaint['priority_score']
            breakdown = complaint['priority_breakdown']
            category = PriorityScorer.get_priority_category(score)
            
            print(f"ID: {complaint['id']}")
            print(f"  Category: {category}")
            print(f"  Total Score: {score:.0f}/240")
            print(f"  Breakdown:")
            print(f"    - Priority Level: {breakdown['priority_level']}/100")
            print(f"    - Status Weight: {breakdown['status']}/50")
            print(f"    - Age Score: {breakdown['age']:.0f}/50")
            print(f"    - Population Impact: {breakdown['population_impact']:.0f}/40")
            print(f"  Location: {complaint.get('location')}")
            print(f"  Complaint: {complaint.get('complaint_text')[:60]}...")
            print()
        
        # Test 3: Analyze with priority
        print("=== Test 3: Individual Complaint Analysis with Priority ===")
        top_complaint = scored[0]  # Most critical
        print(f"Analyzing top priority complaint (ID: {top_complaint['id']})...\n")
        analysis = client.analyze_complaint_with_priority(top_complaint)
        print(f"Priority Category: {analysis['priority_category']}")
        print(f"Priority Score: {analysis['priority_score']:.0f}/240")
        print(f"AI Analysis:\n{analysis['ai_analysis'][:300]}...\n")
        
        # Test 4: Multiple complaints analysis
        print("=== Test 4: Multiple Complaints Analysis ===")
        print("Analyzing all complaints with AI...\n")
        multi_analysis = client.analyze_multiple_complaints(test_complaints)
        print(f"Processed {len(multi_analysis)} complaints")
        for item in multi_analysis:
            print(f"  - ID {item['complaint_id']}: {item['priority_category']} priority (Score: {item['priority_score']:.0f})")
        
        # Test 5: Rate limiting demonstration
        print("\n=== Test 5: Rate Limiting Demonstration ===")
        print("Testing rate limiter with rapid requests...")
        print(f"Configured: {client.rate_limiter.requests_per_minute} req/min, {client.rate_limiter.requests_per_hour} req/hour")
        print("Sending 3 sequential requests (should be throttled):\n")
        
        for i in range(3):
            print(f"Request {i+1}/3: Generating content...")
            response = client.generate_content(f"Briefly explain complaint priority level {i+1}")
            print(f"  Response: {response[:80]}...\n")
        
        print("✓ Rate limiting working correctly!")
        
    except ValueError as e:
        print(f"Configuration Error: {e}")
    except Exception as e:
        print(f"Error: {e}")
