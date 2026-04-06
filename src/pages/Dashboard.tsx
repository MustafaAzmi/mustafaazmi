import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, LogOut, Link2, Copy, Zap } from "lucide-react";
import { toast } from "sonner";
import ShadowProfileCard from "@/components/ShadowProfileCard";
import PuzzleModal from "@/components/PuzzleModal";
import EnergyBar from "@/components/EnergyBar";

interface Interaction {
  id: string;
  interaction_type: string;
  message: string | null;
  created_at: string;
  anonymous_id: string | null;
  device_type: string | null;
  city: string | null;
  session_fingerprint: string | null;
}

interface Puzzle {
  id: string;
  level: number;
  question: string;
  answer: string;
  hint_reward: string;
  difficulty: string;
}

interface UnlockedHint {
  puzzleId: string;
  hint: string;
  anonymousId: string;
}

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [unlockedHints, setUnlockedHints] = useState<UnlockedHint[]>([]);
  const [fetching, setFetching] = useState(true);
  const [puzzleModalOpen, setPuzzleModalOpen] = useState(false);
  const [currentPuzzleAnonId, setCurrentPuzzleAnonId] = useState<string | null>(null);
  const [attentionMessage, setAttentionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  const fetchInteractions = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("interactions")
      .select("id, interaction_type, message, created_at, anonymous_id, device_type, city, session_fingerprint")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false });

    if (data) {
      setInteractions(data as Interaction[]);

      // Generate attention messages
      const recentCount = data.filter(
        (d) => Date.now() - new Date(d.created_at).getTime() < 3600000
      ).length;
      if (recentCount >= 5) {
        setAttentionMessage("🔥 Your profile is on fire right now!");
      } else if (recentCount >= 3) {
        setAttentionMessage("Your profile is gaining attention today");
      } else if (recentCount >= 1) {
        setAttentionMessage("You are being viewed more than usual");
      } else {
        setAttentionMessage(null);
      }
    }
    setFetching(false);
  }, [profile]);

  useEffect(() => {
    if (!profile) return;

    fetchInteractions();

    // Fetch puzzles
    supabase
      .from("puzzles")
      .select("*")
      .order("level", { ascending: true })
      .then(({ data }) => {
        if (data) setPuzzles(data as Puzzle[]);
      });

    // Fetch puzzle progress
    supabase
      .from("puzzle_progress")
      .select("puzzle_id, interaction_anonymous_id")
      .eq("user_id", user!.id)
      .then(({ data }) => {
        if (data) {
          // We'll resolve hints later when puzzles are loaded
          const hints = data.map((d) => ({
            puzzleId: d.puzzle_id,
            hint: "", // resolved below
            anonymousId: d.interaction_anonymous_id,
          }));
          setUnlockedHints(hints);
        }
      });

    // Real-time subscription
    const channel = supabase
      .channel("interactions-realtime")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "interactions",
        filter: `profile_id=eq.${profile.id}`,
      }, () => {
        fetchInteractions();
        toast("👀 New interaction detected…", { description: "Someone just engaged with your page" });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, user, fetchInteractions]);

  // Resolve hint texts once puzzles are loaded
  useEffect(() => {
    if (puzzles.length > 0 && unlockedHints.some((h) => !h.hint)) {
      setUnlockedHints((prev) =>
        prev.map((h) => {
          if (!h.hint) {
            const puzzle = puzzles.find((p) => p.id === h.puzzleId);
            return { ...h, hint: puzzle?.hint_reward || "A shadow revealed" };
          }
          return h;
        })
      );
    }
  }, [puzzles, unlockedHints]);

  const copyLink = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/${profile.username}`);
    toast.success("Link copied! Share it and see who's curious…");
  };

  // Group interactions by anonymous_id
  const shadowProfiles = interactions.reduce<Record<string, Interaction[]>>((acc, interaction) => {
    const key = interaction.anonymous_id || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(interaction);
    return acc;
  }, {});

  const getNextPuzzle = (anonId: string): Puzzle | null => {
    const solvedForAnon = unlockedHints
      .filter((h) => h.anonymousId === anonId)
      .map((h) => h.puzzleId);
    return puzzles.find((p) => !solvedForAnon.includes(p.id)) || null;
  };

  const handleOpenPuzzle = (anonId: string) => {
    setCurrentPuzzleAnonId(anonId);
    setPuzzleModalOpen(true);
  };

  const handlePuzzleSolved = async (puzzleId: string, hintReward: string) => {
    if (!user || !currentPuzzleAnonId) return;

    await supabase.from("puzzle_progress").insert({
      user_id: user.id,
      interaction_anonymous_id: currentPuzzleAnonId,
      puzzle_id: puzzleId,
    });

    setUnlockedHints((prev) => [
      ...prev,
      { puzzleId, hint: hintReward, anonymousId: currentPuzzleAnonId },
    ]);

    toast.success("🔓 New hint unlocked!");
  };

  const handleGuess = async (anonId: string, guess: string) => {
    if (!user) return;
    await supabase.from("guesses").insert({
      user_id: user.id,
      interaction_anonymous_id: anonId,
      guess_text: guess,
    });
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Eye className="h-8 w-8 animate-pulse-slow text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">@{profile.username}</h1>
            <p className="text-sm text-muted-foreground">Your mystery dashboard</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Share link */}
        <button
          onClick={copyLink}
          className="w-full flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-left hover:bg-primary/10 transition-colors group"
        >
          <div className="rounded-full bg-primary/10 p-2">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Share your mystery link</p>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {window.location.origin}/{profile.username}
            </p>
          </div>
          <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* Attention message */}
        {attentionMessage && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-primary">{attentionMessage}</p>
            </div>
          </div>
        )}

        {/* Energy Bar */}
        <EnergyBar interactionCount={interactions.length} />

        {/* Shadow Profiles */}
        {Object.keys(shadowProfiles).length > 0 ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Shadow Profiles ({Object.keys(shadowProfiles).length})
            </p>
            {Object.entries(shadowProfiles).map(([anonId, ints]) => (
              <ShadowProfileCard
                key={anonId}
                anonymousId={anonId}
                interactions={ints}
                unlockedHints={unlockedHints
                  .filter((h) => h.anonymousId === anonId)
                  .map((h) => ({ puzzleId: h.puzzleId, hint: h.hint }))}
                onOpenPuzzle={handleOpenPuzzle}
                onGuess={handleGuess}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/30 p-8 text-center space-y-4">
            <Eye className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <div className="space-y-2">
              <p className="font-medium text-muted-foreground">No interactions yet</p>
              <p className="text-sm text-muted-foreground">
                Share your mystery link and watch the curiosity unfold…
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Puzzle Modal */}
      <PuzzleModal
        open={puzzleModalOpen}
        onOpenChange={setPuzzleModalOpen}
        puzzle={currentPuzzleAnonId ? getNextPuzzle(currentPuzzleAnonId) : null}
        onSolved={handlePuzzleSolved}
      />
    </div>
  );
};

export default Dashboard;
