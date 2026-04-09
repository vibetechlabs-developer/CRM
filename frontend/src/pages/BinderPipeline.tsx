import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  endOfDay,
  endOfWeek,
  format,
  isThisMonth,
  isToday,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import api, { fetchAllPages } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download, Plus, Pencil, Search } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BinderForm } from "@/components/BinderForm";
import { toast } from "sonner";

const PERSON_OPTIONS = ["KALPAN", "JEEL", "VATSAL", "HARSH", "PRINCE", "FERIL"] as const;
const DATE_FILTER_OPTIONS = ["ALL", "TODAY", "THIS_WEEK", "THIS_MONTH", "OVERDUE_PENDING"] as const;

export default function BinderPipeline() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBinder, setEditingBinder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [quotePersonFilter, setQuotePersonFilter] = useState("ALL");
  const [binderPersonFilter, setBinderPersonFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTER_OPTIONS)[number]>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const getTaskUi = (task: string) => {
    if (task === "COMPLETED") {
      return {
        label: "Completed",
        className:
          "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700",
      };
    }
    return {
      label: "Pending",
      className:
        "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700",
    };
  };

  const { data: binders, isLoading } = useQuery({
    queryKey: ["binders"],
    queryFn: async () => {
      // By default the backend sorts ascending by binder_date
      return await fetchAllPages("/api/binders/");
    },
  });

  const handleExport = async () => {
    try {
      const response = await api.get('/api/binders/export/', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'binders_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting CSV", error);
      toast.error("Failed to export CSV");
    }
  };

  const handleEdit = (binder: any) => {
    setEditingBinder(binder);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingBinder(null);
  };

  const filteredBinders = useMemo(() => {
    if (!binders) return [];

    const todayStart = startOfDay(new Date());
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

    return binders.filter((binder: any) => {
      const normalizedQuotePerson = String(binder.quote_person || "").toUpperCase();
      const normalizedBinderPerson = String(binder.binder_person || "").toUpperCase();
      const normalizedTask = String(binder.task || "").toUpperCase();
      const binderDate = binder.binder_date ? parseISO(binder.binder_date) : null;

      if (quotePersonFilter !== "ALL" && normalizedQuotePerson !== quotePersonFilter) {
        return false;
      }

      if (binderPersonFilter !== "ALL" && normalizedBinderPerson !== binderPersonFilter) {
        return false;
      }

      if (dateFilter === "TODAY") {
        if (!binderDate || !isToday(binderDate)) return false;
      } else if (dateFilter === "THIS_WEEK") {
        if (
          !binderDate ||
          !isWithinInterval(binderDate, {
            start: weekStart,
            end: endOfDay(weekEnd),
          })
        ) {
          return false;
        }
      } else if (dateFilter === "THIS_MONTH") {
        if (!binderDate || !isThisMonth(binderDate)) return false;
      } else if (dateFilter === "OVERDUE_PENDING") {
        if (!binderDate || normalizedTask !== "PENDING" || binderDate >= todayStart) return false;
      }

      const query = searchTerm.trim().toLowerCase();
      if (!query) return true;

      const searchable = [
        binder.client_name,
        binder.company_name,
        binder.quote_person,
        binder.binder_person,
        binder.notes,
      ]
        .map((value: unknown) => String(value || "").toLowerCase())
        .join(" ");

      return searchable.includes(query);
    });
  }, [binders, searchTerm, quotePersonFilter, binderPersonFilter, dateFilter]);

  useEffect(() => {
    // Reset page when filters/search change
    setPage(1);
  }, [searchTerm, quotePersonFilter, binderPersonFilter, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBinders.length / pageSize));

  useEffect(() => {
    // Clamp page when filtered length shrinks
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedBinders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBinders.slice(start, start + pageSize);
  }, [filteredBinders, page]);

  const dateFilterLabel: Record<(typeof DATE_FILTER_OPTIONS)[number], string> = {
    ALL: "All dates",
    TODAY: "Today",
    THIS_WEEK: "This Week",
    THIS_MONTH: "This Month",
    OVERDUE_PENDING: "Overdue Pending",
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Binder Pipeline</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage binder entries and export reports
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsFormOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Binder
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, company, person, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          <Select value={quotePersonFilter} onValueChange={setQuotePersonFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Quote Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Quote Persons</SelectItem>
              {PERSON_OPTIONS.map((person) => (
                <SelectItem key={person} value={person}>
                  {person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={binderPersonFilter} onValueChange={setBinderPersonFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Binder Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Binder Persons</SelectItem>
              {PERSON_OPTIONS.map((person) => (
                <SelectItem key={person} value={person}>
                  {person}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={dateFilter}
            onValueChange={(value) => setDateFilter(value as (typeof DATE_FILTER_OPTIONS)[number])}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Date filter" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FILTER_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {dateFilterLabel[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{filteredBinders.length}</span> binders found
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead>Effective Date of Policy</TableHead>
              <TableHead>Quote Person</TableHead>
              <TableHead>Binder Person</TableHead>
              <TableHead>Client Name</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <Spinner size="md" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : paginatedBinders.length > 0 ? (
              paginatedBinders.map((binder: any) => {
                const taskUi = getTaskUi(binder.task);
                return (
                <TableRow key={binder.id}>
                  <TableCell>
                    {binder.binder_date
                      ? format(new Date(binder.binder_date), "MMM d, yyyy")
                      : ""}
                  </TableCell>
                  <TableCell>{binder.quote_person}</TableCell>
                  <TableCell>{binder.binder_person}</TableCell>
                  <TableCell className="font-medium">{binder.client_name}</TableCell>
                  <TableCell>{binder.company_name}</TableCell>
                  <TableCell>
                    <span className={taskUi.className}>
                      {taskUi.label}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate" title={binder.notes}>{binder.notes}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(binder)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No binders found for selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {filteredBinders.length > 0 && totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm px-4">
                Page {page} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {isFormOpen && (
        <BinderForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          initialData={editingBinder}
        />
      )}
    </div>
  );
}
