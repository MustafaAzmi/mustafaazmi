import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Heart, HelpCircle, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

type Step = "loading" | "intro" | "actions" | "message" | "sent";

const VisitorPage = () => {
  const { username } = useParams<{ username: string }>();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("loading");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .single();
      if (data) {
        setProfileId(data.id);
        setStep("intro");
      } else {
        setStep("intro");
      }
    };
    fetchProfile();
  }, [username]);

  const sendInteraction = async (type: "interested" | "curious" | "message", msg?: string) => {
    if (!profileId) return;

    // Filter phone numbers from messages
    if (msg && /\d{7,}/.test(msg.replace(/[\s\-\(\)]/g, ""))) {
      toast.error("Phone numbers are not allowed in messages.");
      return;
    }

    setSending(true);
    const { error } = await supabase.from("interactions").insert({
      profile_id: profileId,
      interaction_type: type,
      message: msg || null,
    });
    setSending(false);

    if (error) {
      toast.error("Something went wrong…");
    } else {
      setStep("sent");
    }
  };

  if (step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Eye className="h-8 w-8 animate-pulse-slow text-primary" />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">This person doesn't exist…</h1>
          <p className="text-muted-foreground">Or maybe they're hiding. 👀</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-1/3 h-72 w-72 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute right-1/4 bottom-1/4 h-56 w-56 rounded-full bg-mystery-accent/5 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        {step === "intro" && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm animate-pulse-slow">
              <Eye className="h-4 w-4 text-primary" />
              You're being watched too…
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold">
                You found <span className="text-primary text-glow">@{username}</span>'s page
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Not everyone speaks… some people watch silently 👀
              </p>
            </div>

            <Button
              onClick={() => setStep("actions")}
              className="h-12 px-8 text-base bg-primary hover:bg-primary/90 border-glow"
            >
              Enter the mystery
            </Button>
          </div>
        )}

        {step === "actions" && (
          <div className="space-y-4 animate-slide-up">
            <p className="text-center text-sm text-muted-foreground mb-6">
              What do you want to do? They'll never know who you are…
            </p>

            {[
              {
                icon: Heart,
                label: "I'm interested",
                desc: "Let them know someone cares",
                action: () => sendInteraction("interested"),
                color: "text-pink-400",
              },
              {
                icon: HelpCircle,
                label: "I'm curious",
                desc: "You're just… watching",
                action: () => sendInteraction("curious"),
                color: "text-mystery-accent",
              },
              {
                icon: MessageCircle,
                label: "I have something to say",
                desc: "Send a hidden message",
                action: () => setStep("message"),
                color: "text-mystery-warm",
              },
            ].map(({ icon: Icon, label, desc, action, color }) => (
              <button
                key={label}
                onClick={action}
                disabled={sending}
                className="w-full flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-5 text-left backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 transition-all duration-300 group"
              >
                <div className="rounded-full bg-secondary p-3 group-hover:bg-primary/10 transition-colors">
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "message" && (
          <div className="space-y-4 animate-slide-up">
            <div className="text-center space-y-2">
              <MessageCircle className="mx-auto h-8 w-8 text-mystery-warm" />
              <h2 className="text-xl font-bold">Say something anonymous</h2>
              <p className="text-sm text-muted-foreground">They'll receive it… but never know it's you</p>
            </div>

            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your hidden message…"
              className="min-h-[120px] bg-card/50 border-border/50 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/500</p>

            <Button
              onClick={() => sendInteraction("message", message)}
              disabled={sending || message.trim().length === 0}
              className="w-full h-12 bg-primary hover:bg-primary/90 border-glow"
            >
              <Send className="mr-2 h-4 w-4" />
              {sending ? "Sending…" : "Send anonymously"}
            </Button>

            <button
              onClick={() => setStep("actions")}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          </div>
        )}

        {step === "sent" && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-glow">
              <Eye className="h-8 w-8 text-primary animate-pulse-slow" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-glow">Delivered into the shadows</h2>
              <p className="text-muted-foreground text-lg">
                This interaction might mean more than you think…
              </p>
            </div>
            <p className="text-sm text-muted-foreground animate-pulse-slow">
              They'll see something… but not everything 👀
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorPage;
