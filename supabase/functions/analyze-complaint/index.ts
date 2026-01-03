import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEPARTMENT_MAPPING: Record<string, string> = {
  'Sanitation': 'Municipal Corporation',
  'Roads': 'Public Works Department',
  'Water': 'Water Supply Department',
  'Electricity': 'Electricity Board',
  'Safety': 'Police Department',
  'Healthcare': 'Health Department',
  'Education': 'Education Department',
  'Transport': 'Transport Department',
};

const SLA_MAPPING: Record<string, number> = {
  'critical': 4,
  'high': 12,
  'medium': 24,
  'low': 48,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, location, affectedPeople } = await req.json();
    
    if (!description) {
      return new Response(
        JSON.stringify({ error: 'Description is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GROK_API_KEY = Deno.env.get('GROK_API_KEY');
    if (!GROK_API_KEY) {
      console.error('GROK_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an AI assistant for a government grievance redressal system called "Samadhan". 
Your task is to analyze citizen complaints and extract structured information.

Analyze the complaint and return a JSON object with these fields:
- category: One of [Sanitation, Roads, Water, Electricity, Safety, Healthcare, Education, Transport]
- subCategory: A specific sub-category (e.g., "Garbage Collection", "Pothole", "Water Leakage")
- sentiment: A score from -1 (very negative/distressed) to 1 (neutral/positive)
- urgencyKeywords: Array of urgency-related words found (e.g., ["emergency", "dangerous", "immediate"])
- priority: One of [critical, high, medium, low] based on:
  - critical: Life-threatening, safety emergencies, health hazards affecting many
  - high: Significant disruption, health risks, urgent infrastructure failures
  - medium: Standard service issues, moderate inconvenience
  - low: Minor issues, suggestions, general feedback
- priorityScore: A number 0-100 representing urgency
- impactPrediction: A brief description of what could happen if not resolved within SLA

Consider these factors for priority:
1. Life/safety risk
2. Number of people affected (provided as: ${affectedPeople || 1})
3. Urgency keywords in the text
4. Sentiment (distress/anger indicates urgency)
5. Category risk level (Safety > Healthcare > Electricity > Water > Others)
6. Time-sensitivity mentioned

Location context: ${location || 'Not specified'}

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
          { role: 'user', content: `Analyze this citizen complaint:\n\n"${description}"` }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response:', aiResponse);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from AI response
    let analysis;
    try {
      // Clean up any markdown formatting
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content, parseError);
      // Fallback to basic analysis
      analysis = {
        category: 'Sanitation',
        subCategory: 'General Complaint',
        sentiment: 0,
        urgencyKeywords: [],
        priority: 'medium',
        priorityScore: 50,
        impactPrediction: 'Delayed resolution may cause inconvenience to citizens.',
      };
    }

    // Enrich with department and SLA
    const department = DEPARTMENT_MAPPING[analysis.category] || 'Municipal Corporation';
    const slaHours = SLA_MAPPING[analysis.priority] || 24;

    const result = {
      ...analysis,
      department,
      slaHours,
      analyzedAt: new Date().toISOString(),
    };

    console.log('Analysis complete:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-complaint function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
