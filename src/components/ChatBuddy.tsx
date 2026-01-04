import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Clock, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  id: string;
  from: "user" | "assistant";
  text: string;
  time: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: "m-0",
    from: "assistant",
    time: "Now",
    text: "Hi! I'm Samadhan Assist. Ask me about expected resolution times, next steps, or where your complaint goes.",
  },
];

function estimateReply(userText: string): string {
  const lower = userText.toLowerCase();

  const emergencyLine = "For immediate assistance, dial the emergency number 1800-180-4334.";
  const officerLine = "Please contact our designated officer at 0522-2237582.";
  const standardTimeline = "You can expect a response within 3-7 days. We're committed to resolving this for you.";
  const genericTimelines = "Typical timelines — Critical: 4-24h, High: 1-2 days, Medium: 2-4 days, Low: 3-7 days.";

  const topics = [
    {
      name: "Safety",
      match: ["robbery", "theft", "crime", "attack", "assault", "violence"],
      summary: "I'm truly sorry to hear about this distressing incident. I've categorized it under 'Safety'.",
      extra: [officerLine, emergencyLine, standardTimeline],
    },
    {
      name: "Sanitation",
      match: ["garbage", "waste", "sanitation", "trash", "overflow", "bins"],
      summary: "Thanks for flagging this. I've categorized it under 'Sanitation'.",
      extra: ["We typically see these resolved in 1-3 days. Photos help speed things up.", standardTimeline],
    },
    {
      name: "Water Supply",
      match: ["water", "supply", "leak", "pipeline", "tap"],
      summary: "Noted as a 'Water Supply' issue.",
      extra: ["Full outages are treated as high priority (12-24h typical).", standardTimeline],
    },
    {
      name: "Electricity",
      match: ["power", "electricity", "outage", "light", "transformer"],
      summary: "Flagged as an 'Electricity' outage.",
      extra: ["Most outages clear within 4-24h depending on severity.", standardTimeline],
    },
    {
      name: "Road Maintenance",
      match: ["road", "pothole", "street", "footpath", "sidewalk"],
      summary: "Tagged as a 'Road Maintenance' complaint.",
      extra: ["Minor fixes: 2-5 days; major damage will be scheduled and communicated.", standardTimeline],
    },
  ];

  const urgencyKeywords = ["urgent", "emergency", "immediate", "critical", "danger", "unsafe"];
  const mentionsUrgency = urgencyKeywords.some((kw) => lower.includes(kw));

  const bestTopic = topics
    .map((topic) => {
      const score = topic.match.reduce((acc, kw) => (lower.includes(kw) ? acc + 1 : acc), 0);
      return { topic, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (bestTopic && bestTopic.score > 0) {
    return [
      `${bestTopic.topic.summary}${mentionsUrgency ? " I've marked this as high urgency." : ""}`,
      ...bestTopic.topic.extra,
    ].join("\n\n");
  }

  const timelineIntent = ["how long", "how much time", "eta", "when", "time it will take"].some((kw) => lower.includes(kw));

  return [
    timelineIntent ? "I can share timelines based on the issue." : "Got it. I've logged your query.",
    genericTimelines,
    "Share your complaint ID for a tailored ETA, or add category/location to speed things up.",
  ].join("\n\n");
}

export function ChatBuddy() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const now = new Date();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      from: "user",
      text: input.trim(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-assist", {
        body: { message: userMsg.text },
      });

      if (error || !data?.reply) {
        throw error || new Error("No reply received");
      }

      const replyMsg: ChatMessage = {
        id: `a-${Date.now()}-r`,
        from: "assistant",
        text: data.reply,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, replyMsg]);
    } catch (err) {
      const fallback: ChatMessage = {
        id: `a-${Date.now()}-f`,
        from: "assistant",
        text: "I couldn't reach the assistant right now. Please try again in a moment or check your connection.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallback]);
      console.error("chat-assist error", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <Card className="w-80 shadow-2xl border-border/60 overflow-hidden animate-in fade-in zoom-in duration-150">
          <div className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <div>
                <p className="text-sm font-semibold">Samadhan Assist</p>
                <p className="text-[11px] opacity-90">Quick guidance & ETAs</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-accent-foreground" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="px-4 py-3 border-b border-border/50 text-[12px] text-muted-foreground flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Typical timelines: Critical 4-24h · High 1-2d · Medium 2-4d · Low 3-7d
          </div>

          <ScrollArea className="h-64 px-4 py-3 space-y-3 bg-background">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.from === "assistant" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm border border-border/50 ${
                    msg.from === "assistant"
                      ? "bg-muted/70 text-foreground"
                      : "bg-accent text-accent-foreground"
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  <span className="block mt-1 text-[10px] opacity-70">{msg.time}</span>
                </div>
              </div>
            ))}
          </ScrollArea>

          <div className="p-3 border-t border-border/60 bg-card">
            <div className="flex items-center gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your issue or timeline..."
                className="min-h-[60px] text-sm"
              />
              <Button
                variant="default"
                size="icon"
                className="h-[60px] w-12 bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={sendMessage}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Button
        size="lg"
        className="rounded-full shadow-lg h-12 px-4 gap-2 bg-accent text-accent-foreground hover:shadow-xl"
        onClick={() => setOpen((v) => !v)}
      >
        <MessageCircle className="w-5 h-5" />
        {open ? "Close Assistant" : "Chat with Samadhan"}
      </Button>
    </div>
  );
}
