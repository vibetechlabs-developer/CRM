import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/api/notifications/");
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
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>By {n.changed_by_name || n.changed_by_username || "Unknown Agent"}</span>
                      {!n.is_read && <Badge variant="secondary" className="px-2 py-0">New</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

