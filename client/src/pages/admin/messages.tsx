import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  MessageSquare,
  ArrowLeft,
  Send,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
  Clock,
  User,
  Mail,
  RefreshCw,
  Search,
  Inbox,
  Check,
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import type { Contact } from "@shared/schema";

type ViewState = "list" | "detail";

function formatDate(dateStr: string | Date): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(dateStr);
  }
}

export default function AdminMessages() {
  const [viewState, setViewState] = useState<ViewState>("list");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "read" | "unread">("all");
  const [replyText, setReplyText] = useState("");
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();
  const qc = useQueryClient();

  const { data: contacts = [], isLoading, refetch, isRefetching } = useQuery<Contact[]>({
    queryKey: ["/api/contact"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/contact/${id}`, data);
      return res.json();
    },
    onSuccess: (updatedContact) => {
      qc.invalidateQueries({ queryKey: ["/api/contact"] });
      if (selectedContact) {
        setSelectedContact(updatedContact);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/contact/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/contact"] });
      toast({ title: t("msgDeletedSuccess"), description: t("msgDeletedDesc") });
      setSelectedContact(null);
      setViewState("list");
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast({ title: t("error"), description: t("msgDeleteFailed"), variant: "destructive" });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, replyText }: { id: number; replyText: string }) => {
      await apiRequest("POST", `/api/contact/${id}/respond`, { replyText });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/contact"] });
      toast({ title: t("replySent"), description: t("msgReplySentDesc") });
      setReplyText("");
      setShowReplyForm(false);
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedToSendReply"), variant: "destructive" });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async ({ id, isRead }: { id: number; isRead: boolean }) => {
      const res = await apiRequest("PATCH", `/api/contact/${id}`, { isRead });
      return res.json();
    },
    onSuccess: (updatedContact) => {
      qc.invalidateQueries({ queryKey: ["/api/contact"] });
      if (selectedContact) {
        setSelectedContact(updatedContact);
      }
    },
  });

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setViewState("detail");
    setShowReplyForm(false);
    setReplyText("");
    if (!contact.isRead) {
      markReadMutation.mutate({ id: contact.id, isRead: true });
    }
  };

  const handleEdit = () => {
    if (!selectedContact) return;
    setEditSubject(selectedContact.subject);
    setEditMessage(selectedContact.message);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedContact) return;
    updateMutation.mutate(
      { id: selectedContact.id, data: { subject: editSubject, message: editMessage } },
      {
        onSuccess: (updatedContact) => {
          setEditDialogOpen(false);
          toast({ title: t("msgUpdatedSuccess") });
          setSelectedContact(updatedContact);
        },
        onError: () => {
          toast({ title: t("error"), description: t("msgUpdateFailed"), variant: "destructive" });
        },
      }
    );
  };

  const handleSendReply = () => {
    if (!selectedContact || !replyText.trim()) return;
    respondMutation.mutate({ id: selectedContact.id, replyText: replyText.trim() });
  };

  const handleToggleRead = (contact: Contact, e?: React.MouseEvent) => {
    e?.stopPropagation();
    markReadMutation.mutate({ id: contact.id, isRead: !contact.isRead });
  };

  const filteredContacts = contacts
    .filter((c) => {
      if (filterStatus === "read") return c.isRead;
      if (filterStatus === "unread") return !c.isRead;
      return true;
    })
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime());

  const unreadCount = contacts.filter((c) => !c.isRead).length;

  if (viewState === "detail" && selectedContact) {
    return (
      <div className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewState("list");
                setSelectedContact(null);
                setShowReplyForm(false);
                setReplyText("");
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToMessages")}
            </Button>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleToggleRead(selectedContact)}>
                {selectedContact.isRead ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    {t("markAsUnread")}
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("markAsRead")}
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                {t("msgEdit")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("msgDelete")}
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{selectedContact.subject}</CardTitle>
                  {!selectedContact.isRead && <Badge variant="secondary">{t("unread")}</Badge>}
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium text-foreground">{selectedContact.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${selectedContact.email}`} className="hover:underline">
                      {selectedContact.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(selectedContact.submittedAt!)}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg text-sm leading-relaxed">
                {selectedContact.message}
              </div>
            </CardContent>
          </Card>

          {!showReplyForm ? (
            <Button onClick={() => setShowReplyForm(true)} className="w-full sm:w-auto">
              <Send className="h-4 w-4 mr-2" />
              {t("msgReplyTo")} {selectedContact.name}
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  {t("reply")} — {selectedContact.email}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder={t("writeYourReply")}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
                <div className="flex justify-end items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyText("");
                    }}
                  >
                    {t("cancel")}
                  </Button>
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || respondMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {respondMutation.isPending ? t("sending") : t("sendReply")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("msgEditMessage")}</DialogTitle>
                <DialogDescription>{t("msgEditDesc")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("subject")}</label>
                  <Input value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("message")}</label>
                  <Textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? t("saving") : t("saveChanges")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("msgConfirmDelete")}</AlertDialogTitle>
                <AlertDialogDescription>{t("msgConfirmDeleteDesc")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate(selectedContact.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? t("deleting") : t("msgDelete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                <MessageSquare className="h-8 w-8" />
                {t("contactMessages")}
              </h1>
              <p className="text-muted-foreground">{t("msgPageSubtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-sm">
                {unreadCount} {t("unread")}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("msgSearchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "unread", "read"] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === "all" ? t("msgAll") : status === "unread" ? t("unread") : t("read")}
              </Button>
            ))}
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
            ) : filteredContacts.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">
                  {searchQuery || filterStatus !== "all" ? t("noMessagesMatch") : t("msgNoMessages")}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || filterStatus !== "all"
                    ? t("msgTryDifferentFilter")
                    : t("msgNoMessagesDesc")}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full p-4 text-left hover:bg-muted/50 transition-colors flex items-start gap-4 cursor-pointer ${
                      !contact.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${
                        !contact.isRead ? "bg-primary" : "bg-muted-foreground"
                      }`}
                    >
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-medium truncate ${
                            !contact.isRead ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {contact.name}
                        </span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(contact.submittedAt!)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${!contact.isRead ? "font-medium" : ""}`}>
                        {contact.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {contact.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!contact.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContact(contact);
                          setDeleteDialogOpen(true);
                        }}
                        title={t("msgDelete")}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("msgConfirmDelete")}</AlertDialogTitle>
              <AlertDialogDescription>{t("msgConfirmDeleteDesc")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedContact) deleteMutation.mutate(selectedContact.id);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? t("deleting") : t("msgDelete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
