import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, RefreshCw, SlidersHorizontal, XCircle, MessageCircleWarning } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NewBusinessForm from "./NewBusinessForm";
import RenewalRequestForm from "./RenewalRequestForm";
import PolicyChangeForm from "./PolicyChangeForm";
import CancellationForm from "./CancellationForm";
import CustomerIssueForm from "./CustomerIssueForm";
import type { RequestType } from "@/lib/data";

const requestTypes: {
  type: RequestType;
  description: string;
  icon: any;
  color: string;
  bg: string;
}[] = [
  {
    type: "New Policy" as RequestType,
    description: "Create a new policy / quotation ticket using the detailed insurance form",
    icon: FileText,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    type: "Renewal" as RequestType,
    description: "Create a renewal ticket for an existing policy",
    icon: RefreshCw,
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
  {
    type: "Adjustment" as RequestType,
    description: "Create an adjustment / change request ticket",
    icon: SlidersHorizontal,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    type: "Cancellation" as RequestType,
    description: "Create a cancellation request ticket",
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
  },
  {
    type: "Customer Issue" as RequestType,
    description: "Log a customer service issue or complaint",
    icon: MessageCircleWarning,
    color: "text-amber-600",
    bg: "bg-amber-100 border-amber-200",
  },
];

const NewTicket = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<RequestType | null>(null);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create New Ticket</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Select what you want to do. The detailed form for that ticket type will appear below.
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Request Type Selection */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 space-y-1">
          <CardTitle className="text-base font-semibold">Select Request Type</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            All forms automatically create a ticket and will{" "}
            <span className="font-semibold text-foreground">reuse an existing client if the email already exists</span>,
            otherwise a new client will be created.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {requestTypes.map((rt) => {
              const Icon = rt.icon;
              const active = selectedType === rt.type;
              return (
                <button
                  key={rt.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(rt.type);
                  }}
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

      {/* Inline forms shown below the selector based on chosen type */}
      {selectedType === "New Policy" && (
        <div className="mt-4">
          <NewBusinessForm />
        </div>
      )}
      {selectedType === "Renewal" && (
        <div className="mt-4">
          <RenewalRequestForm />
        </div>
      )}
      {selectedType === "Adjustment" && (
        <div className="mt-4">
          <PolicyChangeForm />
        </div>
      )}
      {selectedType === "Cancellation" && (
        <div className="mt-4">
          <CancellationForm />
        </div>
      )}
      {selectedType === "Customer Issue" && (
        <div className="mt-4">
          <CustomerIssueForm />
        </div>
      )}
    </div>
  );
};

export default NewTicket;  
