import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { DbComplaint } from "@/hooks/useComplaints";
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  Zap,
  RefreshCw,
  Loader2,
  ThermometerSun,
  Droplets,
  Activity
} from "lucide-react";

interface Predictions {
  hotspots: Array<{
    location: string;
    issue: string;
    riskScore: number;
    prediction: string;
    recommendedAction: string;
    estimatedImpact?: number;
    timeToResolve?: string;
  }>;
  trends: Array<{
    category: string;
    direction: "rising" | "falling" | "stable";
    percentChange: number;
    reason: string;
    priority?: string;
  }>;
  slaRisks: Array<{
    category: string;
    count: number;
    urgency: "immediate" | "within_24h" | "within_week";
    recommendedResolution?: string;
  }>;
  seasonalAlert: {
    active: boolean;
    type: string;
    affectedCategories: string[];
    recommendation: string;
    priority?: string;
    timeline?: string;
  };
  resourceRecommendation: Array<{
    department: string;
    priority?: string;
    reason: string;
    estimatedCost?: number;
    suggestedAction: string;
  }> | {
    department: string;
    reason: string;
    suggestedAction: string;
  };
  citizenSentiment: {
    overall: "positive" | "neutral" | "negative" | "critical";
    trend: "improving" | "declining" | "stable";
    topConcern: string;
    priority?: string;
  };
}

interface AdvancedPredictionsProps {
  complaints: DbComplaint[];
}

export function AdvancedPredictions({ complaints }: AdvancedPredictionsProps) {
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching predictions with', complaints.length, 'complaints');
      
      const { data, error: invokeError } = await supabase.functions.invoke('predict-issues', {
        body: { 
          complaints: complaints.slice(0, 50), // Limit to 50 most recent
          timeRange: 'last 7 days' 
        }
      });

      if (invokeError) {
        console.error('Supabase function error:', invokeError);
        throw invokeError;
      }
      
      if (data) {
        console.log('Predictions received:', data);
        setPredictions(data);
      }
    } catch (err) {
      console.error('Prediction error:', err);
      setError('Failed to generate predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (complaints.length > 0) {
      fetchPredictions();
    }
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500 bg-green-500/10';
      case 'neutral': return 'text-blue-500 bg-blue-500/10';
      case 'negative': return 'text-orange-500 bg-orange-500/10';
      case 'critical': return 'text-red-500 bg-red-500/10';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-500/20 text-red-600 border-red-500/30';
      case 'within_24h': return 'bg-orange-500/20 text-orange-600 border-orange-500/30';
      case 'within_week': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (complaints.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Need more data for AI predictions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="w-6 h-6 text-accent" />
            AI-Powered Predictions
          </h2>
          <p className="text-muted-foreground mt-1">
            Proactive governance insights powered by machine learning
          </p>
        </div>
        <Button variant="outline" onClick={fetchPredictions} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh Predictions
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-accent" />
            <p className="text-muted-foreground">AI is analyzing patterns...</p>
          </div>
        </div>
      )}

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-4 text-center text-red-600">
            {error}
          </CardContent>
        </Card>
      )}

      {predictions && !loading && (
        <>
          {/* Hotspots */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-red-500" />
                Emerging Hotspots
                <Badge variant="outline" className="ml-2 bg-red-500/10 text-red-600 border-red-500/30">
                  Requires Attention
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {predictions.hotspots.map((hotspot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl border border-border/50 bg-gradient-to-r from-red-500/5 to-transparent"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{hotspot.location}</h4>
                      <p className="text-sm text-muted-foreground">{hotspot.issue}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-500">{hotspot.riskScore}</p>
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                    </div>
                  </div>
                  <Progress value={hotspot.riskScore} className="h-2 mb-3 [&>div]:bg-red-500" />
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Prediction</p>
                      <p className="text-foreground">{hotspot.prediction}</p>
                    </div>
                    <div className="p-2 rounded bg-green-500/10">
                      <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Recommended Action</p>
                      <p className="text-foreground">{hotspot.recommendedAction}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Trends & Sentiment Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Trends */}
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-accent" />
                  Complaint Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictions.trends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      {trend.direction === 'rising' ? (
                        <TrendingUp className="w-5 h-5 text-red-500" />
                      ) : trend.direction === 'falling' ? (
                        <TrendingDown className="w-5 h-5 text-green-500" />
                      ) : (
                        <Activity className="w-5 h-5 text-blue-500" />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{trend.category}</p>
                        <p className="text-xs text-muted-foreground">{trend.reason}</p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={trend.direction === 'rising' 
                        ? 'bg-red-500/10 text-red-600 border-red-500/30' 
                        : trend.direction === 'falling'
                        ? 'bg-green-500/10 text-green-600 border-green-500/30'
                        : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                      }
                    >
                      {trend.direction === 'rising' ? '+' : trend.direction === 'falling' ? '-' : ''}{trend.percentChange}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Citizen Sentiment */}
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-accent" />
                  Citizen Sentiment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${getSentimentColor(predictions.citizenSentiment.overall)}`}>
                    <span className="text-3xl font-bold capitalize">{predictions.citizenSentiment.overall}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Trend: <span className="font-medium">{predictions.citizenSentiment.trend}</span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Top Concern</p>
                  <p className="font-medium text-foreground">{predictions.citizenSentiment.topConcern}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SLA Risks & Seasonal Alert */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* SLA Risks */}
            <Card className="border-border/50 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  SLA Violation Risks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictions.slaRisks.map((risk, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                    <div>
                      <p className="font-medium text-foreground">{risk.category}</p>
                      <p className="text-sm text-muted-foreground">{risk.count} complaints at risk</p>
                    </div>
                    <Badge variant="outline" className={getUrgencyColor(risk.urgency)}>
                      {risk.urgency.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Seasonal Alert */}
            {predictions.seasonalAlert.active && (
              <Card className="border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ThermometerSun className="w-5 h-5 text-yellow-600" />
                    Seasonal Alert: {predictions.seasonalAlert.type}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Affected Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {predictions.seasonalAlert.affectedCategories.map((cat) => (
                          <Badge key={cat} variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/30">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-600 uppercase tracking-wide mb-1">Recommended Preventive Action</p>
                      <p className="text-foreground font-medium">{predictions.seasonalAlert.recommendation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resource Recommendation */}
          <Card className="border-accent/30 bg-gradient-to-r from-accent/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-accent/20">
                  <Zap className="w-8 h-8 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground mb-1">Resource Recommendations</h3>
                  {Array.isArray(predictions.resourceRecommendation) ? (
                    <div className="space-y-3">
                      {predictions.resourceRecommendation.map((rec, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-card border border-border/50">
                          <div className="text-muted-foreground mb-2 flex items-center gap-2">
                            <span className="font-semibold text-accent">{rec.department}</span>
                            {rec.priority && (
                              <Badge variant={
                                rec.priority === 'urgent' ? 'destructive' : 
                                rec.priority === 'high' ? 'default' : 
                                'secondary'
                              }>
                                {rec.priority}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{rec.reason}</p>
                          <p className="text-sm font-medium text-foreground">{rec.suggestedAction}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-3">
                        <span className="font-semibold text-accent">{predictions.resourceRecommendation.department}</span> - {predictions.resourceRecommendation.reason}
                      </p>
                      <div className="p-3 rounded-lg bg-card border border-border/50">
                        <p className="text-sm font-medium text-foreground">{predictions.resourceRecommendation.suggestedAction}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
