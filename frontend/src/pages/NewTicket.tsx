import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { insuranceTypes, priorities } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, RefreshCw, SlidersHorizontal, Search, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RequestType, Priority } from "@/lib/data";

// Cancellation has been moved to its own dedicated page (/cancellations)
const requestTypes = [
  { type: "New Policy" as RequestType, description: "Submit a new insurance quote request", icon: FileText, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  { type: "Renewal" as RequestType, description: "Renew an existing policy", icon: RefreshCw, color: "text-accent", bg: "bg-accent/10 border-accent/20" },
  { type: "Adjustment" as RequestType, description: "Update or modify policy details", icon: SlidersHorizontal, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
];

const NewTicket = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [clientId, setClientId] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [form, setForm] = useState({
    clientName: "", email: "", phone: "", address: "",
    insuranceType: "", policyNumber: "", coverageAmount: "",
    requestedChanges: "", notes: "",
  });

  const { data: clientsData = [], isLoading: isClientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await api.get("/api/clients/");
      return Array.isArray(res.data) ? res.data : (res.data?.results || []);
    }
  });

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const isFormValid = selectedType && clientId && form.insuranceType;

  const createTicketMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/api/tickets/", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      navigate("/tickets");
    },
  });

  const getPriorityBackendCode = (priorityDisplay: string) => {
      switch(priorityDisplay) {
          case "Low": return "LOW";
          case "Medium": return "MEDIUM";
          case "High": return "HIGH";
          default: return "MEDIUM";
      }
  };

  const getTypeBackendCode = (typeDisplay: string) => {
      switch(typeDisplay) {
         case "New Policy": return "NEW";
         case "Renewal": return "RENEWAL";
         case "Adjustment": return "ADJUSTMENT";
         case "Cancellation": return "CANCELLATION";
         default: return "NEW";
      }
  };

  const handleSubmit = () => {
      if(!isFormValid) return;

      const payload = {
          ticket_type: getTypeBackendCode(selectedType || "New Policy"),
          priority: getPriorityBackendCode(priority),
          client: parseInt(clientId), 
          insurance_type: form.insuranceType,
          details: `Policy Number: ${form.policyNumber}\nCoverage: ${form.coverageAmount}\nChanges: ${form.requestedChanges}`,
          additional_notes: form.notes,
          source: "WEB"
      };
      
      createTicketMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create New Ticket</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Select a request type and fill in the details</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Request Type Selection */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Select Request Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {requestTypes.map((rt) => {
              const Icon = rt.icon;
              const active = selectedType === rt.type;
              return (
                <button
                  key={rt.type}
                  onClick={() => setSelectedType(rt.type)}
                  className={`p-5 rounded-xl border-2 text-left transition-all duration-150 ${active ? `border-primary bg-primary/5 shadow-sm` : "border-border hover:border-primary/30 hover:bg-secondary/50"
                    }`}
                >
                  <div className={`h-10 w-10 rounded-lg ${rt.bg} border flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${active ? "text-primary" : rt.color}`} />
                  </div>
                  <p className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>{rt.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rt.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      {selectedType && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Insurance Type */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Insurance Type <span className="text-destructive">*</span></Label>
              <Select value={form.insuranceType} onValueChange={v => updateForm("insuranceType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance type" />
                </SelectTrigger>
                <SelectContent>
                  {insuranceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Priority</Label>
              <Select value={priority} onValueChange={v => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${p === "High" ? "bg-destructive" : p === "Medium" ? "bg-warning" : "bg-success"}`} />
                        {p}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Section */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Client Information</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Select a Client <span className="text-destructive">*</span></Label>
                  <Select value={clientId} onValueChange={(val) => {
                       setClientId(val);
                       const selectedClient = clientsData.find((c: any) => c.id.toString() === val);
                       if (selectedClient) {
                           updateForm("clientName", `${selectedClient.first_name} ${selectedClient.last_name}`);
                           updateForm("email", selectedClient.email);
                           updateForm("phone", selectedClient.phone);
                           updateForm("address", selectedClient.address);
                       }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder={isClientsLoading ? "Loading clients..." : "Search and select a client..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {clientsData.map((client: any) => (
                         <SelectItem key={client.id} value={client.id.toString()}>
                            {client.first_name} {client.last_name} ({client.email})
                         </SelectItem>
                      ))}
                      {clientsData.length === 0 && !isClientsLoading && (
                         <SelectItem value="none" disabled>No clients found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {clientId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-secondary/20 rounded-lg border border-border">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Client Name</Label>
                      <p className="text-sm font-medium">{form.clientName}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Email Address</Label>
                      <p className="text-sm font-medium">{form.email}</p>
                    </div>
                    {form.phone && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Phone Number</Label>
                        <p className="text-sm">{form.phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Type-specific fields */}
            {selectedType === "New Policy" && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Quote Details</h3>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Desired Coverage Amount ($)</Label>
                  <Input value={form.coverageAmount} onChange={e => updateForm("coverageAmount", e.target.value)} placeholder="e.g. 100000" />
                </div>
              </div>
            )}
            {(selectedType === "Renewal" || selectedType === "Adjustment") && (
              <div>
                <h3 className="text-sm font-semibold mb-3">{selectedType} Details</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Policy Number <span className="text-destructive">*</span></Label>
                    <Input value={form.policyNumber} onChange={e => updateForm("policyNumber", e.target.value)} placeholder="e.g. POL-2024-0001" />
                  </div>
                  {selectedType === "Adjustment" && (
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Requested Changes</Label>
                      <Textarea value={form.requestedChanges} onChange={e => updateForm("requestedChanges", e.target.value)} placeholder="Describe the changes..." rows={3} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Additional Notes</Label>
              <Textarea value={form.notes} onChange={e => updateForm("notes", e.target.value)} placeholder="Any additional information..." rows={3} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">Cancel</Button>
              <Button className="flex-1" disabled={!isFormValid || createTicketMutation.status === "pending"} onClick={handleSubmit}>
                {createTicketMutation.status === "pending" ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedType && (
        <p className="text-center text-muted-foreground py-8 text-sm">
          Select a request type above to begin filling in the details.
        </p>
      )}
    </div>
  );
};

export default NewTicket;  
