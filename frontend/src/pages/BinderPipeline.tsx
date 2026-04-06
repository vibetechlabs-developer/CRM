import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import api, { fetchAllPages } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download, Plus, Pencil } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
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

export default function BinderPipeline() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBinder, setEditingBinder] = useState<any>(null);

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

      <div className="border rounded-md shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
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
            ) : binders && binders.length > 0 ? (
              binders.map((binder: any) => (
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
                  <TableCell>{binder.task}</TableCell>
                  <TableCell className="max-w-[250px] truncate" title={binder.notes}>{binder.notes}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEdit(binder)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No binders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
