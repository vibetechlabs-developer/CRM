import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BinderFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function BinderForm({ isOpen, onClose, initialData }: BinderFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return {
        binder_date: initialData.binder_date || new Date().toISOString().split("T")[0],
        quote_person: initialData.quote_person || "",
        binder_person: initialData.binder_person || "",
        client_name: initialData.client_name || "",
        company_name: initialData.company_name || "",
        task: initialData.task || "",
        notes: initialData.notes || "",
      };
    }
    return {
      binder_date: new Date().toISOString().split("T")[0],
      quote_person: "",
      binder_person: "",
      client_name: "",
      company_name: "",
      task: "",
      notes: "",
    };
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = { ...data };
      if (initialData && initialData.id) {
        return await api.patch(`/api/binders/${initialData.id}/`, payload);
      }
      return await api.post("/api/binders/", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["binders"] });
      toast.success(initialData ? "Binder updated successfully!" : "Binder created successfully!");
      onClose();
    },
    onError: (error) => {
      toast.error(initialData ? "Failed to update binder." : "Failed to create binder.");
      console.error(error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Binder" : "Add New Binder"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="binder_date">Date *</Label>
              <Input
                id="binder_date"
                name="binder_date"
                type="date"
                required
                value={formData.binder_date}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote_person">Quote Person</Label>
              <Input
                id="quote_person"
                name="quote_person"
                value={formData.quote_person}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="binder_person">Binder Person</Label>
              <Input
                id="binder_person"
                name="binder_person"
                value={formData.binder_person}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name *</Label>
              <Input
                id="client_name"
                name="client_name"
                required
                value={formData.client_name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task">Task</Label>
              <Input
                id="task"
                name="task"
                value={formData.task}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Binder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
