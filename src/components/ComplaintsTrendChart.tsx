import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { format, subDays } from "date-fns";

interface ComplaintsTrendChartProps {
  complaints: Array<{ created_at: string; status: string }>;
}

export function ComplaintsTrendChart({ complaints }: ComplaintsTrendChartProps) {
  // Generate data for last 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, "MMM dd"),
      fullDate: format(date, "yyyy-MM-dd"),
    };
  });

  const data = days.map(({ date, fullDate }) => {
    const dayComplaints = complaints.filter((c) => {
      const complaintDate = format(new Date(c.created_at), "yyyy-MM-dd");
      return complaintDate === fullDate;
    });

    return {
      date,
      total: dayComplaints.length,
      resolved: dayComplaints.filter((c) => c.status === "resolved").length,
      pending: dayComplaints.filter((c) => c.status !== "resolved").length,
    };
  });

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          7-Day Complaint Trend
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track complaint volume and resolution over time
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: "12px" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Total"
              dot={{ fill: "hsl(var(--primary))" }}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke="#22c55e"
              strokeWidth={2}
              name="Resolved"
              dot={{ fill: "#22c55e" }}
            />
            <Line
              type="monotone"
              dataKey="pending"
              stroke="#f59e0b"
              strokeWidth={2}
              name="Pending"
              dot={{ fill: "#f59e0b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
