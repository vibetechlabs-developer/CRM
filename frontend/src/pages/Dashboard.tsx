import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pipelineStages } from "@/lib/data";
import { FileText, Users, CheckCircle, AlertTriangle, TrendingUp, Clock, BarChart3, PieChart, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartPie, Pie, Cell, LineChart, Line } from "recharts";
import { useQuery } from "@tanstack/react-query";
import api, { fetchAllPages } from "@/lib/api";

const getTypeDisplay = (backendCode: string) => {
    switch(backendCode) {
        case "NEW": return "New Policy";
        case "RENEWAL": return "Renewal";
        case "ADJUSTMENT": return "Adjustment";
        case "CANCELLATION": return "Cancellation";
        default: return "Unknown";
    }
};

const getStatusDisplay = (backendCode: string) => {
    switch(backendCode) {
        case "LEAD": return "Lead/Inquiry";
        case "DOCS": return "Documents Pending";
        case "PROCESSING": return "Processing";
        case "COMPLETED": return "Completed";
        case "DISCARDED": return "Discarded Leads";
        default: return "Unknown Phase";
    }
};

const getPriorityDisplay = (backendCode: string) => {
      switch(backendCode) {
          case "LOW": return "Low";
          case "MEDIUM": return "Medium";
          case "HIGH": return "High";
          default: return "Medium";
      }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatTicket = (t: any) => {
    const { client_name = "", client_last_name = "" } = t;
    const computedName = `${client_name} ${client_last_name}`.trim();

    return {
        id: t.id,
        ticket_no: t.ticket_no,
        clientName: computedName || (t.client ? `Client ${t.client}` : "Unknown Client"),
        type: getTypeDisplay(t.ticket_type),
        stage: getStatusDisplay(t.status),
        priority: getPriorityDisplay(t.priority),
        createdDate: new Date(t.created_at).toLocaleDateString(),
    };
};

const Dashboard = () => {
  const { data: rawTickets = [], isLoading: isLoadingTickets } = useQuery({
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

  const isArrayTickets = Array.isArray(rawTickets) ? rawTickets : [];
  const tickets = isArrayTickets.map(formatTicket);
  const clients = Array.isArray(clientsData) ? clientsData : [];
  const totalTickets = tickets.length;
  const totalClients = clients.length;
  const completedTickets = tickets.filter(t => t.stage === "Completed").length;
  const highPriority = tickets.filter(t => t.priority === "High").length;
  const activeTickets = tickets.filter(t => t.stage !== "Completed" && t.stage !== "Discarded Leads").length;

  const stats = [
    { title: "Total Tickets", value: totalTickets, icon: FileText, color: "text-primary", bg: "bg-primary/10", change: "+12%", positive: true },
    { title: "Total Clients", value: totalClients, icon: Users, color: "text-accent", bg: "bg-accent/10", change: "+8%", positive: true },
    { title: "Completed", value: completedTickets, icon: CheckCircle, color: "text-success", bg: "bg-success/10", change: "+25%", positive: true },
    { title: "High Priority", value: highPriority, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", change: "-5%", positive: false },
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

  const monthlyTrend = [
    { month: "Jan", tickets: 3, completed: 2 },
    { month: "Feb", tickets: 5, completed: 4 },
    { month: "Mar", tickets: 8, completed: 5 },
    { month: "Apr", tickets: 6, completed: 4 },
    { month: "May", tickets: 10, completed: 7 },
    { month: "Jun", tickets: 8, completed: 6 },
  ];

  const recentTickets = tickets.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Overview of your insurance management system</p>
        </div>
        <div className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full border">
          Mar 6, 2026
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
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(p.value / totalTickets) * 100}%`, backgroundColor: p.color }} />
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
                <span className="font-semibold text-success">{((completedTickets / totalTickets) * 100).toFixed(0)}%</span>
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
