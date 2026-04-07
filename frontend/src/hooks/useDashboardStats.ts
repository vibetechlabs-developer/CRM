import { useMemo } from "react";
import { pipelineStages, formatBackendTicket } from "@/lib/data";
import { FileText, Users, CheckCircle, AlertTriangle } from "lucide-react";
import { getTypeDisplay, getStatusDisplay, getPriorityDisplay } from "@/lib/data";

export function useDashboardStats(statsData: any) {
  const {
      totalTickets = 0,
      totalClients = 0,
      completedTickets = 0,
      highPriority = 0,
      activeTickets = 0,
      monthStats = {
          ticketsDelta: { label: "0%", positive: true },
          completedDelta: { label: "0%", positive: true },
          highDelta: { label: "0%", positive: true },
      },
      statusCounts = [],
      typeCounts = [],
      priorityCounts = [],
      monthlyTrend = [],
      recentTickets: rawRecentTickets = []
  } = statsData || {};

  const stats = useMemo(() => [
    { title: "Total Tickets", value: totalTickets, icon: FileText, color: "text-primary", bg: "bg-primary/10", change: monthStats.ticketsDelta.label, positive: monthStats.ticketsDelta.positive },
    { title: "Total Clients", value: totalClients, icon: Users, color: "text-accent", bg: "bg-accent/10", change: "—", positive: true },
    { title: "Completed", value: completedTickets, icon: CheckCircle, color: "text-success", bg: "bg-success/10", change: monthStats.completedDelta.label, positive: monthStats.completedDelta.positive },
    { title: "High Priority", value: highPriority, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", change: monthStats.highDelta.label, positive: monthStats.highDelta.positive },
  ], [totalTickets, totalClients, completedTickets, highPriority, monthStats]);

  const todayLabel = useMemo(() => {
    try {
      return new Date().toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" });
    } catch {
      return "";
    }
  }, []);

  const pipelineData = useMemo(() => {
     return pipelineStages.map(stage => {
         const count = statusCounts.reduce((acc: number, curr: any) => {
             if (getStatusDisplay(curr.status) === stage) {
                 return acc + curr.count;
             }
             return acc;
         }, 0);
         return {
             name: stage.length > 12 ? stage.slice(0, 12) + "…" : stage,
             count
         };
     });
  }, [statusCounts]);

  const typeData = useMemo(() => {
     const typesMap = [
       { name: "New Policy", color: "hsl(220, 70%, 50%)" },
       { name: "Renewal", color: "hsl(168, 60%, 45%)" },
       { name: "Changes", color: "hsl(270, 60%, 55%)" },
       { name: "Cancellation", color: "hsl(0, 72%, 55%)" },
     ];
     return typesMap.map(t => {
         const count = typeCounts.reduce((acc: number, curr: any) => {
             const typeCode = (curr.ticket_type || "").toUpperCase();
             // "Changes" bucket: merge CHANGES + ADJUSTMENT + CUSTOMER_ISSUE
             if (t.name === "Changes") {
                 if (["CHANGES", "ADJUSTMENT", "CUSTOMER_ISSUE"].includes(typeCode)) {
                     return acc + curr.count;
                 }
             } else if (getTypeDisplay(curr.ticket_type) === t.name) {
                 return acc + curr.count;
             }
             return acc;
         }, 0);
         return { ...t, value: count };
     });
  }, [typeCounts]);

  const priorityData = useMemo(() => {
     const priorsMap = [
       { name: "High", color: "hsl(0, 72%, 55%)" },
       { name: "Medium", color: "hsl(38, 92%, 50%)" },
       { name: "Low", color: "hsl(152, 55%, 45%)" },
     ];
     return priorsMap.map(p => {
         const count = priorityCounts.reduce((acc: number, curr: any) => {
             if (getPriorityDisplay(curr.priority) === p.name) {
                 return acc + curr.count;
             }
             return acc;
         }, 0);
         return { ...p, value: count };
     });
  }, [priorityCounts]);

  const recentTickets = useMemo(() => rawRecentTickets.map((t: any) => formatBackendTicket(t)), [rawRecentTickets]);

  const completionRate = totalTickets > 0 ? (completedTickets / totalTickets) * 100 : 0;

  return {
    totalTickets,
    totalClients,
    completedTickets,
    highPriority,
    activeTickets,
    todayLabel,
    monthStats,
    stats,
    pipelineData,
    typeData,
    priorityData,
    monthlyTrend,
    recentTickets,
    completionRate,
  };
}
