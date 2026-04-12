import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, X, Eye, Crown, Lock } from "lucide-react";

interface ChatMessage {
  id: string;
  sender_type: string;
  message: string;
  created_at: string;
}

interface ChatBoxProps {
  profileId: string;
  anonymousId: string;
  senderType: "owner" | "visitor";
  isVip?: boolean;
  onClose?: () => void;
}

const FREE_MESSAGE_LIMIT = 3;

const ChatBox = ({ profileId, anonymousId, senderType, isVip = false, onClose }: ChatBoxProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const myMessageCount = messages.filter((m) => m.sender_type === senderType).length;
  const isLimited = !isVip && myMessageCount >= FREE_MESSAGE_LIMIT;

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, sender_type, message, created_at")
        .eq("profile_id", profileId)
        .eq("anonymous_id", anonymousId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${profileId}-${anonymousId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `profile_id=eq.${profileId}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        if (newMsg.anonymous_id === anonymousId) {
          setMessages((prev) => [...prev, {
            id: newMsg.id,
            sender_type: newMsg.sender_type,
            message: newMsg.message,
            created_at: newMsg.created_at,
          }]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileId, anonymousId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending || isLimited) return;
    setSending(true);

    const { error } = await supabase.from("chat_messages").insert({
      profile_id: profileId,
      anonymous_id: anonymousId,
      sender_type: senderType,
      message: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const remainingMessages = Math.max(0, FREE_MESSAGE_LIMIT - myMessageCount);

  return (
    <div className="rounded-lg border border-primary/20 bg-card/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-primary/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {senderType === "owner" ? `Chat with ${anonymousId}` : "Anonymous Chat"}
          </span>
          {!isVip && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {remainingMessages}/{FREE_MESSAGE_LIMIT} left
            </span>
          )}
          {isVip && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-mystery-warm/20 text-mystery-warm font-medium">
              VIP ∞
            </span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-60 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
            <Eye className="h-6 w-6 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No messages yet… start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_type === senderType;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <p>{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input or VIP CTA */}
      {isLimited ? (
        <div className="p-4 border-t border-border/50 text-center space-y-3 bg-mystery-warm/5">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-mystery-warm">
            <Lock className="h-4 w-4" />
            <span>Message limit reached</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Upgrade to VIP for unlimited messaging for a full month
          </p>
          {senderType === "owner" && (
            <Button
              size="sm"
              onClick={() => navigate("/vip")}
              className="bg-mystery-warm hover:bg-mystery-warm/90 text-primary-foreground"
            >
              <Crown className="h-4 w-4 mr-1" />
              Unlock VIP
            </Button>
          )}
        </div>
      ) : (
        <div className="flex gap-2 p-3 border-t border-border/50">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="text-sm bg-secondary/50 border-border/50"
          />
          <Button size="sm" onClick={handleSend} disabled={!newMessage.trim() || sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
