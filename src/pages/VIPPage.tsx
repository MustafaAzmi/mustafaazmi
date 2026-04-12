import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Sparkles, Shield, MessageCircle, Zap, ArrowLeft, Check, Copy } from "lucide-react";
import { toast } from "sonner";

const VIP_FEATURES = [
  { icon: MessageCircle, label: "Ask directly", desc: "Unlock free text messaging with anonymous visitors" },
  { icon: Shield, label: "Advanced hints", desc: "Deeper behavioral analysis of your shadow profiles" },
  { icon: Sparkles, label: "Profile boost", desc: "Enhanced profile styling that attracts more engagement" },
  { icon: Zap, label: "Priority puzzles", desc: "Exclusive hard puzzles with powerful reveals" },
];

const VIPPage = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [txId, setTxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [cryptoNetwork, setCryptoNetwork] = useState("");
  const [vipPrice, setVipPrice] = useState("9.99");
  const [vipCurrency, setVipCurrency] = useState("USD");
  const [stripeEnabled, setStripeEnabled] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      navigate("/");
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    // Fetch platform settings
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("platform_settings")
        .select("key, value");
      if (data) {
        const settings: Record<string, string> = {};
        data.forEach((s: any) => { settings[s.key] = s.value; });
        setWalletAddress(settings.crypto_wallet_address || "");
        setCryptoNetwork(settings.crypto_network || "TRC-20 / ERC-20");
        setVipPrice(settings.vip_price || "9.99");
        setVipCurrency(settings.vip_currency || "USD");
        setStripeEnabled(settings.stripe_enabled === "true");
      }
    };
    fetchSettings();
  }, []);

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Crown className="h-8 w-8 animate-pulse-slow text-mystery-warm" />
      </div>
    );
  }

  const handleCryptoSubmit = async () => {
    if (!txId.trim()) {
      toast.error("Please enter a transaction ID");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("payment_requests").insert({
      user_id: user.id,
      method: "crypto",
      amount: parseFloat(vipPrice),
      currency: "USDT",
      transaction_id: txId.trim(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit. Try again.");
    } else {
      toast.success("Payment submitted! We'll verify and activate VIP within 24h.");
      setTxId("");
    }
  };

  const handleStripeCheckout = () => {
    if (!stripeEnabled) {
      toast.info("Card payments are not available yet. Use crypto for now.");
      return;
    }
    toast.info("Stripe checkout coming soon!");
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Wallet address copied!");
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </button>

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-mystery-warm/10 flex items-center justify-center border border-mystery-warm/30">
            <Crown className="h-8 w-8 text-mystery-warm" />
          </div>
          <h1 className="text-3xl font-bold">Unlock <span className="text-mystery-warm">VIP</span></h1>
          <p className="text-muted-foreground">Break through the mystery. Get closer to the truth.</p>
        </div>

        {/* Features */}
        <div className="space-y-3">
          {VIP_FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/50 p-4">
              <div className="rounded-full bg-mystery-warm/10 p-2 mt-0.5">
                <Icon className="h-4 w-4 text-mystery-warm" />
              </div>
              <div>
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Check className="h-4 w-4 text-mystery-warm ml-auto mt-1" />
            </div>
          ))}
        </div>

        {/* Price */}
        <div className="text-center space-y-1">
          <p className="text-4xl font-bold text-mystery-warm">${vipPrice}</p>
          <p className="text-sm text-muted-foreground">per month • unlimited messaging & features</p>
        </div>

        {/* Stripe */}
        <Button
          onClick={handleStripeCheckout}
          className={`w-full h-12 text-primary-foreground border-glow ${stripeEnabled ? 'bg-primary hover:bg-primary/90' : 'bg-muted text-muted-foreground'}`}
          disabled={!stripeEnabled}
        >
          <Zap className="mr-2 h-4 w-4" />
          {stripeEnabled ? "Pay with Card" : "Pay with Card (Not Available)"}
        </Button>

        {/* Crypto */}
        {walletAddress && (
          <div className="space-y-4 rounded-lg border border-border/50 bg-card/50 p-5">
            <div className="text-center space-y-1">
              <p className="font-medium text-sm">Pay with USDT ({cryptoNetwork})</p>
              <p className="text-xs text-muted-foreground">Send exactly ${vipPrice} USDT to:</p>
            </div>

            <button
              onClick={copyWallet}
              className="w-full flex items-center gap-2 rounded-lg border border-border/30 bg-secondary/50 p-3 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span className="truncate flex-1 text-left">{walletAddress}</span>
              <Copy className="h-3 w-3 shrink-0 group-hover:text-primary" />
            </button>

            <div className="space-y-2">
              <Input
                value={txId}
                onChange={(e) => setTxId(e.target.value)}
                placeholder="Paste your transaction ID…"
                className="bg-secondary/30 border-border/30 text-sm font-mono"
              />
              <Button
                onClick={handleCryptoSubmit}
                disabled={submitting || !txId.trim()}
                className="w-full bg-mystery-warm hover:bg-mystery-warm/90 text-primary-foreground"
              >
                {submitting ? "Submitting…" : "Submit Payment"}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Payments are verified manually within 24 hours
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VIPPage;
