# Priority Scoring System - Samadhan Gemini Integration

## Overview

The Samadhan priority scoring system is a composite algorithm that evaluates government grievance complaints across 4 key dimensions. This ensures fair, data-driven prioritization of complaints based on urgency, impact, and governance responsibility.

## Scoring Dimensions

### 1. Priority Level Weight (0-100 points)

Reflects the initial severity classification at complaint intake:

| Level | Points | Description |
|-------|--------|-------------|
| **urgent** | 100 | Life/safety threat, immediate action needed |
| **high** | 75 | Significant impact on community/services |
| **medium** | 50 | Moderate issue affecting service quality |
| **low** | 25 | Minor issues, cosmetic problems |

### 2. Status Weight (0-50 points)

Shows current handling state and escalation level:

| Status | Points | Description |
|--------|--------|-------------|
| **escalated** | 50 | Already flagged as critical, needs immediate intervention |
| **open** | 30 | Active, awaiting assignment or first response |
| **pending** | 20 | Awaiting information, approval, or next step |
| **resolved** | 0 | Already handled, no additional priority |

### 3. Age Score (0-50 points)

Prevents long-standing issues from being forgotten:

- **Formula**: `days_old × 5` (capped at 50)
- **Example**: 
  - 1 day old = 5 points
  - 5 days old = 25 points
  - 10+ days old = 50 points (max)
- **Why**: Older unresolved complaints indicate systemic failures

### 4. Population Impact (0-40 points)

Weights complaints by number of affected citizens:

- **Formula**: `affected_people × 2` (capped at 40)
- **Example**:
  - 1 person affected = 2 points
  - 10 people affected = 20 points
  - 20+ people affected = 40 points (max)
- **Why**: Governance responsibility scales with impact

## Total Score Range

**0-240 points** with the following categorization:

| Score Range | Category | Action |
|-------------|----------|--------|
| 200-240 | **CRITICAL** | Immediate intervention required |
| 150-199 | **HIGH** | Fast-track resolution within 24h |
| 100-149 | **MEDIUM** | Standard resolution within 48-72h |
| 50-99 | **LOW** | Routine handling, 1-2 weeks |
| 0-49 | **MINIMAL** | Low priority, preventive action |

## Real-World Examples

### Example 1: Critical Priority
```
Urgent water shortage during drought season affecting entire ward

Priority Level:     100  (urgent)
Status:              50  (escalated)
Age:                 25  (5 days old)
Population Impact:   40  (500 people affected)
─────────────────────────
Total Score:        215/240  ⚠️ CRITICAL
```

**Action**: Immediate response - deploy water tankers, notify disaster management

### Example 2: High Priority
```
Multiple potholes causing accidents on main road

Priority Level:      75  (high)
Status:              30  (open)
Age:                 35  (7 days old)
Population Impact:   30  (150 people affected daily)
─────────────────────────
Total Score:        170/240  🔴 HIGH
```

**Action**: Fast-track to engineering department, expected resolution 24h

### Example 3: Low Priority
```
Single street light not working in residential area

Priority Level:      25  (low)
Status:              20  (pending)
Age:                  5  (1 day old)
Population Impact:    8  (4 people affected)
─────────────────────────
Total Score:         58/240  🟡 LOW
```

**Action**: Routine maintenance scheduling, resolution within 1-2 weeks

## Implementation in Code

### Using the Priority Scorer

```python
from gemini_config import PriorityScorer

# Single complaint
complaint = {
    'priority': 'urgent',
    'status': 'escalated',
    'created_at': '2026-01-01T08:00:00Z',
    'affected_people': 500
}

scored = PriorityScorer.score_complaint(complaint)
print(f"Score: {scored['priority_score']}")
print(f"Category: {PriorityScorer.get_priority_category(scored['priority_score'])}")

# Multiple complaints - sorted by priority
complaints = [complaint1, complaint2, complaint3]
sorted_complaints = PriorityScorer.score_and_sort_complaints(complaints)
# Returns complaints sorted highest priority first
```

### Using with Gemini Analysis

```python
from gemini_config import get_gemini_client

client = get_gemini_client()

# Analyze single complaint with priority
complaint = {
    'id': '123',
    'complaint_text': 'No water supply for 3 days',
    'priority': 'urgent',
    'status': 'escalated',
    'created_at': '2026-01-01T08:00:00Z',
    'affected_people': 500,
    'location': 'Ward 5'
}

analysis = client.analyze_complaint_with_priority(complaint)
print(f"Priority: {analysis['priority_category']}")
print(f"Score: {analysis['priority_score']}")
print(f"AI Insights: {analysis['ai_analysis']}")

# Analyze multiple complaints
complaints = [...]
results = client.analyze_multiple_complaints(complaints)
# Returns complaints ranked by priority with AI analysis

# Generate action plan based on priorities
action_plan = client.generate_priority_action_plan(complaints)
```

## Key Features

✅ **Fair & Transparent**: Clear scoring methodology anyone can understand
✅ **Data-Driven**: Removes bias from manual prioritization
✅ **Dynamic**: Older complaints automatically increase in priority
✅ **Scalable**: Works for small teams to large government systems
✅ **Balanced**: Considers individual and collective impact
✅ **Actionable**: Directly maps to resource allocation

## Integration Points

### 1. Complaint Filing System
When a complaint is created, automatically calculate priority score for dashboard visibility

### 2. Queue Management
Use scores to build dispatch queues for field teams and departments

### 3. SLA Tracking
Monitor complaints at risk of SLA violation by score thresholds

### 4. Resource Planning
Allocate resources proportionally to priority score distribution

### 5. Reporting & Analytics
Generate performance reports filtered by priority levels

## Customization

To adjust the scoring weights for your governance model:

```python
# Modify weights in PriorityScorer class
PriorityScorer.PRIORITY_WEIGHTS = {
    'urgent': 120,    # Increase urgency weight
    'high': 80,
    'medium': 50,
    'low': 20
}

# Adjust multipliers for your context
PriorityScorer.AGE_MULTIPLIER = 4  # Slower age escalation
PriorityScorer.POPULATION_MULTIPLIER = 3  # Higher population weight
```

## Performance Considerations

- **Score Calculation**: O(1) - instant per complaint
- **Sorting**: O(n log n) - for n complaints
- **Batch Processing**: Can handle 1000+ complaints in milliseconds
- **Database**: Store `priority_score` as indexed column for fast queries

## Best Practices

1. **Review Quarterly**: Ensure weights match governance priorities
2. **Monitor Distribution**: If all complaints are CRITICAL, recalibrate
3. **Combine with AI**: Use Gemini analysis for qualitative insights
4. **Transparent Communication**: Show citizens how their complaint is prioritized
5. **Escalation Protocol**: Define clear actions for each priority category
6. **Training**: Ensure staff understand priority system logic

## References

- [Samadhan Priority Logic](../predict-issues/index.ts) - TypeScript implementation
- [Gemini Integration](./gemini_config.py) - Python implementation
- [API Documentation](./GEMINI_SETUP.md) - Setup and usage guide
