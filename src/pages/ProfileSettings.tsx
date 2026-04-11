import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Eye, User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

const ProfileSettings = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

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

  const handleEmailChange = async () => {
    if (!user) return;
    const trimmed = newEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (trimmed === user.email) {
      toast.error("That's already your current email");
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setSavingEmail(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Confirmation sent to both old and new email addresses");
      setNewEmail("");
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setSavingPassword(true);

    // Re-authenticate with current password first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      setSavingPassword(false);
      toast.error("Current password is incorrect");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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

        {/* Display Name & Username */}
        <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-5 backdrop-blur-sm">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            <div className="flex items-center gap-2 rounded-md border border-border/30 bg-secondary/30 px-3 py-2.5">
              <User className="h-4 w-4 text-muted-foreground/50" />
              <span className="text-sm font-mono">@{profile.username}</span>
            </div>
            <p className="text-xs text-muted-foreground/60">Username cannot be changed</p>
          </div>

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
            {saving ? "Saving…" : "Save Display Name"}
          </Button>
        </div>

        {/* Change Email */}
        <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Change Email</h2>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Current email</label>
            <div className="flex items-center gap-2 rounded-md border border-border/30 bg-secondary/30 px-3 py-2.5">
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">New email</label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              className="bg-secondary/30 border-border/50"
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground/60">
              A confirmation link will be sent to both your current and new email
            </p>
          </div>

          <Button onClick={handleEmailChange} disabled={savingEmail || !newEmail.trim()} className="w-full gap-2" variant="outline">
            <Mail className="h-4 w-4" />
            {savingEmail ? "Sending…" : "Update Email"}
          </Button>
        </div>

        {/* Change Password */}
        <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-4 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Change Password</h2>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Current password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-secondary/30 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">New password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-secondary/30 border-border/50"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Confirm new password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-secondary/30 border-border/50"
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-destructive">Passwords don't match</p>
            )}
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="w-full gap-2"
            variant="outline"
          >
            <Lock className="h-4 w-4" />
            {savingPassword ? "Updating…" : "Update Password"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
