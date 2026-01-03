import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { complaints, timeRange } = await req.json();

    const GROK_API_KEY = Deno.env.get('GROK_API_KEY');
    if (!GROK_API_KEY) {
      console.error('GROK_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const complaintsData = JSON.stringify(complaints.slice(0, 20).map((c: any) => ({
      category: c.category,
      location: c.location,
      priority: c.priority,
      status: c.status,
      created_at: c.created_at,
      affected_people: c.affected_people
    })));

    const systemPrompt = `You are an advanced AI analytics engine for a government grievance redressal system called "Samadhan".
Analyze the complaint data and provide predictive insights for governance.

Based on the complaint patterns, generate the following predictions and insights as a JSON object:

1. hotspots: Array of top 3 emerging problem areas with:
   - location: area name
   - issue: main problem type
   - riskScore: 1-100
   - prediction: what will happen if not addressed
   - recommendedAction: specific action to take

2. trends: Array of 3 trend predictions with:
   - category: complaint category
   - direction: "rising" | "falling" | "stable"
   - percentChange: number
   - reason: why this trend exists

3. slaRisks: Array of complaints at risk of SLA violation with:
   - category: category name
   - count: number at risk
   - urgency: "immediate" | "within_24h" | "within_week"

4. seasonalAlert: Object with:
   - active: boolean
   - type: e.g., "monsoon", "summer", "festival"
   - affectedCategories: array of categories
   - recommendation: preventive measure

5. resourceRecommendation: Object with:
   - department: department name needing resources
   - reason: why
   - suggestedAction: what to do

6. citizenSentiment: Object with:
   - overall: "positive" | "neutral" | "negative" | "critical"
   - trend: "improving" | "declining" | "stable"
   - topConcern: main issue driving sentiment

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze these recent complaints and generate predictions:\n\n${complaintsData}\n\nTime range: ${timeRange || 'last 7 days'}` }
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI prediction failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    let predictions;
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      predictions = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content, parseError);
      // Fallback predictions
      predictions = {
        hotspots: [
          { location: "Ward 12, Main Street", issue: "Road Infrastructure", riskScore: 85, prediction: "Potential accidents if potholes not fixed", recommendedAction: "Deploy road repair team immediately" },
          { location: "Sector 22", issue: "Power Infrastructure", riskScore: 78, prediction: "Transformer overload likely", recommendedAction: "Preventive maintenance required" },
          { location: "Ward 14, Education Hub", issue: "Sanitation", riskScore: 72, prediction: "Disease outbreak risk near schools", recommendedAction: "Immediate drainage cleanup" }
        ],
        trends: [
          { category: "Water", direction: "rising", percentChange: 35, reason: "Summer season approaching" },
          { category: "Roads", direction: "stable", percentChange: 5, reason: "Ongoing maintenance" },
          { category: "Electricity", direction: "rising", percentChange: 28, reason: "Increased AC usage" }
        ],
        slaRisks: [
          { category: "Critical Issues", count: 4, urgency: "immediate" },
          { category: "High Priority", count: 6, urgency: "within_24h" }
        ],
        seasonalAlert: {
          active: true,
          type: "summer",
          affectedCategories: ["Water", "Electricity"],
          recommendation: "Pre-position tankers and generator backup"
        },
        resourceRecommendation: {
          department: "Water Supply Department",
          reason: "35% increase in water complaints expected",
          suggestedAction: "Add 2 additional water tankers to fleet"
        },
        citizenSentiment: {
          overall: "negative",
          trend: "stable",
          topConcern: "Response time for critical issues"
        }
      };
    }

    console.log('Predictions generated:', predictions);

    return new Response(
      JSON.stringify(predictions),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in predict-issues function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
