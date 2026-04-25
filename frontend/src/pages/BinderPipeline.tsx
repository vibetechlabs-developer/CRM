import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Download, Plus, Search, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PERSON_OPTIONS = ["KALPAN", "JEEL", "VATSAL", "HARSH", "PRINCE", "FERIL"] as const;
const DATE_FILTER_OPTIONS = ["ALL", "TODAY", "THIS_WEEK", "THIS_MONTH", "OVERDUE_PENDING"] as const;

type BinderFormData = {
  binder_date: string;
  quote_person: string;
  binder_person: string;
  client_name: string;
  company_name: string;
  task: "PENDING" | "COMPLETED";
  notes: string;
};

export default function BinderPipeline() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [quotePersonFilter, setQuotePersonFilter] = useState("ALL");
  const [binderPersonFilter, setBinderPersonFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState<(typeof DATE_FILTER_OPTIONS)[number]>("ALL");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);
  const [deletingBinderId, setDeletingBinderId] = useState<number | null>(null);
  const [binderPendingDelete, setBinderPendingDelete] = useState<number | null>(null);
  const emptyForm: BinderFormData = {
    binder_date: new Date().toISOString().split("T")[0],
    quote_person: "",
    binder_person: "",
    client_name: "",
    company_name: "",
    task: "PENDING" as "PENDING" | "COMPLETED",
    notes: "",
  };
  const [newRowData, setNewRowData] = useState(emptyForm);
  const [rowDrafts, setRowDrafts] = useState<Record<number, BinderFormData>>({});

  const { data: binders, isLoading } = useQuery({
    queryKey: ["binders"],
    queryFn: async () => {
      const cacheBust = `_ts=${Date.now()}`;
      // Primary list route now returns the same full payload for all roles.
      const response = await api.get(`/api/binders/?${cacheBust}`);
      if (Array.isArray(response.data)) return response.data;
      return await fetchAllPages(`/api/binders/?${cacheBust}`);
    },
  });

  const normalizeBinder = (binder: any): BinderFormData => ({
    binder_date: binder.binder_date || new Date().toISOString().split("T")[0],
    quote_person: String(binder.quote_person || "").toUpperCase(),
    binder_person: String(binder.binder_person || "").toUpperCase(),
    client_name: binder.client_name || "",
    company_name: binder.company_name || "",
    task: String(binder.task || "").toUpperCase() === "COMPLETED" ? "COMPLETED" : "PENDING",
    notes: binder.notes || "",
  });

  useEffect(() => {
    if (!binders) return;
    const nextDrafts: Record<number, BinderFormData> = {};
    binders.forEach((binder: any) => {
      nextDrafts[binder.id] = normalizeBinder(binder);
    });
    setRowDrafts(nextDrafts);
  }, [binders]);

  const downloadCsvFromRows = (rows: any[]) => {
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? "");
      if (text.includes('"') || text.includes(",") || text.includes("\n")) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const headers = [
      "Effective Date of Policy",
      "Quote Person",
      "Binder Person",
      "Client Name",
      "Company Name",
      "Task",
      "Notes",
      "Created At",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((binder) =>
        [
          binder?.binder_date || "",
          binder?.quote_person || "",
          binder?.binder_person || "",
          binder?.client_name || "",
          binder?.company_name || "",
          binder?.task || "",
          binder?.notes || "",
          binder?.created_at || "",
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "binders_export.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

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
      // Fallback: keep export working even if backend export dependency fails in production.
      const rows = Array.isArray(binders) ? binders : [];
      if (rows.length > 0) {
        downloadCsvFromRows(rows);
        toast.success("CSV exported using local fallback.");
        return;
      }
      console.error("Error exporting CSV", error);
      toast.error("Failed to export CSV");
    }
  };

  const deleteBinderMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/binders/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["binders"] });
      toast.success("Binder deleted.");
      setBinderPendingDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete binder.");
    },
    onSettled: () => {
      setDeletingBinderId(null);
    },
  });

  const upsertBinderMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id?: number;
      payload: BinderFormData;
    }) => {
      if (id) {
        return api.patch(`/api/binders/${id}/`, payload);
      }
      return api.post("/api/binders/", payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["binders"] });
      toast.success(variables.id ? "Binder updated successfully!" : "Binder created successfully!");
    },
    onError: (_, variables) => {
      toast.error(variables.id ? "Failed to update binder." : "Failed to create binder.");
    },
    onSettled: () => {
      setSavingRowId(null);
    },
  });

  const saveNewRow = () => {
    if (!newRowData.client_name.trim()) {
      toast.error("Client Name is required.");
      return;
    }
    setSavingRowId(0);
    upsertBinderMutation.mutate({ payload: newRowData });
    setNewRowData(emptyForm);
    setIsAddingRow(false);
  };

  const saveEditedRow = (id: number) => {
    const payload = rowDrafts[id];
    if (!payload?.client_name.trim()) {
      toast.error("Client Name is required.");
      return;
    }
    setSavingRowId(id);
    upsertBinderMutation.mutate({
      id,
      payload,
    });
  };

  const isRowDirty = (binder: any) => {
    const original = normalizeBinder(binder);
    const draft = rowDrafts[binder.id];
    if (!draft) return false;
    return (
      original.binder_date !== draft.binder_date ||
      original.quote_person !== draft.quote_person ||
      original.binder_person !== draft.binder_person ||
      original.client_name !== draft.client_name ||
      original.company_name !== draft.company_name ||
      original.task !== draft.task ||
      original.notes !== draft.notes
    );
  };

  const renderPersonSelect = (
    value: string,
    onValueChange: (value: string) => void,
    placeholder: string
  ) => (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 text-xs min-w-[120px] rounded-none border-0 shadow-none focus:ring-0">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {PERSON_OPTIONS.map((person) => (
          <SelectItem key={person} value={person}>
            {person}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderTaskSelect = (
    value: "PENDING" | "COMPLETED",
    onValueChange: (value: "PENDING" | "COMPLETED") => void
  ) => {
    const isDone = value === "COMPLETED";
    return (
      <Select value={value} onValueChange={(v) => onValueChange(v as "PENDING" | "COMPLETED")}>
        <SelectTrigger
          className={cn(
            "h-8 text-xs min-w-[110px] rounded-md border shadow-none focus:ring-0 data-[state=open]:ring-0",
            isDone
              ? "border-emerald-300 bg-emerald-50 font-medium text-emerald-800 hover:bg-emerald-100/80"
              : "border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-50"
          )}
        >
          <SelectValue placeholder="Task" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  const renderTextInput = (
    value: string,
    onChange: (value: string) => void,
    placeholder: string,
    required = false
  ) => (
    <Input
      className="h-8 text-xs rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      required={required}
    />
  );

  const renderDateInput = (value: string, onChange: (value: string) => void) => (
    <Input
      className="h-8 text-xs rounded-none border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  const renderNewRowActions = (
    onSave: () => void,
    onCancel: () => void,
    isSaving: boolean
  ) => (
    <div className="flex items-center gap-1 flex-wrap">
      <Button size="sm" className="h-8 px-2 text-xs" onClick={onSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </Button>
      <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={onCancel} disabled={isSaving}>
        Cancel
      </Button>
    </div>
  );

  const renderExistingRowActions = (
    binderId: number,
    onSave: () => void,
    onCancel: () => void,
    isSaving: boolean,
    saveDisabled: boolean
  ) => {
    const isDeleting = deletingBinderId === binderId;
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <Button size="sm" className="h-8 px-2 text-xs" onClick={onSave} disabled={isSaving || saveDisabled}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-8 px-2 text-xs gap-1"
          onClick={() => setBinderPendingDelete(binderId)}
          disabled={isSaving || isDeleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    );
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
          <Button
            onClick={() => {
              setIsAddingRow(true);
              setPage(1);
            }}
            className="gap-2"
          >
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

      <Card className="border shadow-sm overflow-hidden rounded-md">
        <div className="overflow-x-auto">
        <Table className="min-w-[1220px] border-collapse">
          <TableHeader>
            <TableRow className="bg-muted/70 border-b">
              <TableHead className="h-9 px-2 border-r font-semibold text-foreground">Effective Date of Policy</TableHead>
              <TableHead className="h-9 px-2 border-r font-semibold text-foreground">Quote Person</TableHead>
              <TableHead className="h-9 px-2 border-r font-semibold text-foreground">Binder Person</TableHead>
              <TableHead className="h-9 px-2 border-r font-semibold text-foreground min-w-[260px]">Client Name</TableHead>
              <TableHead className="h-9 px-2 border-r font-semibold text-foreground">Company Name</TableHead>
              <TableHead className="h-9 px-2 border-r font-semibold text-foreground">Task</TableHead>
              <TableHead className="h-9 px-2 border-r font-semibold text-foreground">Notes</TableHead>
              <TableHead className="h-9 px-2 w-[220px] font-semibold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center border-b">
                  <Spinner size="md" className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              <>
                {isAddingRow && (
                  <TableRow className="border-b bg-yellow-50/40">
                    <TableCell className="p-0 border-r">{renderDateInput(newRowData.binder_date, (value) => setNewRowData((prev) => ({ ...prev, binder_date: value })))}</TableCell>
                    <TableCell className="p-0 border-r">{renderPersonSelect(newRowData.quote_person, (value) => setNewRowData((prev) => ({ ...prev, quote_person: value })), "Quote person")}</TableCell>
                    <TableCell className="p-0 border-r">{renderPersonSelect(newRowData.binder_person, (value) => setNewRowData((prev) => ({ ...prev, binder_person: value })), "Binder person")}</TableCell>
                    <TableCell className="p-0 border-r min-w-[260px]">{renderTextInput(newRowData.client_name, (value) => setNewRowData((prev) => ({ ...prev, client_name: value })), "Client name", true)}</TableCell>
                    <TableCell className="p-0 border-r">{renderTextInput(newRowData.company_name, (value) => setNewRowData((prev) => ({ ...prev, company_name: value })), "Company name")}</TableCell>
                    <TableCell
                      className={cn(
                        "p-1 border-r align-middle",
                        newRowData.task === "COMPLETED" && "bg-emerald-50/90"
                      )}
                    >
                      {renderTaskSelect(newRowData.task, (value) => setNewRowData((prev) => ({ ...prev, task: value })))}
                    </TableCell>
                    <TableCell className="p-0 border-r">{renderTextInput(newRowData.notes, (value) => setNewRowData((prev) => ({ ...prev, notes: value })), "Notes")}</TableCell>
                    <TableCell className="px-2 py-1">
                      {renderNewRowActions(
                        saveNewRow,
                        () => {
                          setIsAddingRow(false);
                          setNewRowData(emptyForm);
                        },
                        savingRowId === 0
                      )}
                    </TableCell>
                  </TableRow>
                )}
                {paginatedBinders.length > 0 ? (
              paginatedBinders.map((binder: any) => {
                const draft = rowDrafts[binder.id] || normalizeBinder(binder);
                const dirty = isRowDirty(binder);
                const taskDone = draft.task === "COMPLETED";
                return (
                <TableRow key={binder.id} className="border-b">
                  <TableCell className="p-0 border-r">{renderDateInput(draft.binder_date, (value) => setRowDrafts((prev) => ({ ...prev, [binder.id]: { ...draft, binder_date: value } })))}</TableCell>
                  <TableCell className="p-0 border-r">{renderPersonSelect(draft.quote_person, (value) => setRowDrafts((prev) => ({ ...prev, [binder.id]: { ...draft, quote_person: value } })), "Quote person")}</TableCell>
                  <TableCell className="p-0 border-r">{renderPersonSelect(draft.binder_person, (value) => setRowDrafts((prev) => ({ ...prev, [binder.id]: { ...draft, binder_person: value } })), "Binder person")}</TableCell>
                  <TableCell className="p-0 border-r font-medium min-w-[260px]">{renderTextInput(draft.client_name, (value) => setRowDrafts((prev) => ({ ...prev, [binder.id]: { ...draft, client_name: value } })), "Client name", true)}</TableCell>
                  <TableCell className="p-0 border-r">{renderTextInput(draft.company_name, (value) => setRowDrafts((prev) => ({ ...prev, [binder.id]: { ...draft, company_name: value } })), "Company name")}</TableCell>
                  <TableCell
                    className={cn(
                      "p-1 border-r align-middle",
                      taskDone && "bg-emerald-50/90"
                    )}
                  >
                    {renderTaskSelect(draft.task, (value) =>
                      setRowDrafts((prev) => ({ ...prev, [binder.id]: { ...draft, task: value } }))
                    )}
                  </TableCell>
                  <TableCell className="p-0 border-r max-w-[250px]">{renderTextInput(draft.notes, (value) => setRowDrafts((prev) => ({ ...prev, [binder.id]: { ...draft, notes: value } })), "Notes")}</TableCell>
                  <TableCell className="px-2 py-1">
                    {renderExistingRowActions(
                      binder.id,
                      () => saveEditedRow(binder.id),
                      () => setRowDrafts((prev) => ({ ...prev, [binder.id]: normalizeBinder(binder) })),
                      savingRowId === binder.id,
                      !dirty
                    )}
                  </TableCell>
                </TableRow>
              );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground border-b"
                >
                  No binders found for selected filters.
                </TableCell>
              </TableRow>
            )}
              </>
            )}
          </TableBody>
        </Table>
        </div>
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

      <AlertDialog open={binderPendingDelete !== null} onOpenChange={(open) => !open && setBinderPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this binder?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the row from the binder pipeline. You cannot undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBinderId !== null}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingBinderId !== null}
              onClick={() => {
                if (binderPendingDelete == null) return;
                setDeletingBinderId(binderPendingDelete);
                deleteBinderMutation.mutate(binderPendingDelete);
              }}
            >
              {deletingBinderId !== null ? "Deleting..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
