# Gemini API Setup Guide for Samadhan

## Prerequisites
- Python 3.8+
- Required packages installed: `google-genai`, `python-dotenv`

## Step 1: Get Your Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/)
2. Click "Get API Key" button
3. Create a new API key or use existing one
4. Copy the API key

## Step 2: Set Up Environment Variable

### Option A: Using `.env` file (Recommended for local development)

1. Create a `.env` file in the project root directory:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. Make sure `.env` is in `.gitignore` (already configured)

### Option B: System Environment Variable

**Windows (PowerShell):**
```powershell
$env:GEMINI_API_KEY = "your_actual_api_key_here"
```

**Windows (Command Prompt):**
```cmd
set GEMINI_API_KEY=your_actual_api_key_here
```

**Linux/Mac:**
```bash
export GEMINI_API_KEY="your_actual_api_key_here"
```

## Step 3: Using the Gemini Integration

### Basic Usage

```python
from gemini_config import get_gemini_client

# Initialize client
client = get_gemini_client()

# Generate content
response = client.generate_content("Explain how AI works")
print(response)
```

### Analyze Complaints

```python
from gemini_config import get_gemini_client

client = get_gemini_client()

complaint = "There are deep potholes on Main Street causing vehicle damage"
analysis = client.analyze_complaint(complaint)
print(analysis)
```

### Generate Priority Insights

```python
from gemini_config import get_gemini_client

client = get_gemini_client()

complaints = [
    "No water supply for 3 days in Ward 5",
    "Traffic light not working at Main intersection",
    "Garbage not collected for a week"
]

insights = client.generate_priority_insights(complaints)
print(insights)
```

## Step 4: Test the Integration

Run the test script:
```bash
python gemini_config.py
```

You should see output from three test cases demonstrating:
1. Simple content generation
2. Complaint analysis
3. Priority insights generation

## Security Notes

⚠️ **Important:**
- Never commit your `.env` file to version control
- The `.env` file should be in `.gitignore` by default
- Treat your API key like a password
- Rotate API keys regularly if compromised

## Troubleshooting

### "GEMINI_API_KEY not found"
- Ensure `.env` file is in the project root
- Verify the key name is exactly `GEMINI_API_KEY`
- Restart your terminal/IDE after setting environment variables

### Rate Limiting
- Gemini API has usage limits on free tier
- Check your [API dashboard](https://ai.google.dev/dashboard) for quota info
- Consider implementing request queuing for high-volume use

### API Errors
- Verify your API key is valid and active
- Check internet connection
- Refer to [Gemini API documentation](https://ai.google.dev/docs)

## Available Methods

### `generate_content(prompt: str) -> str`
Generate any content based on a text prompt.

### `analyze_complaint(complaint_text: str) -> str`
Analyze a government complaint and categorize it with severity and suggestions.

### `generate_priority_insights(complaints_list: list) -> str`
Generate priority recommendations from multiple complaints.

## Integration with Samadhan

To integrate with the Samadhan system:

1. **Backend Analysis**: Use `analyze_complaint()` for real-time complaint classification
2. **Predictive Insights**: Use `generate_priority_insights()` to supplement the predict-issues Supabase function
3. **Complaint Enhancement**: Use `generate_content()` for drafting response templates

## References

- [Google Gemini Documentation](https://ai.google.dev/docs)
- [API Reference](https://ai.google.dev/api/python)
- [Pricing Information](https://ai.google.dev/pricing)
