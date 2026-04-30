import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Mail,
  MessageSquare,
  RefreshCw,
  Send,
  Loader2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const BROKEN_LINK = "https://babybanzgemach.com/apply";
const CORRECT_LINK = "https://earmuffsgemach.com/apply";

const DEFAULT_MESSAGE = `Hi,

I'm reaching out to correct a link I sent you recently. In my previous message I included a link that isn't working:

  ${BROKEN_LINK}

The correct link to apply is:

  ${CORRECT_LINK}

Sorry for any confusion — please use the link above instead. Feel free to reply if you have any questions!

— Baby Banz Gemach`;

type GmailCandidate = {
  type: "gmail";
  threadId: string;
  messageId: string;
  name: string;
  email: string;
  subject: string;
  date: string;
  snippet: string;
};

type FormCandidate = {
  type: "form";
  contactId: number;
  name: string;
  email: string;
  subject: string;
  date: string;
  snippet: string;
};

type Candidate = GmailCandidate | FormCandidate;

type SendStatus = "pending" | "sending" | "success" | "error";

interface RecipientResult {
  candidate: Candidate;
  status: SendStatus;
  error?: string;
}

function candidateKey(c: Candidate): string {
  return c.type === "gmail" ? `gmail::${c.threadId}` : `form::${c.contactId}`;
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function MassCorrection() {
  const { toast } = useToast();
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [results, setResults] = useState<RecipientResult[] | null>(null);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);

  const candidatesQuery = useQuery<{ candidates: Candidate[]; warnings: string[] }>({
    queryKey: ["/api/admin/emails/sent-correction-candidates"],
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const candidates = candidatesQuery.data?.candidates ?? [];
  const warnings = candidatesQuery.data?.warnings ?? [];

  useEffect(() => {
    if (candidates.length > 0) {
      setCheckedKeys(new Set(candidates.map(candidateKey)));
    }
  }, [candidates.length]);

  function toggleAll(checked: boolean) {
    if (checked) {
      setCheckedKeys(new Set(candidates.map(candidateKey)));
    } else {
      setCheckedKeys(new Set());
    }
  }

  function toggleOne(key: string) {
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const selectedCandidates = candidates.filter((c) => checkedKeys.has(candidateKey(c)));
  const selectedCount = selectedCandidates.length;

  async function startSending() {
    if (sendingRef.current) return;
    sendingRef.current = true;
    setIsSending(true);
    setConfirmOpen(false);

    const initial: RecipientResult[] = selectedCandidates.map((c) => ({
      candidate: c,
      status: "pending",
    }));
    setResults(initial);

    const updated = [...initial];

    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: "sending" };
      setResults([...updated]);

      const c = updated[i].candidate;
      try {
        const recipient: Record<string, unknown> = {
          type: c.type,
          email: c.email,
          subject: c.subject,
          name: c.name,
        };
        if (c.type === "gmail") {
          recipient.threadId = c.threadId;
          recipient.messageId = c.messageId;
        } else {
          recipient.contactId = c.contactId;
        }
        const resp = await apiRequest("POST", "/api/admin/emails/send-mass-correction", {
          recipients: [recipient],
          message,
        });
        const data = await resp.json().catch(() => ({ results: [] }));
        if (!resp.ok) {
          throw new Error(data.message || `HTTP ${resp.status}`);
        }
        const singleResult = (data.results as Array<{ success: boolean; error?: string }>)[0];
        if (!singleResult?.success) {
          throw new Error(singleResult?.error || "Send failed");
        }
        updated[i] = { ...updated[i], status: "success" };
      } catch (e: unknown) {
        updated[i] = {
          ...updated[i],
          status: "error",
          error: e instanceof Error ? e.message : String(e),
        };
      }
      setResults([...updated]);
    }

    const ok = updated.filter((r) => r.status === "success").length;
    const fail = updated.filter((r) => r.status === "error").length;
    toast({
      title: fail === 0 ? "All corrections sent!" : `${ok} sent, ${fail} failed`,
      description: fail > 0 ? "Check the results below for details." : undefined,
      variant: fail > 0 ? "destructive" : "default",
    });

    sendingRef.current = false;
    setIsSending(false);
  }

  const sendDone = results !== null && !isSending;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">Temporary one-off admin tool</p>
          <p>
            This page was built to send a single correction email to everyone who received a reply
            containing the broken link{" "}
            <code className="bg-amber-100 px-1 rounded text-xs">{BROKEN_LINK}</code> in the last
            7 days. Once done, this page can be removed from the codebase.
          </p>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-destructive">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="text-sm space-y-1">
            <p className="font-semibold">Partial results — proceed with caution</p>
            {warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-base">Affected Recipients</CardTitle>
          {!candidatesQuery.isLoading && !candidatesQuery.isError && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => candidatesQuery.refetch()}
              disabled={candidatesQuery.isFetching || isSending}
            >
              <RefreshCw
                className={`h-4 w-4 mr-1.5 ${candidatesQuery.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {candidatesQuery.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md" />
              ))}
            </div>
          )}

          {candidatesQuery.isError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>
                Failed to load candidates:{" "}
                {(candidatesQuery.error as Error)?.message ?? "Unknown error"}
              </span>
            </div>
          )}

          {!candidatesQuery.isLoading && !candidatesQuery.isError && candidates.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-6">
              No affected recipients found in the last 7 days.
            </div>
          )}

          {candidates.length > 0 && (
            <>
              <div className="flex items-center gap-2 pb-1 border-b text-sm text-muted-foreground">
                <Checkbox
                  id="toggle-all"
                  checked={selectedCount === candidates.length && candidates.length > 0}
                  onCheckedChange={(v) => toggleAll(!!v)}
                  disabled={isSending}
                />
                <label htmlFor="toggle-all" className="cursor-pointer select-none">
                  {selectedCount === candidates.length
                    ? `Deselect all (${candidates.length})`
                    : `Select all (${candidates.length})`}
                </label>
              </div>

              <div className="space-y-2">
                {candidates.map((c) => {
                  const key = candidateKey(c);
                  const result = results?.find((r) => candidateKey(r.candidate) === key);
                  return (
                    <label
                      key={key}
                      className="flex items-start gap-3 rounded-md border px-3 py-2.5 hover:bg-muted/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={checkedKeys.has(key)}
                        onCheckedChange={() => toggleOne(key)}
                        disabled={isSending || sendDone}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{c.name || c.email}</span>
                          <span className="text-xs text-muted-foreground truncate">{c.email}</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                            {c.type === "gmail" ? (
                              <>
                                <Mail className="h-3 w-3 mr-1" />
                                Gmail
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Form
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto shrink-0">
                            {formatDate(c.date)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {c.subject}
                        </p>
                        {result?.status === "error" && result.error && (
                          <p className="text-xs text-destructive mt-0.5 truncate">{result.error}</p>
                        )}
                      </div>
                      <div className="shrink-0 mt-0.5">
                        {result?.status === "sending" && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {result?.status === "success" && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {result?.status === "error" && (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Correction Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={14}
            className="font-mono text-sm resize-y"
            disabled={isSending || sendDone}
          />
          <p className="text-xs text-muted-foreground">
            This message will be sent to every checked recipient above. Gmail threads will receive
            it as a thread reply; contact-form entries will receive a new email to the address they
            used when they wrote in.
          </p>
        </CardContent>
      </Card>

      {!sendDone && (
        <div className="flex justify-end">
          <Button
            disabled={selectedCount === 0 || isSending || candidates.length === 0}
            onClick={() => setConfirmOpen(true)}
            className="gap-2"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {isSending
              ? `Sending… (${results?.filter((r) => r.status === "success" || r.status === "error").length ?? 0} / ${selectedCount})`
              : `Send Corrections to ${selectedCount} Recipient${selectedCount !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}

      {sendDone && results && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Send Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {r.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span className="font-medium">{r.candidate.name || r.candidate.email}</span>
                <span className="text-muted-foreground text-xs">{r.candidate.email}</span>
                {r.status === "error" && r.error && (
                  <span className="text-destructive text-xs ml-auto truncate">{r.error}</span>
                )}
              </div>
            ))}
            <div className="pt-2 border-t text-sm text-muted-foreground">
              {results.filter((r) => r.status === "success").length} of {results.length} sent
              successfully.
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send correction emails?</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the correction message to{" "}
              <strong>
                {selectedCount} recipient{selectedCount !== 1 ? "s" : ""}
              </strong>
              . Gmail threads will get a proper thread reply. Contact form entries will get a new
              email. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={startSending}>Yes, send corrections</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
