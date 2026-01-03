import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Layers,
  BarChart3,
  FileText,
  Building2,
  Trophy,
  Medal,
  Sparkles,
  ShieldCheck
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Classification",
    description: "Natural Language Processing automatically categorizes complaints into the right department with 95% accuracy.",
  },
  {
    icon: Zap,
    title: "Intelligent Priority Scoring",
    description: "Dynamic priority based on urgency, sentiment, impact, and affected population — not just keywords.",
  },
  {
    icon: Layers,
    title: "Smart Clustering",
    description: "AI detects patterns and clusters similar complaints from the same area to identify systemic issues.",
  },
  {
    icon: Clock,
    title: "Impact Prediction",
    description: "Proactive alerts on potential escalation if issues remain unresolved within critical timeframes.",
  },
  {
    icon: Building2,
    title: "Auto-Routing Engine",
    description: "Instant assignment to the right department with geo-location mapping and SLA tracking.",
  },
  {
    icon: BarChart3,
    title: "Accountability Analytics",
    description: "Track department performance, identify delays, and generate actionable insights for policymakers.",
  },
];

const stats = [
  { value: "10,000+", label: "Complaints Processed" },
  { value: "85%", label: "Resolution Rate" },
  { value: "< 24hrs", label: "Avg. Response Time" },
  { value: "95%", label: "Classification Accuracy" },
];

const champions = [
  {
    name: "Aarav Mehta",
    contributions: 15,
    focus: "Water and sanitation drives",
    city: "Mumbai",
    badge: "Impact Champion",
    prevented: 18,
  },
  {
    name: "Sara Iyer",
    contributions: 10,
    focus: "Road safety and lighting",
    city: "Thane",
    badge: "Safety Sentinel",
    prevented: 14,
  },
  {
    name: "Kabir Narang",
    contributions: 8,
    focus: "Health access and clinics",
    city: "Navi Mumbai",
    badge: "Health Ally",
    prevented: 11,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-[#001b36] via-[#00234f] to-[#003e7c] backdrop-blur-lg border-b border-white/10 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-6">
            <Link to="/">
              <Logo size="md" showText={true} className="text-white cursor-pointer hover:opacity-90 transition-opacity" />
            </Link>
            
            <div className="flex items-center gap-3">
              <Link to="/file-complaint">
                <Button
                  size="md"
                  className="rounded-full border border-white/30 bg-white text-[#00234f] hover:bg-white/90 hover:-translate-y-0.5 shadow-sm transition"
                >
                  File a Grievance
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button
                  size="md"
                  className="rounded-full border border-white/30 bg-white text-[#00234f] hover:bg-white/90 hover:-translate-y-0.5 shadow-sm transition"
                >
                  Complaint Tracker
                </Button>
              </Link>
              <Link to="/authority-login">
                <Button
                  size="md"
                  className="rounded-full border border-white/30 bg-white text-[#00234f] hover:bg-white/90 hover:-translate-y-0.5 shadow-sm transition"
                >
                  Authority Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/30" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative container mx-auto px-4 pt-0 pb-32">
          {/* Original nav hidden on desktop, shown on mobile as internal nav */}

          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                AI-Powered Public Governance
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
            >
              <span className="text-white">Because Every{" "}</span>
              <span className="text-white">Complaint</span>
              <br /><span className="text-white">Matters</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
            >
              Intelligent grievance redressal that understands citizen intent, 
              prioritizes what actually matters, and routes issues automatically 
              to the right authority with full transparency.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/file-complaint">
                <Button variant="hero" size="xl" className="gap-2">
                  <FileText className="w-5 h-5" />
                  File a Grievance
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="heroOutline" size="xl">
                  <Users className="w-5 h-5" />
                  Authority Portal
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 px-4 py-5 shadow-lg shadow-black/10"
              >
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-white/75">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))"/>
          </svg>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How Samadhan Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We replace chaos with intelligence. Our AI reads complaints like a human, 
            thinks like an administrator, and acts instantly.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Submit", desc: "Citizen files complaint via web, app, or voice", icon: FileText },
            { step: "02", title: "Analyze", desc: "NLP engine understands intent and extracts key details", icon: Brain },
            { step: "03", title: "Prioritize", desc: "Dynamic scoring based on urgency, impact, and sentiment", icon: TrendingUp },
            { step: "04", title: "Resolve", desc: "Auto-routed to department with full transparency", icon: CheckCircle2 },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-card rounded-2xl p-6 border border-border/50 shadow-lg h-full">
                <span className="text-5xl font-bold text-muted/50">{item.step}</span>
                <div className="mt-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              {index < 3 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-8 h-8 text-accent/30" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Citizen Recognition */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent font-semibold mb-4">
              <Sparkles className="w-4 h-4" />
              Citizen Recognition
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              People powering better cities
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We spotlight citizens who file high-quality reports, share fixes, and help departments resolve faster.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {champions.map((champion, index) => (
              <motion.div
                key={champion.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
                <div className="relative p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{champion.city}</p>
                      <h3 className="text-xl font-semibold text-foreground">{champion.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 text-accent">
                      <Trophy className="w-5 h-5" />
                      <span className="text-sm font-semibold">Top {index + 1}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-accent" />
                    <span>{champion.badge}</span>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed">
                    {champion.focus}
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-2xl font-bold text-foreground">{champion.contributions}</p>
                      <p className="text-xs text-muted-foreground">Impactful reports</p>
                    </div>
                    <div className="rounded-xl bg-muted/60 p-3">
                      <p className="text-2xl font-bold text-foreground">{champion.prevented}</p>
                      <p className="text-xs text-muted-foreground">Escalations avoided</p>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 text-accent px-3 py-1 text-sm font-medium">
                    <Medal className="w-4 h-4" />
                    Recognized contributor
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Makes Us Different
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We're not automating grievance filing — we're automating governance judgment.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-primary rounded-3xl p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/30 opacity-90" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Governance?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of citizens experiencing faster, fairer, and more transparent 
              grievance resolution.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/file-complaint">
                <Button variant="hero" size="xl">
                  File Your First Complaint
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <Logo size="sm" showText={true} className="text-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            AI-Powered Grievance Redressal System for Public Governance
          </p>
        </div>
      </footer>
    </div>
  );
}