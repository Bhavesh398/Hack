import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, MapPin, FileText, CheckCircle2, Loader2, User, Mail, Phone, Navigation, Upload, X, Image as ImageIcon, Video } from "lucide-react";
import { useComplaints } from "@/hooks/useComplaints";
import { useToast } from "@/hooks/use-toast";

export function ComplaintForm() {
  const [citizenName, setCitizenName] = useState("");
  const [citizenEmail, setCitizenEmail] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const { submitComplaint } = useComplaints();
  const { toast } = useToast();

  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Samadhan-Grievance-App'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const address = data.address;
            
            // Build a readable address from components
            const parts = [
              address.road || address.street,
              address.neighbourhood || address.suburb,
              address.city || address.town || address.village,
              address.state_district || address.state,
            ].filter(Boolean);
            
            const locationName = parts.length > 0 
              ? parts.join(", ") 
              : data.display_name || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
            
            setLocation(locationName);
            toast({
              title: "Location Captured",
              description: locationName,
            });
          } else {
            // Fallback to coordinates if geocoding fails
            const locationString = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
            setLocation(locationString);
            toast({
              title: "Location Captured",
              description: "Coordinates captured (address lookup unavailable)",
            });
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          // Fallback to coordinates
          const locationString = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
          setLocation(locationString);
          toast({
            title: "Location Captured",
            description: "Using coordinates (address lookup failed)",
          });
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access denied. Please enable location permissions.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMessage = "Location information unavailable.";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out.";
        }
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isUnder50MB = file.size <= 50 * 1024 * 1024;
      
      if (!isImage && !isVideo) {
        toast({
          title: 'Invalid File Type',
          description: `${file.name} is not an image or video`,
          variant: 'destructive',
        });
        return false;
      }
      
      if (!isUnder50MB) {
        toast({
          title: 'File Too Large',
          description: `${file.name} exceeds 50MB limit`,
          variant: 'destructive',
        });
        return false;
      }
      
      return true;
    });
    
    setAttachedFiles(prev => [...prev, ...validFiles]);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!citizenName.trim() || !text.trim() || !location) return;

    setIsSubmitting(true);
    try {
      const result = await submitComplaint({
        citizenName,
        citizenEmail: citizenEmail || undefined,
        citizenPhone: citizenPhone || undefined,
        description: text,
        location,
        affectedPeople: 1,
        attachedFiles,
      });
      
      setSubmittedId(result.complaint.complaint_id);
      
      setTimeout(() => {
        setCitizenName("");
        setCitizenEmail("");
        setCitizenPhone("");
        setText("");
        setLocation("");
        setAttachedFiles([]);
        setSubmittedId(null);
      }, 5000);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-xl overflow-hidden bg-card">
        <div className="h-1.5 bg-gradient-to-r from-primary via-accent to-secondary" />
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl text-foreground">
            <FileText className="w-5 h-5 text-accent" />
            File Your Grievance
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Describe your issue in detail. Our AI will automatically classify and prioritize your complaint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Citizen Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-accent" />
                Your Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter your full name"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                className="border-border/50 bg-background text-foreground placeholder:text-muted-foreground"
                disabled={!!submittedId}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                Email (Optional)
              </label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={citizenEmail}
                onChange={(e) => setCitizenEmail(e.target.value)}
                className="border-border/50 bg-background text-foreground placeholder:text-muted-foreground"
                disabled={!!submittedId}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent" />
                Phone (Optional)
              </label>
              <Input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                value={citizenPhone}
                onChange={(e) => setCitizenPhone(e.target.value)}
                className="border-border/50 bg-background text-foreground placeholder:text-muted-foreground"
                disabled={!!submittedId}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Your Complaint <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Describe your grievance in detail... (e.g., 'There is a huge pothole on Main Street near the hospital. Ambulances are having difficulty passing. This has been going on for 5 days.')"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[140px] resize-none border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-accent"
              disabled={!!submittedId}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Include details like duration and urgency for better prioritization.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-accent" />
              Attach Media (Optional)
            </label>
            <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center cursor-pointer hover:border-accent/50 transition">
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="media-upload"
                disabled={!!submittedId}
              />
              <label htmlFor="media-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-2">
                    <ImageIcon className="w-5 h-5 text-accent" />
                    <Video className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Click to upload images or videos</p>
                  <p className="text-xs text-muted-foreground">Max 50MB per file • PNG, JPG, MP4, etc.</p>
                </div>
              </label>
            </div>

            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Attached ({attachedFiles.length}):</p>
                <div className="space-y-1">
                  {attachedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                        ) : (
                          <Video className="w-4 h-4 text-purple-500 shrink-0" />
                        )}
                        <span className="text-sm truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={!!submittedId}
                        className="h-6 w-6 p-0 shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              Location <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter location or use GPS"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-border/50 bg-background text-foreground placeholder:text-muted-foreground flex-1"
                disabled={!!submittedId}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation || !!submittedId}
                className="shrink-0"
                title="Use my current location"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={!text.trim() || !location || !citizenName.trim() || isSubmitting || !!submittedId}
            className="w-full font-semibold"
            variant="default"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Complaint
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {submittedId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </motion.div>
            <h3 className="text-xl font-bold text-foreground mb-2">Complaint Submitted!</h3>
            <p className="text-muted-foreground mb-2">Your complaint ID:</p>
            <p className="font-mono text-lg font-bold text-accent">{submittedId}</p>
            <p className="text-sm text-muted-foreground mt-4">You can track your complaint status in the Authority Dashboard.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
