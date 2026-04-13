import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pipelineStages, formatBackendTicket, type BackendTicket } from "@/lib/data";
import { FileText, Users, CheckCircle, AlertTriangle, TrendingUp, Clock, BarChart3, PieChart, ArrowUpRight, CalendarClock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartPie, Pie, Cell, LineChart, Line } from "recharts";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { isFiniteNumber } from "@/lib/normalize";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { motion, type Variants } from "framer-motion";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 350, damping: 25 } }
};

const ChartFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="flex flex-col items-center justify-center p-6 h-[250px] bg-secondary/20 rounded-xl border border-dashed border-destructive/30">
    <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
    <p className="text-sm font-medium text-destructive">Failed to load chart</p>
    <p className="text-xs text-muted-foreground mt-1 text-center truncate w-full max-w-[200px]" title={error.message}>{error.message}</p>
    <Button variant="outline" size="sm" onClick={resetErrorBoundary} className="mt-4">Retry</Button>
  </div>
);

const RADIAN = Math.PI / 180;
const renderPiePercentLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (!percent || percent <= 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

const PipelineTooltipContent = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload as { name?: string; count?: number } | undefined;
  return (
    <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{row?.name ?? "-"}</p>
      <p className="text-muted-foreground mt-0.5">{Number(row?.count ?? 0)}</p>
    </div>
  );
};

type DiscardReminder = {
  id: number;
  ticket_no: string;
  client_name: string;
  discarded_at: string | null;
};

function canUseDiscardReminders(role: string | undefined) {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" || r === "AGENT" || r === "MANAGER";
}

const Dashboard = () => {
  const { user, isLoggedIn } = useAuth();
  const [markAllOpen, setMarkAllOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: statsData, isLoading: isLoadingStats, isError: statsError } = useQuery({
      queryKey: ["tickets-stats", user?.id ?? "pending"],
      queryFn: async () => {
          const res = await api.get("/api/tickets/stats/");
          return res.data;
      },
      enabled: isLoggedIn,
  });

  const dismissRemindersMutation = useMutation({
    mutationFn: async (body: { ticket_ids?: number[] }) => {
      await api.post("/api/tickets/dismiss-discard-reminders/", body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["tickets-stats"] });
      void queryClient.invalidateQueries({ queryKey: ["tickets", "discarded"] });
    },
  });

  const {

    activeTickets,
    todayLabel,
    stats,
    pipelineData,
    typeData,
    priorityData,
    monthlyTrend,
    typeMonthlyTrend,
    recentTickets,
    completionRate,
    totalTickets
  } = useDashboardStats(statsData);

  const typeTotal = useMemo(
    () => typeData.reduce((sum, item) => sum + (Number(item.value) || 0), 0),
    [typeData]
  );

  const rawStats = statsData as
    | {
        discardReopenReminders?: DiscardReminder[];
        discardReopenReminderCount?: number;
      }
    | undefined;
  const discardReminders: DiscardReminder[] = Array.isArray(rawStats?.discardReopenReminders)
    ? rawStats.discardReopenReminders
    : [];
  const discardReminderTotal =
    typeof rawStats?.discardReopenReminderCount === "number"
      ? rawStats.discardReopenReminderCount
      : discardReminders.length;
  const showReminderBanner = discardReminderTotal > 0 || discardReminders.length > 0;
  const canDismissReminders = canUseDiscardReminders(user?.role);
  const discardReminderMore = Math.max(0, discardReminderTotal - discardReminders.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Overview of your insurance management system</p>
        </div>
        <div className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border">
          {todayLabel}
        </div>
      </div>

      {isLoadingStats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border shadow-sm h-full rounded-xl">
                <CardContent className="p-5 flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-32 mt-2" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[260px] w-full rounded-xl" />
            <Skeleton className="h-[260px] w-full rounded-xl" />
            <Skeleton className="h-[260px] w-full rounded-xl" />
          </div>
        </div>
      ) : (
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {statsError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm text-destructive">
            Could not load dashboard stats (check that the API is running and you are logged in). Reminder counts may be missing.
          </CardContent>
        </Card>
      ) : null}
      {canDismissReminders ? (
        <motion.div variants={itemVariants}>
          <Card
            className={
              showReminderBanner
                ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
                : "border-dashed border-muted-foreground/25 bg-muted/20 shadow-sm"
            }
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0" />
                Discard re-approach reminders
              </CardTitle>
              <CardDescription>
                {showReminderBanner
                  ? `${discardReminderTotal} lead${discardReminderTotal === 1 ? "" : "s"} discarded about a year ago — consider following up again.`
                  : "No leads are in the one-year follow-up window for your account right now, or you already marked them as seen."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              {showReminderBanner ? (
                <>
                  <div className="max-h-60 overflow-y-auto rounded-md border border-amber-500/20 bg-background/80 px-2">
                    <ul className="list-none py-2 space-y-2">
                      {discardReminders.map((r) => (
                        <li key={r.id} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div className="min-w-0 text-sm">
                            <span className="font-medium text-foreground">{r.client_name}</span>
                            <span className="text-muted-foreground"> · {r.ticket_no}</span>
                            {r.discarded_at ? (
                              <span className="text-muted-foreground">
                                {" "}
                                (discarded {new Date(r.discarded_at).toLocaleDateString()})
                              </span>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 shrink-0 self-start text-xs"
                            disabled={dismissRemindersMutation.isPending}
                            onClick={() => dismissRemindersMutation.mutate({ ticket_ids: [r.id] })}
                          >
                            Mark as seen
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use <span className="font-medium text-foreground">Mark as seen</span> on each row to hide one lead at a time.{" "}
                    <span className="font-medium text-foreground">Mark all as seen</span> clears every reminder in your list at once.
                  </p>
                  {discardReminderMore > 0 ? (
                    <p className="text-xs">
                      Showing first {discardReminders.length} here.{" "}
                      <Link to="/discarded-leads?reopenReminder=1" className="font-medium text-foreground underline-offset-4 hover:underline">
                        Open full list
                      </Link>{" "}
                      (paginated table).
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <AlertDialog open={markAllOpen} onOpenChange={setMarkAllOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={dismissRemindersMutation.isPending}
                        >
                          Mark all as seen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Mark all reminders as seen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will hide every lead in the re-approach list for you (not just the ones on screen). To do them one by one, use{" "}
                            <span className="font-medium text-foreground">Mark as seen</span> on each row instead.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              dismissRemindersMutation.mutate({});
                              setMarkAllOpen(false);
                            }}
                          >
                            Mark all
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/discarded-leads?reopenReminder=1">Open in Discarded Leads</Link>
                    </Button>
                  </div>
                  <p className="text-xs">
                    “Seen” only hides this reminder for you; the ticket stays discarded until you change its status.
                  </p>
                </>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm max-w-xl">
                    Use <span className="font-medium text-foreground">Discarded Leads</span> anytime. The filtered view shows only tickets in this reminder window.
                  </p>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/discarded-leads?reopenReminder=1">Reminders only</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/discarded-leads">All discarded</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : null}
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card className="border shadow-sm hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1.5">{stat.value}</p>
                  <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${stat.positive ? "text-success" : "text-destructive"}`}>
                    <ArrowUpRight className={`h-3 w-3 ${!stat.positive && "rotate-180"}`} />
                    {stat.change} this month
                  </div>
                </div>
                <div className={`${stat.bg} p-3 rounded-xl`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
        <ErrorBoundary FallbackComponent={ChartFallback}>
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Monthly Ticket Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214,20%,90%)", fontSize: 12 }} />
                <Line type="monotone" dataKey="tickets" stroke="hsl(220, 70%, 50%)" strokeWidth={2.5} dot={{ fill: "hsl(220, 70%, 50%)", r: 4 }} name="New Tickets" />
                <Line type="monotone" dataKey="completed" stroke="hsl(152, 55%, 45%)" strokeWidth={2.5} dot={{ fill: "hsl(152, 55%, 45%)", r: 4 }} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        </ErrorBoundary>
        </motion.div>

        <motion.div variants={itemVariants}>
        <ErrorBoundary FallbackComponent={ChartFallback}>
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Pipeline Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto pb-1">
            <div className="min-w-[420px] sm:min-w-0">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    minTickGap={0}
                    tickFormatter={(value: string) => (value.length > 10 ? `${value.slice(0, 10)}…` : value)}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "hsl(220 70% 50% / 0.08)" }}
                    content={<PipelineTooltipContent />}
                  />
                  <Bar dataKey="count" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        </ErrorBoundary>
        </motion.div>
      </div>

      {/* Monthly trend by request type (separate charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <ErrorBoundary FallbackComponent={ChartFallback}>
            <Card className="border shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  New business (monthly)
                </CardTitle>
                <CardDescription className="text-xs">Tickets created as new policy</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={typeMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214,20%,90%)", fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="newBusiness"
                      stroke="hsl(220, 70%, 50%)"
                      strokeWidth={2.5}
                      dot={{ fill: "hsl(220, 70%, 50%)", r: 3.5 }}
                      name="New business"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </motion.div>
        <motion.div variants={itemVariants}>
          <ErrorBoundary FallbackComponent={ChartFallback}>
            <Card className="border shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Renewal (monthly)
                </CardTitle>
                <CardDescription className="text-xs">Renewal requests per month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={typeMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214,20%,90%)", fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="renewal"
                      stroke="hsl(168, 60%, 45%)"
                      strokeWidth={2.5}
                      dot={{ fill: "hsl(168, 60%, 45%)", r: 3.5 }}
                      name="Renewal"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </motion.div>
        <motion.div variants={itemVariants}>
          <ErrorBoundary FallbackComponent={ChartFallback}>
            <Card className="border shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Changes (monthly)
                </CardTitle>
                <CardDescription className="text-xs">Changes, adjustments, and customer issues</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={typeMonthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214,20%,90%)", fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="changes"
                      stroke="hsl(270, 60%, 55%)"
                      strokeWidth={2.5}
                      dot={{ fill: "hsl(270, 60%, 55%)", r: 3.5 }}
                      name="Changes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </motion.div>
        <motion.div variants={itemVariants}>
          <ErrorBoundary FallbackComponent={ChartFallback}>
            <Card className="border shadow-sm h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Completed (monthly)
                </CardTitle>
                <CardDescription className="text-xs">Tickets closed as completed each month</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214,20%,90%)", fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="completed"
                      stroke="hsl(152, 55%, 45%)"
                      strokeWidth={2.5}
                      dot={{ fill: "hsl(152, 55%, 45%)", r: 3.5 }}
                      name="Completed"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Type Pie */}
        <motion.div variants={itemVariants}>
        <ErrorBoundary FallbackComponent={ChartFallback}>
        <Card className="border shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Request Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartPie>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="52%"
                  outerRadius={70}
                  dataKey="value"
                  label={renderPiePercentLabel}
                  labelLine={false}
                >
                  {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: 12 }} />
              </RechartPie>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {typeData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name} ({typeTotal > 0 ? Math.round((d.value / typeTotal) * 100) : 0}%)
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </ErrorBoundary>
        </motion.div>

        {/* Priority */}
        <motion.div variants={itemVariants}>
        <ErrorBoundary FallbackComponent={ChartFallback}>
        <Card className="border shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityData.map(p => (
                <div key={p.name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="font-medium">{p.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{p.value} tickets</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${totalTickets > 0 ? (p.value / totalTickets) * 100 : 0}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 p-3 rounded-xl bg-secondary/60 border space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Tickets</span>
                <span className="font-semibold">{activeTickets}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-semibold text-success">
                  {isFiniteNumber(completionRate) ? completionRate.toFixed(0) : "0"}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        </ErrorBoundary>
        </motion.div>

        {/* Recent Tickets */}
        <motion.div variants={itemVariants}>
        <ErrorBoundary FallbackComponent={ChartFallback}>
        <Card className="border shadow-sm h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ticket.clientName}</p>
                    <p className="text-xs text-muted-foreground">#{String(ticket.ticket_no).split("-")[1] || ticket.ticket_no} · {ticket.type}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${ticket.priority === "High" ? "bg-destructive/10 text-destructive" :
                      ticket.priority === "Medium" ? "bg-warning/10 text-warning" :
                        "bg-success/10 text-success"
                    }`}>
                    {ticket.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </ErrorBoundary>
        </motion.div>
      </div>
      </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
