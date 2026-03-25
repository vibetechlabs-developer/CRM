import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getPriorityDisplay, getStatusDisplay, getTypeDisplay } from "@/lib/data";

export default function Notifications() {
  const queryClient = useQueryClient();

  const [dateFilterMode, setDateFilterMode] = useState<"all" | "today" | "yesterday" | "custom">("all");
  const [customDate, setCustomDate] = useState<string>("");

  function toDateInputValue(date: Date) {
    // Convert to YYYY-MM-DD in local time (avoid timezone offset issues).
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }

  function getEffectiveDate(): string | undefined {
    if (dateFilterMode === "today") return toDateInputValue(new Date());
    if (dateFilterMode === "yesterday") return toDateInputValue(new Date(Date.now() - 24 * 60 * 60 * 1000));
    if (dateFilterMode === "custom") return customDate || undefined;
    return undefined;
  }

  const effectiveDate = getEffectiveDate();

  function parseDetails(details: any) {
    const result = { headers: [] as string[], rows: [] as { key: string; value: string }[] };
    if (!details) return result;

    if (typeof details === "string") {
      const lines = details.split("\n");
      lines.forEach((line) => {
        if (!line.trim()) return;

        if (line.trim().startsWith("[") && line.trim().endsWith("]")) {
          result.headers.push(line.trim());
          return;
        }

        const separatorIdx = line.indexOf(":");
        if (separatorIdx !== -1) {
          const key = line.slice(0, separatorIdx).trim();
          const value = line.slice(separatorIdx + 1).trim();

          const formattedKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          result.rows.push({ key: formattedKey, value });
        } else {
          result.rows.push({ key: "", value: line });
        }
      });
    } else if (typeof details === "object") {
      for (const [key, value] of Object.entries(details)) {
        result.rows.push({ key, value: String(value) });
      }
    }

    return result;
  }

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", effectiveDate],
    queryFn: async () => {
      const params = effectiveDate ? { created_at__date: effectiveDate } : undefined;
      const res = await api.get("/api/notifications/", { params });
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    },
    refetchInterval: 5000,
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.post("/api/notifications/mark_all_read/");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;
  const totalCount = notifications.length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount} unread update{unreadCount === 1 ? "" : "s"} . {totalCount} total notification{totalCount === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={unreadCount === 0 || markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          <Check className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      {/* Date filter */}
      <div className="flex flex-col gap-3 bg-card p-3 rounded-xl border shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant={dateFilterMode === "all" ? "default" : "outline"}
            className="h-9"
            onClick={() => {
              setDateFilterMode("all");
            }}
          >
            All dates
          </Button>
          <Button
            variant={dateFilterMode === "today" ? "default" : "outline"}
            className="h-9"
            onClick={() => setDateFilterMode("today")}
          >
            Today
          </Button>
          <Button
            variant={dateFilterMode === "yesterday" ? "default" : "outline"}
            className="h-9"
            onClick={() => setDateFilterMode("yesterday")}
          >
            Yesterday
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={dateFilterMode === "custom" ? "default" : "outline"}
            className="h-9"
            onClick={() => setDateFilterMode("custom")}
          >
            Select date
          </Button>
          <Input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              if (dateFilterMode !== "custom") setDateFilterMode("custom");
            }}
            disabled={dateFilterMode !== "custom"}
            className="h-9 w-44"
          />
        </div>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <div className="divide-y">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Spinner size="sm" />
              <span>Loading…</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No notifications yet.</div>
          ) : (
            notifications.map((n: any) => (
              <div key={n.id} className={`p-4 ${n.is_read ? "bg-background" : "bg-primary/5"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm ${n.is_read ? "text-foreground" : "font-semibold text-foreground"}`}>
                      {n.message}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>By {n.changed_by_name || n.changed_by_username || "Unknown Agent"}</span>
                      {!n.is_read && <Badge variant="secondary" className="px-2 py-0">New</Badge>}
                      {n.ticket_type && (
                        <Badge variant="outline" className="px-2 py-0">
                          {String(getTypeDisplay(n.ticket_type))}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>

                    {(n.ticket_no || n.client_name || n.insurance_type || n.ticket_status) && (
                      <div className="mt-3 text-xs text-muted-foreground space-y-1">
                        <div>
                          {n.ticket_no ? <span className="font-medium text-foreground">Ticket #{n.ticket_no}</span> : null}
                          {n.client_name ? <span> • {n.client_name}</span> : null}
                        </div>
                        {n.insurance_type ? (
                          <div>
                            Insurance: <span className="text-foreground">{n.insurance_type}</span>
                          </div>
                        ) : null}
                        {n.ticket_status ? (
                          <div>
                            Status: <span className="text-foreground">{String(getStatusDisplay(n.ticket_status))}</span>
                          </div>
                        ) : null}
                        {n.ticket_priority ? (
                          <div>
                            Priority: <span className="text-foreground">{String(getPriorityDisplay(n.ticket_priority))}</span>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {(n.ticket_details || n.ticket_additional_notes) && (
                  <div className="mt-3">
                    <Accordion type="single" collapsible>
                      <AccordionItem value={`details-${n.id}`}>
                        <AccordionTrigger className="text-sm">View ticket details</AccordionTrigger>
                        <AccordionContent>
                          {(() => {
                            const parsed = parseDetails(n.ticket_details);
                            const hasRows = parsed.rows && parsed.rows.length > 0;
                            return (
                              <div className="space-y-3">
                                {n.ticket_additional_notes ? (
                                  <div className="text-sm text-foreground whitespace-pre-wrap">{n.ticket_additional_notes}</div>
                                ) : null}
                                {hasRows ? (
                                  <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                      <tbody className="divide-y divide-border">
                                        {parsed.headers.map((h: string, i: number) => (
                                          <tr key={`h-${i}`} className="bg-muted/30">
                                            <td colSpan={2} className="px-3 py-2 font-semibold text-primary text-center">
                                              {h}
                                            </td>
                                          </tr>
                                        ))}
                                        {parsed.rows.map((row: any, i: number) => (
                                          <tr key={`r-${i}`} className="bg-card">
                                            {row.key ? (
                                              <>
                                                <th className="px-3 py-2 font-medium bg-muted/50 w-1/3 text-muted-foreground align-top break-words">
                                                  {row.key}
                                                </th>
                                                <td className="px-3 py-2 whitespace-pre-wrap break-words">{row.value}</td>
                                              </>
                                            ) : (
                                              <td colSpan={2} className="px-3 py-2 whitespace-pre-wrap break-words text-center text-muted-foreground">
                                                {row.value}
                                              </td>
                                            )}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">No structured ticket details found.</div>
                                )}
                              </div>
                            );
                          })()}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

