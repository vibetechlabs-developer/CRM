import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);
  const [clientId, setClientId] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [form, setForm] = useState({
    clientName: "", email: "", phone: "", address: "",
    insuranceType: "", policyNumber: "", coverageAmount: "",
    requestedChanges: "", notes: "",
  });

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const isFormValid = selectedType && form.clientName && form.email && form.insuranceType;

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
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Find Existing Client</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={clientId}
                        onChange={e => setClientId(e.target.value)}
                        placeholder="Enter Client ID (e.g. C-1001)"
                        className="flex-1"
                      />
                      <Button size="icon" variant="outline"><Search className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Client Full Name <span className="text-destructive">*</span></Label>
                    <Input value={form.clientName} onChange={e => updateForm("clientName", e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Email Address <span className="text-destructive">*</span></Label>
                    <Input value={form.email} onChange={e => updateForm("email", e.target.value)} placeholder="Email address" type="email" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <Input value={form.phone} onChange={e => updateForm("phone", e.target.value)} placeholder="Phone number" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Mailing Address</Label>
                    <Input value={form.address} onChange={e => updateForm("address", e.target.value)} placeholder="Address" />
                  </div>
                </div>
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
              <Button className="flex-1" disabled={!isFormValid} onClick={() => navigate("/tickets")}>Submit Request</Button>
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
