import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Send, Loader2 } from "lucide-react";

interface Message {
  id: string;
  bid_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface BidChatProps {
  bidId: string;
  otherUserName: string;
}

const BidChat = ({ bidId, otherUserName }: BidChatProps) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("bid_messages" as any)
      .select("*")
      .eq("bid_id", bidId)
      .order("created_at", { ascending: true });
    setMessages((data as any as Message[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`bid_chat_${bidId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bid_messages", filter: `bid_id=eq.${bidId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bidId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from("bid_messages" as any).insert({
        bid_id: bidId,
        sender_id: user.id,
        content: newMessage.trim(),
      } as any);
      if (error) throw error;
      setNewMessage("");
    } catch (err: any) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-base flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          {t("chatWith")} {otherUserName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div
          ref={scrollRef}
          className="h-64 overflow-y-auto space-y-2 rounded-lg bg-muted/30 p-3"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t("noMessages")}
            </p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border rounded-bl-md"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        isMe ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString(
                        language === "es" ? "es-ES" : "en-US",
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t("typeMessage")}
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BidChat;
