import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Mail, 
  RefreshCw, 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Inbox,
  Clock,
  User,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import DOMPurify from "dompurify";

interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  isRead: boolean;
  labels: string[];
}

function extractSenderName(from: string): string {
  const match = from.match(/^([^<]+)</);
  if (match) {
    return match[1].trim().replace(/"/g, '');
  }
  return from.split('@')[0];
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function AdminEmails() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading, refetch, isRefetching, error, isError } = useQuery<Email[]>({
    queryKey: ["/api/admin/emails"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (emailId: string) => {
      await apiRequest("POST", `/api/admin/emails/${emailId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/emails"] });
    }
  });

  const generateResponseMutation = useMutation({
    mutationFn: async (emailId: string) => {
      const res = await apiRequest("POST", `/api/admin/emails/${emailId}/generate-response`);
      return res.json();
    },
    onSuccess: (data) => {
      setReplyText(data.response);
      toast({
        title: "AI Response Generated",
        description: "Review and edit the response before sending."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate response",
        variant: "destructive"
      });
    }
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ emailId, replyText }: { emailId: string; replyText: string }) => {
      await apiRequest("POST", `/api/admin/emails/${emailId}/reply`, { replyText });
    },
    onSuccess: () => {
      toast({
        title: "Reply Sent",
        description: "Your email has been sent successfully."
      });
      setReplyText("");
      setSelectedEmail(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/emails"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive"
      });
    }
  });

  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    setReplyText("");
    if (!email.isRead) {
      markAsReadMutation.mutate(email.id);
    }
  };

  const handleGenerateResponse = async () => {
    if (!selectedEmail) return;
    setIsGenerating(true);
    try {
      await generateResponseMutation.mutateAsync(selectedEmail.id);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedEmail || !replyText.trim()) return;
    sendReplyMutation.mutate({ emailId: selectedEmail.id, replyText });
  };

  const unreadCount = emails.filter(e => !e.isRead).length;

  if (selectedEmail) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inbox
            </Button>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{selectedEmail.subject || "(No Subject)"}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{selectedEmail.from}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(selectedEmail.date)}</span>
                  </div>
                </div>
                {!selectedEmail.isRead && (
                  <Badge variant="secondary">Unread</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <div 
                  className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg text-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(
                      selectedEmail.body.includes('<') 
                        ? selectedEmail.body 
                        : selectedEmail.body.replace(/\n/g, '<br/>')
                    )
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5" />
                Reply
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Write your reply here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={handleGenerateResponse}
                  disabled={isGenerating || generateResponseMutation.isPending}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "Generate AI Response"}
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sendReplyMutation.isPending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendReplyMutation.isPending ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Inbox className="h-8 w-8" />
                Email Inbox
              </h1>
              <p className="text-muted-foreground">
                Manage emails from earmuffsgemach@gmail.com
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-sm">
                {unreadCount} unread
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <h3 className="text-lg font-medium">Failed to load emails</h3>
                <p className="text-muted-foreground mb-4">
                  {(error as any)?.message || "Could not connect to Gmail. Please check your configuration."}
                </p>
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No emails found</h3>
                <p className="text-muted-foreground">Your inbox is empty or Gmail is not connected.</p>
              </div>
            ) : (
              <div className="divide-y">
                {emails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-4 ${
                      !email.isRead ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      !email.isRead ? 'bg-primary' : 'bg-muted-foreground'
                    }`}>
                      {extractSenderName(email.from).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`font-medium truncate ${!email.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {extractSenderName(email.from)}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(email.date)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${!email.isRead ? 'font-medium' : ''}`}>
                        {email.subject || "(No Subject)"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {email.snippet}
                      </p>
                    </div>
                    {!email.isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
