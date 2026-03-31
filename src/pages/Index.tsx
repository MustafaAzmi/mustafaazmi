import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Lock, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"idle" | "signup" | "signin">("idle");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signIn } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Eye className="h-8 w-8 animate-pulse-slow text-primary" />
      </div>
    );
  }

  if (user && profile) {
    navigate("/dashboard");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        if (username.length < 3 || username.length > 20) {
          toast.error("Username must be 3-20 characters");
          return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
          toast.error("Username: letters, numbers, underscores only");
          return;
        }
        await signUp(email, password, username);
        toast.success("Account created. Check your email to confirm.");
      } else {
        await signIn(email, password);
        toast.success("Welcome back to the shadows…");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl animate-float" />
        <div className="absolute right-1/4 bottom-1/3 h-48 w-48 rounded-full bg-mystery-accent/5 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo area */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
            <Eye className="h-4 w-4 text-primary" />
            Someone is watching…
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-glow">
            Who's <span className="text-primary">watching</span> you?
          </h1>
          <p className="text-muted-foreground text-lg max-w-sm mx-auto">
            Create your mystery page. Let others interact anonymously. Discover who's curious about you.
          </p>
        </div>

        {mode === "idle" ? (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Eye, label: "Silent watchers" },
                { icon: MessageCircle, label: "Hidden messages" },
                { icon: Lock, label: "Mystery reveals" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-lg border border-border/50 bg-card/50 p-4 backdrop-blur-sm">
                  <Icon className="mx-auto h-5 w-5 text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setMode("signup")}
              className="w-full h-12 text-base bg-primary hover:bg-primary/90 border-glow"
            >
              Create your mystery page
            </Button>
            <button
              onClick={() => setMode("signin")}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Already have a page? Sign in →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Choose your username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="your_mystery_name"
                  className="h-12 bg-card/50 border-border/50 font-mono"
                  required
                  minLength={3}
                  maxLength={20}
                />
                {username.length >= 3 && (
                  <p className="text-xs text-muted-foreground">
                    Your link: <span className="text-primary font-mono">{window.location.origin}/{username}</span>
                  </p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-12 bg-card/50 border-border/50"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 bg-card/50 border-border/50"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 text-base bg-primary hover:bg-primary/90 border-glow"
            >
              {submitting ? "…" : mode === "signup" ? "Enter the mystery" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === "signup" ? "Already have a page? Sign in →" : "New here? Create a page →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Index;
