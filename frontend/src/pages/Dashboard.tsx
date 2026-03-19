import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pipelineStages, formatBackendTicket, type BackendTicket } from "@/lib/data";
import { FileText, Users, CheckCircle, AlertTriangle, TrendingUp, Clock, BarChart3, PieChart, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartPie, Pie, Cell, LineChart, Line } from "recharts";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api, { fetchAllPages } from "@/lib/api";
import { isFiniteNumber, normalizeListResponse } from "@/lib/normalize";



const Dashboard = () => {
  const { data: rawTickets, isLoading: isLoadingTickets } = useQuery({
      queryKey: ["tickets"],
      queryFn: async () => {
          return await fetchAllPages("/api/tickets/");
      }
  });

  const { data: clientsData = [], isLoading: isLoadingClients } = useQuery({
      queryKey: ["clients"],
      queryFn: async () => {
          const res = await api.get("/api/clients/");
          return Array.isArray(res.data) ? res.data : (res.data?.results || []);
      }
  });

  const safeRawTickets = normalizeListResponse<BackendTicket>(rawTickets);
  const tickets = safeRawTickets.map((t) => formatBackendTicket(t));
  const clients = Array.isArray(clientsData) ? clientsData : [];
  const totalTickets = tickets.length;
  const totalClients = clients.length;
  const completedTickets = tickets.filter(t => t.stage === "Completed").length;
  const highPriority = tickets.filter(t => t.priority === "High").length;
  const activeTickets = tickets.filter(t => t.stage !== "Completed" && t.stage !== "Discarded Leads").length;

  const todayLabel = useMemo(() => {
    try {
      return new Date().toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
    } catch {
      return "";
    }
  }, []);

  const monthStats = useMemo(() => {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const isInRange = (d: Date, start: Date, end: Date) => d >= start && d < end;

    const createdDates = safeRawTickets
      .map((t) => (t?.created_at ? new Date(t.created_at) : null))
      .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()));

    const completedDates = safeRawTickets
      .filter((t) => t?.status === "COMPLETED")
      .map((t) => (t?.created_at ? new Date(t.created_at) : null))
      .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()));

    const highPriorityDates = safeRawTickets
      .filter((t) => t?.priority === "HIGH")
      .map((t) => (t?.created_at ? new Date(t.created_at) : null))
      .filter((d): d is Date => !!d && !Number.isNaN(d.getTime()));

    const ticketsThisMonth = createdDates.filter((d) => isInRange(d, startOfThisMonth, startOfNextMonth)).length;
    const ticketsPrevMonth = createdDates.filter((d) => isInRange(d, startOfPrevMonth, startOfThisMonth)).length;

    const completedThisMonth = completedDates.filter((d) => isInRange(d, startOfThisMonth, startOfNextMonth)).length;
    const completedPrevMonth = completedDates.filter((d) => isInRange(d, startOfPrevMonth, startOfThisMonth)).length;

    const highThisMonth = highPriorityDates.filter((d) => isInRange(d, startOfThisMonth, startOfNextMonth)).length;
    const highPrevMonth = highPriorityDates.filter((d) => isInRange(d, startOfPrevMonth, startOfThisMonth)).length;

    const fmtDelta = (current: number, prev: number) => {
      if (prev <= 0) {
        if (current <= 0) return { label: "0%", positive: true };
        return { label: "+100%", positive: true };
      }
      const pct = ((current - prev) / prev) * 100;
      const rounded = Math.round(pct);
      return { label: `${rounded >= 0 ? "+" : ""}${rounded}%`, positive: rounded >= 0 };
    };

    return {
      ticketsDelta: fmtDelta(ticketsThisMonth, ticketsPrevMonth),
      completedDelta: fmtDelta(completedThisMonth, completedPrevMonth),
      highDelta: fmtDelta(highThisMonth, highPrevMonth),
    };
  }, [safeRawTickets]);

  const stats = [
    { title: "Total Tickets", value: totalTickets, icon: FileText, color: "text-primary", bg: "bg-primary/10", change: monthStats.ticketsDelta.label, positive: monthStats.ticketsDelta.positive },
    // Client month-over-month requires client created_at which isn't guaranteed in all payloads; keep as neutral for now.
    { title: "Total Clients", value: totalClients, icon: Users, color: "text-accent", bg: "bg-accent/10", change: "—", positive: true },
    { title: "Completed", value: completedTickets, icon: CheckCircle, color: "text-success", bg: "bg-success/10", change: monthStats.completedDelta.label, positive: monthStats.completedDelta.positive },
    { title: "High Priority", value: highPriority, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", change: monthStats.highDelta.label, positive: monthStats.highDelta.positive },
  ];

  const pipelineData = pipelineStages.map(stage => ({
    name: stage.length > 12 ? stage.slice(0, 12) + "…" : stage,
    count: tickets.filter(t => t.stage === stage).length,
  }));

  const typeData = [
    { name: "New Policy", value: tickets.filter(t => t.type === "New Policy").length, color: "hsl(220, 70%, 50%)" },
    { name: "Renewal", value: tickets.filter(t => t.type === "Renewal").length, color: "hsl(168, 60%, 45%)" },
    { name: "Adjustment", value: tickets.filter(t => t.type === "Adjustment").length, color: "hsl(270, 60%, 55%)" },
    { name: "Cancellation", value: tickets.filter(t => t.type === "Cancellation").length, color: "hsl(0, 72%, 55%)" },
  ];

  const priorityData = [
    { name: "High", value: tickets.filter(t => t.priority === "High").length, color: "hsl(0, 72%, 55%)" },
    { name: "Medium", value: tickets.filter(t => t.priority === "Medium").length, color: "hsl(38, 92%, 50%)" },
    { name: "Low", value: tickets.filter(t => t.priority === "Low").length, color: "hsl(152, 55%, 45%)" },
  ];

  const monthlyTrend = useMemo(() => {
    // Last 6 months (including current month), computed from backend `created_at`
    const now = new Date();
    const fmt = new Intl.DateTimeFormat(undefined, { month: "short" });

    const buckets = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        month: fmt.format(d),
        tickets: 0,
        completed: 0,
      };
    });

    const byKey = new Map(buckets.map((b) => [b.key, b]));

    for (const t of safeRawTickets) {
      if (!t?.created_at) continue;
      const d = new Date(t.created_at);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const bucket = byKey.get(key);
      if (!bucket) continue; // outside last 6 months
      bucket.tickets += 1;
      if (t.status === "COMPLETED") bucket.completed += 1;
    }

    return buckets;
  }, [safeRawTickets]);

  const recentTickets = tickets.slice(0, 5);

  const completionRate = totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 0;

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

      {isLoadingTickets || isLoadingClients ? (
        <div className="flex h-32 items-center justify-center text-muted-foreground">Loading dashboard data...</div>
      ) : (
      <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border shadow-sm hover:shadow-md transition-shadow">
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
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Pipeline Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(214,20%,90%)", fontSize: 12 }} />
                <Bar dataKey="count" fill="hsl(220, 70%, 50%)" radius={[4, 4, 0, 0]} name="Tickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Type Pie */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Request Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RechartPie>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {typeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: 12 }} />
              </RechartPie>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {typeData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority */}
        <Card className="border shadow-sm">
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

        {/* Recent Tickets */}
        <Card className="border shadow-sm">
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
      </div>
      </>
      )}
    </div>
  );
};

export default Dashboard;
