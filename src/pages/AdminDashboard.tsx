import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, Users, MessageCircle, Puzzle, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
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

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalInteractions: 0, totalPuzzlesSolved: 0, pendingPayments: 0 });
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"stats" | "payments">("stats");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
      return;
    }
    if (!user) return;

    // Check admin role
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      if (data) {
        setIsAdmin(true);
        fetchStats();
        fetchPayments();
      }
      setChecking(false);
    });
  }, [user, loading, navigate]);

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
    const { data } = await supabase
      .from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPayments(data);
  };

  const updatePayment = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("payment_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update payment");
    } else {
      toast.success(`Payment ${status}`);
      if (status === "approved") {
        const payment = payments.find((p) => p.id === id);
        if (payment) {
          // Activate VIP for user
          await supabase
            .from("profiles")
            .update({ is_vip: true })
            .eq("user_id", payment.user_id);
        }
      }
      fetchPayments();
      fetchStats();
    }
  };

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Shield className="h-8 w-8 animate-pulse-slow text-primary" />
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
    { icon: Puzzle, label: "Puzzles Solved", value: stats.totalPuzzlesSolved, color: "text-mystery-warm" },
    { icon: Clock, label: "Pending Payments", value: stats.pendingPayments, color: "text-destructive" },
  ];

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground">Platform overview & management</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["stats", "payments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "stats" ? "Statistics" : `Payments ${stats.pendingPayments > 0 ? `(${stats.pendingPayments})` : ""}`}
            </button>
          ))}
        </div>

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

        {activeTab === "payments" && (
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payment requests yet</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {p.method.toUpperCase()} • {p.amount} {p.currency}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        TX: {p.transaction_id || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      p.status === "approved" ? "bg-green-500/10 text-green-400" :
                      p.status === "rejected" ? "bg-destructive/10 text-destructive" :
                      "bg-mystery-warm/10 text-mystery-warm"
                    }`}>
                      {p.status}
                    </span>
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
      </div>
    </div>
  );
};

export default AdminDashboard;
