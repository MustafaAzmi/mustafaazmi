import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, Heart, HelpCircle, Lock, LogOut, Link2, Copy } from "lucide-react";
import { toast } from "sonner";

interface InteractionSummary {
  interested: number;
  curious: number;
  messages: number;
  total: number;
  latest: string | null;
}

const Dashboard = () => {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<InteractionSummary>({
    interested: 0, curious: 0, messages: 0, total: 0, latest: null,
  });
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!profile) return;

    const fetchInteractions = async () => {
      const { data } = await supabase
        .from("interactions")
        .select("interaction_type, created_at")
        .eq("profile_id", profile.id)
        .order("created_at", { ascending: false });

      if (data) {
        setSummary({
          interested: data.filter(d => d.interaction_type === "interested").length,
          curious: data.filter(d => d.interaction_type === "curious").length,
          messages: data.filter(d => d.interaction_type === "message").length,
          total: data.length,
          latest: data[0]?.created_at || null,
        });
      }
      setFetching(false);
    };

    fetchInteractions();

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
  }, [profile]);

  const copyLink = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/${profile.username}`);
    toast.success("Link copied! Share it and see who's curious…");
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Eye className="h-8 w-8 animate-pulse-slow text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Build mystery feed items
  const feedItems: { icon: typeof Eye; text: string; detail: string; color: string }[] = [];

  if (summary.interested > 0) {
    feedItems.push({
      icon: Heart,
      text: summary.interested === 1 ? "Someone is interested in you" : `${summary.interested} people are interested`,
      detail: "They chose to let you know…",
      color: "text-pink-400",
    });
  }
  if (summary.curious > 0) {
    feedItems.push({
      icon: Eye,
      text: summary.curious === 1 ? "Someone is watching you" : `${summary.curious} silent watchers`,
      detail: "They're curious but won't say why…",
      color: "text-mystery-accent",
    });
  }
  if (summary.messages > 0) {
    feedItems.push({
      icon: Lock,
      text: summary.messages === 1 ? "1 hidden message 🔒" : `${summary.messages} hidden messages 🔒`,
      detail: "Someone has something to say…",
      color: "text-mystery-warm",
    });
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
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

        {/* Mystery notification */}
        {summary.total > 0 && (
          <div className="rounded-lg border border-border/50 bg-card/50 p-5 text-center space-y-2 backdrop-blur-sm border-glow animate-fade-in">
            <p className="text-sm text-muted-foreground">
              You received new interactions… but not everything is visible 👀
            </p>
            <p className="text-3xl font-bold text-glow">{summary.total}</p>
            <p className="text-xs text-muted-foreground">
              total interactions {summary.latest && `· last ${getTimeAgo(summary.latest)}`}
            </p>
          </div>
        )}

        {/* Feed */}
        {feedItems.length > 0 ? (
          <div className="space-y-3">
            {feedItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-card/50 p-5 backdrop-blur-sm animate-slide-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="rounded-full bg-secondary p-3">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="font-medium">{item.text}</p>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}

            {/* Tease */}
            <div className="rounded-lg border border-dashed border-border/30 p-5 text-center space-y-2">
              <HelpCircle className="mx-auto h-5 w-5 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                More details coming soon… keep sharing your link to unlock more
              </p>
            </div>
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
    </div>
  );
};

export default Dashboard;
