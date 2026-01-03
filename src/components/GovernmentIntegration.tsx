import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Phone,
  Mail,
  Globe,
  Shield,
  FileCheck,
  ArrowUpRight
} from "lucide-react";

const GOVERNMENT_PORTALS = [
  {
    id: "cpgrams",
    name: "CPGRAMS",
    fullName: "Centralized Public Grievance Redress and Monitoring System",
    status: "integrated",
    url: "https://pgportal.gov.in",
    logo: "🏛️",
    description: "Central Government grievance portal for all ministries",
    features: ["Auto-sync", "Status tracking", "Escalation support"]
  },
  {
    id: "cm-helpline",
    name: "CM Helpline",
    fullName: "Chief Minister's Helpline",
    status: "integrated",
    url: "https://cmhelpline.gov.in",
    logo: "📞",
    description: "Direct escalation to State CM Office",
    features: ["Priority routing", "VIP escalation", "24/7 support"]
  },
  {
    id: "swachhata",
    name: "Swachhata App",
    fullName: "Swachh Bharat Mission Portal",
    status: "integrated",
    url: "https://swachhbharatmission.gov.in",
    logo: "🧹",
    description: "Sanitation and cleanliness complaints",
    features: ["Photo upload", "GPS tagging", "Real-time status"]
  },
  {
    id: "jal-shakti",
    name: "Jal Shakti",
    fullName: "Ministry of Jal Shakti Portal",
    status: "connected",
    url: "https://jalshakti-ddws.gov.in",
    logo: "💧",
    description: "Water supply and sanitation issues",
    features: ["Water quality", "Supply tracking", "Billing issues"]
  },
  {
    id: "efir-portal",
    name: "e-FIR Portal",
    fullName: "Online Police Complaint System",
    status: "connected",
    url: "https://efir.gov.in",
    logo: "🚔",
    description: "Non-emergency police complaints",
    features: ["FIR filing", "Status check", "Document upload"]
  },
  {
    id: "umang",
    name: "UMANG",
    fullName: "Unified Mobile Application for New-age Governance",
    status: "integrated",
    url: "https://umang.gov.in",
    logo: "📱",
    description: "Unified platform for government services",
    features: ["Multi-service", "DigiLocker", "Aadhaar linked"]
  }
];

const ESCALATION_LEVELS = [
  { level: 1, name: "Ward Officer", timeline: "24 hours", icon: "👤" },
  { level: 2, name: "Zonal Officer", timeline: "48 hours", icon: "👥" },
  { level: 3, name: "District Collector", timeline: "72 hours", icon: "🏢" },
  { level: 4, name: "CM Helpline", timeline: "7 days", icon: "🏛️" },
  { level: 5, name: "CPGRAMS", timeline: "15 days", icon: "🇮🇳" },
];

export function GovernmentIntegration() {
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-accent" />
            Government Portal Integration
          </h2>
          <p className="text-muted-foreground mt-1">
            Seamlessly connected to official government grievance systems
          </p>
        </div>
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          6 Portals Connected
        </Badge>
      </div>

      {/* Connected Portals Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {GOVERNMENT_PORTALS.map((portal, index) => (
          <motion.div
            key={portal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg border-border/50 ${
                selectedPortal === portal.id ? 'ring-2 ring-accent' : ''
              } ${portal.status === 'integrated' ? 'bg-green-500/5' : portal.status === 'connected' ? 'bg-blue-500/5' : 'bg-muted/30'}`}
              onClick={() => setSelectedPortal(portal.id === selectedPortal ? null : portal.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{portal.logo}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{portal.name}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">{portal.fullName}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      portal.status === 'integrated' 
                        ? 'bg-green-500/10 text-green-600 border-green-500/30' 
                        : portal.status === 'connected'
                        ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                        : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                    }`}
                  >
                    {portal.status === 'integrated' ? 'Integrated' : portal.status === 'connected' ? 'Connected' : 'Pending'}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-3">{portal.description}</p>

                <div className="flex flex-wrap gap-1">
                  {portal.features.map((feature) => (
                    <span key={feature} className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                      {feature}
                    </span>
                  ))}
                </div>

                {selectedPortal === portal.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.open(portal.url, '_blank')}
                      >
                        <Globe className="w-3 h-3 mr-1" />
                        Visit Portal
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedPortal(null)}
                      >
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        Escalate
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Escalation Pathway */}
      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-accent" />
            Automatic Escalation Pathway
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complaints automatically escalate if not resolved within SLA timelines
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {ESCALATION_LEVELS.map((level, index) => (
              <div key={level.level} className="flex items-center">
                <div className="flex flex-col items-center min-w-[100px]">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    index === 0 ? 'bg-green-500/20' : 
                    index === 1 ? 'bg-blue-500/20' : 
                    index === 2 ? 'bg-yellow-500/20' : 
                    index === 3 ? 'bg-orange-500/20' : 
                    'bg-red-500/20'
                  }`}>
                    {level.icon}
                  </div>
                  <p className="text-xs font-medium text-foreground mt-2 text-center">{level.name}</p>
                  <p className="text-xs text-muted-foreground">{level.timeline}</p>
                </div>
                {index < ESCALATION_LEVELS.length - 1 && (
                  <div className="w-8 h-0.5 bg-border mx-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Toll-Free Helpline</h4>
              <p className="text-lg font-bold text-blue-600">1800-XXX-XXXX</p>
              <p className="text-xs text-muted-foreground">24/7 Available</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Email Support</h4>
              <p className="text-sm font-medium text-green-600">grievance@samadhan.gov.in</p>
              <p className="text-xs text-muted-foreground">Response within 24hrs</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <FileCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">RTI Integration</h4>
              <p className="text-sm font-medium text-purple-600">Auto-linked</p>
              <p className="text-xs text-muted-foreground">Transparency guaranteed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
