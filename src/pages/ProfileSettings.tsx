import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Eye, User } from "lucide-react";
import { toast } from "sonner";

const ProfileSettings = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/");
  }, [loading, user, navigate]);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) return;
    const trimmed = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      toast.error("Name must be 2–50 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update name");
    } else {
      toast.success("Display name updated!");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Eye className="h-8 w-8 animate-pulse-slow text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-md space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your mystery identity</p>
        </div>

        <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-5 backdrop-blur-sm">
          {/* Username (read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            <div className="flex items-center gap-2 rounded-md border border-border/30 bg-secondary/30 px-3 py-2.5">
              <User className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-sm font-mono">@{profile.username}</span>
            </div>
            <p className="text-xs text-muted-foreground/60">Username cannot be changed</p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Display Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your real name"
              className="bg-secondary/30 border-border/50"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground/60">
              🔒 Hidden by default — only revealed when someone solves enough puzzles
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
