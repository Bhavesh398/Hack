import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ComplaintForm } from "@/components/ComplaintForm";
import { Logo } from "@/components/Logo";
import { ArrowLeft, Search, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function FileComplaintPage() {
  const [trackingId, setTrackingId] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <Logo size="sm" showText={true} className="text-foreground" />
          </Link>
          
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              File Your Grievance
            </h1>
            <p className="text-muted-foreground">
              Describe your issue and our AI will ensure it reaches the right authority with the right priority.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ComplaintForm />
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Track Complaint */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="border-border/50 shadow-lg bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                      <Search className="w-4 h-4 text-accent" />
                      Track Your Complaint
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input 
                      placeholder="Enter Complaint ID (e.g., SMD-...)"
                      value={trackingId}
                      onChange={(e) => setTrackingId(e.target.value)}
                      className="border-border/50 bg-background text-foreground placeholder:text-muted-foreground"
                    />
                    <Link to="/dashboard">
                      <Button variant="outline" size="sm" className="w-full">
                        Track Status
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Tips */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-border/50 shadow-lg bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-foreground">
                      <HelpCircle className="w-4 h-4 text-accent" />
                      Tips for Better Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-accent font-bold">•</span>
                        Be specific about the location
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent font-bold">•</span>
                        Mention how long the issue has persisted
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent font-bold">•</span>
                        Describe who is affected (families, children, elderly)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent font-bold">•</span>
                        Include any safety or health concerns
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-accent font-bold">•</span>
                        Use words like "urgent" or "emergency" if applicable
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Links */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="border-accent/30 bg-accent/10">
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      Want to see all complaints and analytics?
                    </p>
                    <Link to="/dashboard">
                      <Button variant="default" size="sm" className="w-full">
                        View Authority Dashboard
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
