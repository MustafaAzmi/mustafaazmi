import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye, Lock, Brain, MessageCircle, Heart,
  HelpCircle, MapPin, Smartphone, Clock, Sparkles, User
} from "lucide-react";
import ChatBox from "@/components/ChatBox";

interface ShadowInteraction {
  id: string;
  interaction_type: string;
  message: string | null;
  created_at: string;
  anonymous_id: string | null;
  device_type: string | null;
  city: string | null;
  session_fingerprint: string | null;
}

interface UnlockedHint {
  puzzleId: string;
  hint: string;
}

interface ShadowProfileCardProps {
  anonymousId: string;
  interactions: ShadowInteraction[];
  unlockedHints: UnlockedHint[];
  onOpenPuzzle: (anonymousId: string) => void;
  onGuess: (anonymousId: string, guess: string) => void;
  ownerCity?: string | null;
  profileId: string;
}

const ShadowProfileCard = ({
  anonymousId,
  interactions,
  unlockedHints,
  onOpenPuzzle,
  onGuess,
  ownerCity,
  profileId,
}: ShadowProfileCardProps) => {
  const [guessMode, setGuessMode] = useState(false);
  const [guessText, setGuessText] = useState("");
  const [guessResponse, setGuessResponse] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const latest = interactions[0];
  const count = interactions.length;
  const hasMessages = interactions.some((i) => i.interaction_type === "message");
  const isRepeat = count > 1;
  const city = interactions.find((i) => i.city)?.city;
  const device = interactions.find((i) => i.device_type)?.device_type;
  const timeDiff = Date.now() - new Date(latest.created_at).getTime();
  const isRecent = timeDiff < 3600000;
  const sameCity = ownerCity && city && city.toLowerCase() === ownerCity.toLowerCase();

  const firstSeen = new Date(interactions[interactions.length - 1].created_at);
  const lastSeen = new Date(latest.created_at);
  const fingerprint = interactions.find((i) => i.session_fingerprint)?.session_fingerprint;
  const totalVisits = count;

  // Real data hints - progressively revealed by puzzle count
  const mysteryHints: { icon: typeof Eye; text: string; revealed: boolean }[] = [
    { icon: Clock, text: isRecent ? "Active recently" : "Last seen a while ago", revealed: true },
    { icon: Eye, text: `Total visits: ${totalVisits}`, revealed: true },
    // Level 1 puzzle → city/location
    { icon: MapPin, text: city ? `📍 Location: ${city}` : "📍 Location: Unknown region", revealed: unlockedHints.length >= 1 },
    // Level 2 puzzle → device info
    { icon: Smartphone, text: device ? `📱 Device: ${device}` : "📱 Device: Undetected", revealed: unlockedHints.length >= 2 },
    // Level 3 puzzle → first seen timestamp
    { icon: Clock, text: `🕐 First visited: ${firstSeen.toLocaleDateString()} at ${firstSeen.toLocaleTimeString()}`, revealed: unlockedHints.length >= 3 },
    // Level 4 puzzle → session fingerprint (partial)
    { icon: Eye, text: fingerprint ? `🔑 Session ID: ${fingerprint.slice(0, 8)}…${fingerprint.slice(-4)}` : "🔑 Session: No fingerprint", revealed: unlockedHints.length >= 4 },
    // Level 5 puzzle → proximity hint based on same city
    { icon: Heart, text: sameCity ? "⚠️ This person is in YOUR city!" : city ? `🌍 Distance: Different region (${city})` : "🌍 Distance: Cannot determine", revealed: unlockedHints.length >= 5 },
  ];

  const interactionIcons: Record<string, { icon: typeof Eye; color: string }> = {
    interested: { icon: Heart, color: "text-pink-400" },
    curious: { icon: Eye, color: "text-mystery-accent" },
    message: { icon: MessageCircle, color: "text-mystery-warm" },
  };

  const handleGuess = () => {
    if (!guessText.trim()) return;
    const responses = [
      "You might be right… or completely wrong 👀",
      "Interesting guess… the shadows neither confirm nor deny",
      "Someone is smiling right now… or frowning",
      "The truth is closer than you think… maybe",
      "Your intuition might serve you well… or deceive you",
    ];
    setGuessResponse(responses[Math.floor(Math.random() * responses.length)]);
    onGuess(anonymousId, guessText);
    setGuessText("");
  };

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-5 backdrop-blur-sm space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-primary">{anonymousId}</p>
            <p className="text-xs text-muted-foreground">{count} interaction{count !== 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {interactions.slice(0, 3).map((interaction, i) => {
            const config = interactionIcons[interaction.interaction_type] || { icon: HelpCircle, color: "text-muted-foreground" };
            return <config.icon key={i} className={`h-4 w-4 ${config.color}`} />;
          })}
        </div>
      </div>

      {/* Messages preview */}
      {hasMessages && (
        <div className="rounded-md border border-border/30 bg-secondary/30 p-3 space-y-1">
          {interactions
            .filter((i) => i.interaction_type === "message" && i.message)
            .slice(0, 2)
            .map((i) => (
              <p key={i.id} className="text-sm text-muted-foreground italic">"{i.message}"</p>
            ))}
        </div>
      )}

      {/* Coded chat interactions */}
      {interactions.some(i => i.interaction_type.startsWith("proximity_") || i.interaction_type.startsWith("time_") || i.interaction_type.startsWith("relationship_")) && (
        <div className="flex flex-wrap gap-1.5">
          {interactions
            .filter(i => i.interaction_type.startsWith("proximity_") || i.interaction_type.startsWith("time_") || i.interaction_type.startsWith("relationship_"))
            .map((i) => (
              <span key={i.id} className="text-xs rounded-full px-2.5 py-1 bg-primary/10 text-primary border border-primary/20">
                {codedChatLabel(i.interaction_type)}
              </span>
            ))}
        </div>
      )}

      {/* Mystery hints */}
      <div className="space-y-2">
        {mysteryHints.map((hint, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {hint.revealed ? (
              <>
                <hint.icon className="h-3.5 w-3.5 text-primary/70" />
                <span className="text-muted-foreground">{hint.text}</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-muted-foreground/30" />
                <span className="text-muted-foreground/30">Locked — solve a puzzle to reveal</span>
              </>
            )}
          </div>
        ))}

      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenPuzzle(anonymousId)}
          className="flex-1 border-primary/20 hover:bg-primary/10 text-xs"
        >
          <Brain className="mr-1.5 h-3.5 w-3.5" />
          Solve puzzle
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setChatOpen(!chatOpen)}
          className="flex-1 border-mystery-warm/20 hover:bg-mystery-warm/10 text-xs"
        >
          <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
          {chatOpen ? "Close chat" : "Reply"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setGuessMode(!guessMode)}
          className="flex-1 border-mystery-accent/20 hover:bg-accent/10 text-xs"
        >
          <HelpCircle className="mr-1.5 h-3.5 w-3.5" />
          Guess
        </Button>
      </div>

      {/* Chat Box */}
      {chatOpen && (
        <ChatBox
          profileId={profileId}
          anonymousId={anonymousId}
          senderType="owner"
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Guess mode */}
      {guessMode && (
        <div className="space-y-2 animate-slide-up">
          <p className="text-xs text-muted-foreground">Do you think you know who this is?</p>
          <div className="flex gap-2">
            <Input
              value={guessText}
              onChange={(e) => setGuessText(e.target.value)}
              placeholder="Enter your guess…"
              className="text-sm bg-secondary/50 border-border/50"
            />
            <Button size="sm" onClick={handleGuess} disabled={!guessText.trim()}>
              Guess
            </Button>
          </div>
          {guessResponse && (
            <p className="text-xs text-mystery-accent italic animate-fade-in">{guessResponse}</p>
          )}
        </div>
      )}
    </div>
  );
};

function codedChatLabel(type: string): string {
  const labels: Record<string, string> = {
    proximity_close: "Close to me?",
    proximity_circle: "From my circle?",
    proximity_often: "We meet often?",
    time_past: "From the past?",
    time_recent: "Recently noticed?",
    time_long: "Long time watching?",
    relationship_friend: "Friend?",
    relationship_know: "Just know me?",
    relationship_interested: "Interested?",
  };
  return labels[type] || type;
}

export default ShadowProfileCard;
