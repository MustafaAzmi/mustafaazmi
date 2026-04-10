import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Shield, Users, MessageCircle, Puzzle, ArrowLeft, CheckCircle,
  XCircle, Clock, Ban, Trash2, Crown, Settings, CreditCard, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  totalInteractions: number;
  totalPuzzlesSolved: number;
  pendingPayments: number;
}

interface PaymentRequest {
  id: string;
  user_id: string;
  method: string;
  amount: number;
  currency: string;
  transaction_id: string | null;
  status: string;
  created_at: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  is_vip: boolean;
  is_blocked: boolean;
  created_at: string;
}

type TabType = "stats" | "users" | "payments" | "settings";

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalInteractions: 0, totalPuzzlesSolved: 0, pendingPayments: 0 });
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; label: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) { navigate("/"); return; }
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (data) {
        setIsAdmin(true);
        fetchAll();
      }
      setChecking(false);
    });
  }, [user, loading, navigate]);

  const fetchAll = () => {
    fetchStats();
    fetchPayments();
    fetchUsers();
  };

  const fetchStats = async () => {
    const [profilesRes, interactionsRes, puzzlesRes, paymentsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("interactions").select("id", { count: "exact", head: true }),
      supabase.from("puzzle_progress").select("id", { count: "exact", head: true }),
      supabase.from("payment_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    setStats({
      totalUsers: profilesRes.count || 0,
      totalInteractions: interactionsRes.count || 0,
      totalPuzzlesSolved: puzzlesRes.count || 0,
      pendingPayments: paymentsRes.count || 0,
    });
  };

  const fetchPayments = async () => {
    const { data } = await supabase.from("payment_requests").select("*").order("created_at", { ascending: false });
    if (data) setPayments(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setUsers(data as UserProfile[]);
  };

  const updatePayment = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("payment_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Failed to update payment"); return; }
    toast.success(`Payment ${status}`);
    if (status === "approved") {
      const payment = payments.find((p) => p.id === id);
      if (payment) {
        await supabase.from("profiles").update({ is_vip: true }).eq("user_id", payment.user_id);
      }
    }
    fetchAll();
    setConfirmAction(null);
  };

  const toggleBlock = async (profile: UserProfile) => {
    const newBlocked = !profile.is_blocked;
    const { error } = await supabase.from("profiles").update({ is_blocked: newBlocked }).eq("id", profile.id);
    if (error) { toast.error("Failed to update user"); return; }
    toast.success(newBlocked ? `${profile.username} blocked` : `${profile.username} unblocked`);
    fetchUsers();
    setConfirmAction(null);
  };

  const toggleVip = async (profile: UserProfile) => {
    const { error } = await supabase.from("profiles").update({ is_vip: !profile.is_vip }).eq("id", profile.id);
    if (error) { toast.error("Failed to update VIP"); return; }
    toast.success(profile.is_vip ? `VIP removed from ${profile.username}` : `${profile.username} is now VIP`);
    fetchUsers();
  };

  const deleteUser = async (profile: UserProfile) => {
    // Delete related data then the profile
    await Promise.all([
      supabase.from("interactions").delete().eq("profile_id", profile.id),
      supabase.from("chat_messages").delete().eq("profile_id", profile.id),
      supabase.from("guesses").delete().eq("user_id", profile.user_id),
      supabase.from("puzzle_progress").delete().eq("user_id", profile.user_id),
      supabase.from("payment_requests").delete().eq("user_id", profile.user_id),
      supabase.from("user_roles").delete().eq("user_id", profile.user_id),
    ]);
    const { error } = await supabase.from("profiles").delete().eq("id", profile.id);
    if (error) { toast.error("Failed to delete user"); return; }
    toast.success(`${profile.username} deleted`);
    fetchAll();
    setConfirmAction(null);
  };

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Shield className="h-8 w-8 animate-pulse text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Shield className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have admin privileges.</p>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const STAT_CARDS = [
    { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-primary" },
    { icon: MessageCircle, label: "Total Interactions", value: stats.totalInteractions, color: "text-accent" },
    { icon: Puzzle, label: "Puzzles Solved", value: stats.totalPuzzlesSolved, color: "text-yellow-400" },
    { icon: Clock, label: "Pending Payments", value: stats.pendingPayments, color: "text-destructive" },
  ];

  const TABS: { key: TabType; label: string; icon: typeof Users }[] = [
    { key: "stats", label: "Stats", icon: Shield },
    { key: "users", label: "Users", icon: Users },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Admin Panel
              </h1>
              <p className="text-sm text-muted-foreground">Full platform control</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
              {key === "payments" && stats.pendingPayments > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 rounded-full">{stats.pendingPayments}</span>
              )}
            </button>
          ))}
        </div>

        {/* Confirm Dialog */}
        {confirmAction && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-3">
            <p className="text-sm font-medium">⚠️ Confirm: {confirmAction.label}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={() => {
                if (confirmAction.type === "delete") deleteUser(users.find(u => u.id === confirmAction.id)!);
                else if (confirmAction.type === "block") toggleBlock(users.find(u => u.id === confirmAction.id)!);
              }}>
                Confirm
              </Button>
              <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-2 gap-3">
            {STAT_CARDS.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-2">
                <Icon className={`h-5 w-5 ${color}`} />
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{users.length} users total</p>
            {users.map((u) => (
              <div key={u.id} className={`rounded-lg border bg-card/50 p-4 space-y-3 ${u.is_blocked ? "border-destructive/50 opacity-60" : "border-border/50"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{u.username}</span>
                    {u.is_vip && <Crown className="h-3.5 w-3.5 text-yellow-400" />}
                    {u.is_blocked && <Ban className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toggleVip(u)}>
                    <Crown className="h-3 w-3 mr-1" /> {u.is_vip ? "Remove VIP" : "Give VIP"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`text-xs h-7 ${u.is_blocked ? "border-green-500/50 text-green-400" : "border-destructive/50 text-destructive"}`}
                    onClick={() => u.is_blocked ? toggleBlock(u) : setConfirmAction({ type: "block", id: u.id, label: `Block ${u.username}?` })}
                  >
                    <Ban className="h-3 w-3 mr-1" /> {u.is_blocked ? "Unblock" : "Block"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs h-7"
                    onClick={() => setConfirmAction({ type: "delete", id: u.id, label: `Delete ${u.username} and all their data?` })}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payment requests yet</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.method.toUpperCase()} • {p.amount} {p.currency}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">TX: {p.transaction_id || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      p.status === "approved" ? "bg-green-500/10 text-green-400" :
                      p.status === "rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>{p.status}</span>
                  </div>
                  {p.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updatePayment(p.id, "approved")} className="bg-green-600 hover:bg-green-700 text-white flex-1">
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => updatePayment(p.id, "rejected")} className="flex-1">
                        <XCircle className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" /> Payment Methods
              </h2>
              <p className="text-sm text-muted-foreground">Configure which payment methods are available to users for VIP subscriptions.</p>

              <div className="space-y-3">
                {/* Crypto USDT */}
                <div className="rounded-lg border border-border/30 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">₮</span>
                      <div>
                        <p className="text-sm font-medium">USDT (Crypto)</p>
                        <p className="text-xs text-muted-foreground">Manual verification — user submits TX hash, admin approves</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">Active</span>
                  </div>
                </div>

                {/* Stripe */}
                <div className="rounded-lg border border-border/30 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💳</span>
                      <div>
                        <p className="text-sm font-medium">Stripe (Card)</p>
                        <p className="text-xs text-muted-foreground">Automatic checkout — connect your Stripe account to enable</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Not connected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 bg-card/50 p-5 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Puzzle className="h-4 w-4 text-primary" /> Puzzle Settings
              </h2>
              <p className="text-sm text-muted-foreground">Puzzles are randomized per visitor. Each shadow profile shows a unique puzzle order based on a combination of user ID and visitor ID.</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Total puzzles in database:</span>
                <span className="text-sm font-medium">{stats.totalPuzzlesSolved} solved</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
