# Rate Limiting Guide - Gemini API Integration

## Overview

The Samadhan Gemini integration includes built-in rate limiting to prevent **429 (Too Many Requests)** errors from the Google Gemini API. The system automatically manages request throttling and retries with exponential backoff.

## Rate Limiting Strategy

### Three-Layer Defense

1. **Token Bucket Algorithm**: Tracks requests per minute and per hour
2. **Exponential Backoff**: Automatically retries with increasing delays on rate limit hits
3. **Request Queuing**: Waits intelligently before making requests to stay under limits

### Default Limits (Free Tier)

| Limit | Value | Notes |
|-------|-------|-------|
| **Per Minute** | 30 | Prevents burst overload |
| **Per Hour** | 1,500 | Fair usage policy |
| **Max Retries** | 5 | Gives up after 5 attempts |
| **Initial Retry Delay** | 1.0s | Doubles on each retry (max 60s) |

## How It Works

### Example Flow

```
User sends request
         ↓
Rate limiter checks limits
         ↓
✓ Within limits?
    ├─ YES: Execute immediately
    └─ NO: Wait until slot available
         ↓
Send request to Gemini API
         ↓
Got 429 error?
    ├─ NO: Return result
    └─ YES: Wait (1s, 2s, 4s, 8s, etc.)
         ↓
Retry up to 5 times
         ↓
Success: Return result
Failed: Raise exception
```

## Configuration

### Default Configuration

```python
from gemini_config import get_gemini_client

# Uses default limits: 30/min, 1500/hour
client = get_gemini_client()
```

### Custom Configuration

```python
from gemini_config import GeminiConfig

# For higher quota tier
client = GeminiConfig(
    requests_per_minute=60,      # Tier 2: 60 req/min
    requests_per_hour=3000,      # Tier 2: 3000 req/hour
    max_retries=5                # Standard retries
)

# For development/testing (loose limits)
client = GeminiConfig(
    requests_per_minute=100,
    requests_per_hour=5000,
    max_retries=3
)
```

### Environment Configuration

Store in `.env`:
```env
GEMINI_API_KEY=your_key_here
GEMINI_RATE_LIMIT_PER_MINUTE=30
GEMINI_RATE_LIMIT_PER_HOUR=1500
```

## Usage Examples

### Simple Request (Auto-Throttled)

```python
from gemini_config import get_gemini_client

client = get_gemini_client()

# This request is automatically rate limited
response = client.generate_content("Explain something")
print(response)
```

### Multiple Requests (Queue-Aware)

```python
# These requests are automatically queued and throttled
for i in range(100):
    response = client.generate_content(f"Question {i}")
    print(response)
```

The rate limiter will:
- Send first 30 requests immediately (per-minute limit)
- Queue remaining requests
- Send them as rate limit slots become available
- Show progress: `⏱️  Rate limit approaching. Waiting 2.34s...`

### Batch Analysis (Built-In Rate Limiting)

```python
complaints = [...]  # 100 complaints

# Automatically respects rate limits
results = client.analyze_multiple_complaints(complaints)
# Processes complaints in rate-limited batches
```

### With Error Handling

```python
try:
    response = client.generate_content("Request")
except Exception as e:
    if "429" in str(e):
        print("Rate limit exceeded after all retries")
    else:
        print(f"Error: {e}")
```

## Rate Limit Tiers

### Free Tier (Default)

- **30 requests/minute**
- **1,500 requests/hour**
- Best for: Low-volume applications, testing
- Use case: Samadhan demo, small deployment

### Paid Tier 1

- **60 requests/minute**
- **3,000 requests/hour**

```python
client = GeminiConfig(
    requests_per_minute=60,
    requests_per_hour=3000
)
```

### Paid Tier 2+

- **100+ requests/minute**
- **5,000+ requests/hour**

```python
client = GeminiConfig(
    requests_per_minute=100,
    requests_per_hour=5000
)
```

## Exponential Backoff

When a 429 error occurs:

| Attempt | Delay | Cumulative Wait |
|---------|-------|-----------------|
| 1 | 1 sec | 1 sec |
| 2 | 2 sec | 3 sec |
| 3 | 4 sec | 7 sec |
| 4 | 8 sec | 15 sec |
| 5 | 16 sec | 31 sec |

**Max single retry**: 60 seconds (prevents runaway delays)

## Monitoring

### Check Rate Limiter Status

```python
client = get_gemini_client()

# View current request tracking
limiter = client.rate_limiter

print(f"Requests this minute: {len(limiter.minute_requests)}/{limiter.requests_per_minute}")
print(f"Requests this hour: {len(limiter.hour_requests)}/{limiter.requests_per_hour}")

# Get wait time if limited
wait = limiter._get_wait_time()
if wait > 0:
    print(f"Next request available in: {wait:.2f}s")
```

### Log Rate Limit Events

```python
import logging

logging.basicConfig(level=logging.INFO)

# Rate limiter prints to stdout:
# ⏱️  Rate limit approaching. Waiting 2.34s...
# ⚠️  Rate limit hit (429). Retry 1/5 in 1.0s...
```

## Best Practices

### 1. Batch Processing

Instead of individual requests:
```python
# ❌ BAD: 100 individual requests
for complaint in complaints:
    analyze(complaint)

# ✓ GOOD: Batch processing
results = analyze_multiple_complaints(complaints)
```

### 2. Cache Results

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def get_complaint_analysis(complaint_id):
    return client.generate_content(f"Analyze {complaint_id}")
```

### 3. Off-Peak Processing

```python
import schedule

# Schedule heavy processing during off-peak hours
schedule.every().day.at("02:00").do(batch_analysis)

# This won't stress rate limits
```

### 4. Progressive Retries

```python
# Set higher retries for critical operations
for attempt in range(3):
    try:
        client = GeminiConfig(max_retries=10)  # More patient
        return client.generate_content(critical_prompt)
    except Exception as e:
        if attempt < 2:
            time.sleep(5)
        else:
            raise
```

### 5. Monitor Quota Usage

```python
# Track daily usage
daily_requests = 0

def track_request(response):
    global daily_requests
    daily_requests += 1
    if daily_requests % 100 == 0:
        print(f"Daily usage: {daily_requests}/1500")
    if daily_requests > 1400:
        print("⚠️  Approaching daily limit!")
```

## Troubleshooting

### Still Getting 429 Errors?

1. **Check your tier limits**
   ```python
   print(f"Configured: {client.rate_limiter.requests_per_minute} req/min")
   ```

2. **Lower the limits conservatively**
   ```python
   client = GeminiConfig(
       requests_per_minute=20,  # Lower than actual limit
       requests_per_hour=1000
   )
   ```

3. **Increase retry attempts**
   ```python
   client = GeminiConfig(max_retries=10)
   ```

4. **Check API quota**
   - Visit [Google AI Studio Dashboard](https://ai.google.dev/dashboard)
   - Verify API key is active
   - Check for any account restrictions

### Rate Limiter Seems Slow

- **Normal behavior**: Waiting is expected as limits are approached
- **Optimization**: Use batch methods instead of individual requests
- **Alternative**: Upgrade to higher tier for higher limits

### Memory Usage Growing

- Rate limiter automatically cleans old requests
- If issue persists: 
  ```python
  # Reset rate limiter
  client.rate_limiter.minute_requests.clear()
  client.rate_limiter.hour_requests.clear()
  ```

## Performance Metrics

### Single Request

- **Without rate limiting**: 0.5-2s (API call time)
- **With rate limiting**: 0.5-2s (if within limits) or + wait time

### 100 Batch Requests

- **Free tier (30/min)**: ~3-4 minutes total
- **Paid tier (60/min)**: ~1.5-2 minutes total
- **Paid tier (100/min)**: ~1 minute total

## Integration with Samadhan

### Dashboard Updates

```python
# Fetch and analyze top priority complaints
top_complaints = get_top_priority_complaints(limit=50)

# Auto-throttled processing
analyses = client.analyze_multiple_complaints(top_complaints)

# Update dashboard (no 429 errors!)
for analysis in analyses:
    update_complaint_dashboard(analysis)
```

### Scheduled Tasks

```python
# Background processing without impacting interactive requests
def scheduled_analysis():
    client = GeminiConfig(
        requests_per_minute=10,  # Conservative for background
        requests_per_hour=500
    )
    # Process backlog of complaints
    return client.generate_priority_action_plan(backlog)

# Schedule for off-peak hours
schedule.every().day.at("23:00").do(scheduled_analysis)
```

## References

- [Google Gemini API Rate Limits](https://ai.google.dev/docs/rate_limiting)
- [API Quota Dashboard](https://ai.google.dev/dashboard)
- [Rate Limiter Source Code](./gemini_config.py#L21-L140)
