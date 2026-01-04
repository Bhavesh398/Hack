import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface LocationHeatmapProps {
  complaints: Array<{ location: string | null; priority: string }>;
}

export function LocationHeatmap({ complaints }: LocationHeatmapProps) {
  // Group by location and calculate priority scores
  const locationData = complaints.reduce((acc, c) => {
    const loc = c.location || "Unknown";
    if (!acc[loc]) {
      acc[loc] = { count: 0, critical: 0, high: 0, medium: 0, low: 0 };
    }
    acc[loc].count++;
    if (c.priority === "critical") acc[loc].critical++;
    if (c.priority === "high") acc[loc].high++;
    if (c.priority === "medium") acc[loc].medium++;
    if (c.priority === "low") acc[loc].low++;
    return acc;
  }, {} as Record<string, { count: number; critical: number; high: number; medium: number; low: number }>);

  const data = Object.entries(locationData)
    .map(([location, stats]) => {
      // Calculate heat score (weighted by priority)
      const heatScore = stats.critical * 10 + stats.high * 5 + stats.medium * 2 + stats.low;
      return {
        location: location.length > 20 ? location.substring(0, 18) + "..." : location,
        fullLocation: location,
        complaints: stats.count,
        heatScore,
        critical: stats.critical,
        high: stats.high,
      };
    })
    .sort((a, b) => b.heatScore - a.heatScore)
    .slice(0, 8);

  const getColor = (heatScore: number) => {
    if (heatScore >= 20) return "#dc2626"; // critical
    if (heatScore >= 10) return "#ea580c"; // high
    if (heatScore >= 5) return "#f59e0b"; // medium
    return "#22c55e"; // low
  };

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-accent" />
          Location Hotspots
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Areas requiring immediate attention (by priority)
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
            <YAxis
              type="category"
              dataKey="location"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "11px" }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value, name, props) => {
                if (name === "complaints") {
                  return [
                    `${value} complaints (${props.payload.critical} critical, ${props.payload.high} high)`,
                    props.payload.fullLocation,
                  ];
                }
                return [value, name];
              }}
            />
            <Bar dataKey="complaints" radius={[0, 8, 8, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.heatScore)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
