import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Send, MapPin, FileText, CheckCircle2, Loader2, User, Mail, Phone, Navigation, Upload, X, Image as ImageIcon, Video, Languages, Mic, MicOff } from "lucide-react";
import { useComplaints } from "@/hooks/useComplaints";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'हिंदी (Hindi)' },
  { code: 'mr', name: 'मराठी (Marathi)' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
  { code: 'ta', name: 'தமிழ் (Tamil)' },
  { code: 'te', name: 'తెలుగు (Telugu)' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', name: 'മലയാളം (Malayalam)' },
  { code: 'bn', name: 'বাংলা (Bengali)' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)' },
];

export function ComplaintForm() {
  const [citizenName, setCitizenName] = useState("");
  const [citizenEmail, setCitizenEmail] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const { submitComplaint } = useComplaints();
  const { toast } = useToast();

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const startRecording = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (!(window as any).isSecureContext) {
      toast({
        title: "Voice Input Needs HTTPS",
        description: "Please use a secure (https) connection to enable microphone access.",
        variant: "destructive",
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    const recognition: any = new SpeechRecognition();
    recognition.lang = selectedLanguage === 'en' ? 'en-IN' : selectedLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let combined = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
      }
      const updated = `${text ? text + ' ' : ''}${combined}`.trim();
      handleComplaintChange(updated);
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      const errorType = event?.error || "unknown";
      const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

      const messages: Record<string, { title: string; description: string; variant?: "default" | "destructive" }> = {
        "not-allowed": {
          title: "Microphone Permission Blocked",
          description: "Allow mic access in your browser settings and try again.",
          variant: "destructive",
        },
        "service-not-allowed": {
          title: "Microphone Permission Blocked",
          description: "Allow mic access in your browser settings and try again.",
          variant: "destructive",
        },
        "audio-capture": {
          title: "No Microphone Detected",
          description: "Plug in or enable a microphone, then retry.",
          variant: "destructive",
        },
        "network": {
          title: isOffline ? "You appear offline" : "Network Issue",
          description: isOffline
            ? "Reconnect to the internet and retry voice input."
            : "Check your connection or VPN and retry voice input.",
          variant: isOffline ? "default" : "destructive",
        },
        "no-speech": {
          title: "No Speech Detected",
          description: "We couldn't hear anything. Speak again when ready.",
          variant: "default",
        },
        "aborted": {
          title: "Voice Capture Stopped",
          description: "Recording was stopped. Start again to continue.",
          variant: "default",
        },
        "unknown": {
          title: "Voice Capture Error",
          description: "Please try again or check your microphone permissions.",
          variant: "destructive",
        },
      };

      const { title, description, variant } = messages[errorType] || messages["unknown"];
      toast({ title, description, variant: variant || "destructive" });
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const translateToEnglish = async (textToTranslate: string, language: string) => {
    if (language === 'en' || !textToTranslate.trim()) {
      setTranslatedText(textToTranslate);
      return;
    }

    setIsTranslating(true);
    try {
      // Language pair mapping for MyMemory API
      const langPairs: Record<string, string> = {
        'hi': 'hi|en',
        'mr': 'mr|en',
        'gu': 'gu|en',
        'ta': 'ta|en',
        'te': 'te|en',
        'kn': 'kn|en',
        'ml': 'ml|en',
        'bn': 'bn|en',
        'pa': 'pa|en',
      };

      const langPair = langPairs[language] || 'en|en';
      const encodedText = encodeURIComponent(textToTranslate);
      
      try {
        // Try MyMemory API first
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langPair}`, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.responseStatus === 200 && data.responseData.translatedText) {
            setTranslatedText(data.responseData.translatedText);
            setIsTranslating(false);
            return;
          }
        }
      } catch (e) {
        console.log('MyMemory API failed, trying fallback');
      }

      // Fallback: Try using Gemini API if available
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Translate the following text from ${language} to English. Respond with ONLY the translated text, nothing else, no explanations:\n\n"${textToTranslate}"`
              }]
            }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1024,
            }
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const translated = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated) {
            setTranslatedText(translated);
            setIsTranslating(false);
            return;
          }
        }
      } catch (e) {
        console.log('Gemini API failed');
      }

      // If both fail, use original text
      setTranslatedText(textToTranslate);
      toast({
        title: "Translation Note",
        description: "Could not auto-translate. Original text will be used.",
        variant: "default",
      });
    } catch (error) {
      console.error('Translation error:', error);
      setTranslatedText(textToTranslate);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleComplaintChange = async (value: string) => {
    setText(value);
    if (selectedLanguage !== 'en' && value.trim()) {
      await translateToEnglish(value, selectedLanguage);
    } else {
      setTranslatedText(value);
    }
  };

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
        description: translatedText || text, // Use translated text or fallback to original
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
        setTranslatedText("");
        setSelectedLanguage("en");
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
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Languages className="w-4 h-4 text-accent" />
              Select Language
            </label>
            <Select value={selectedLanguage} onValueChange={(value) => {
              setSelectedLanguage(value);
              if (text.trim()) {
                handleComplaintChange(text);
              }
            }}>
              <SelectTrigger className="border-border/50 bg-background text-foreground">
                <SelectValue placeholder="Choose a language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Write your complaint in any language - it will be automatically translated to English for processing.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Your Complaint <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">Type or speak to fill the description.</p>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={startRecording}
                disabled={!!submittedId}
                className="gap-2"
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isRecording ? "Stop voice" : "Voice to text"}
              </Button>
            </div>
            <Textarea
              placeholder="Describe your grievance in detail in your preferred language... (e.g., 'There is a huge pothole on Main Street near the hospital. Ambulances are having difficulty passing. This has been going on for 5 days.')"
              value={text}
              onChange={(e) => handleComplaintChange(e.target.value)}
              className="min-h-[140px] resize-none border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-accent"
              disabled={!!submittedId}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Include details like duration and urgency for better prioritization.
            </p>
          </div>

          {translatedText && text && selectedLanguage !== 'en' && (
            <div className="space-y-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs font-medium text-blue-600">📝 English Translation (will be processed):</p>
              <p className="text-sm text-foreground">{translatedText}</p>
              {isTranslating && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Translating...
                </p>
              )}
            </div>
          )}

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
