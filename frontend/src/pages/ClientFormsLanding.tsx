import { useNavigate } from "react-router-dom";
import { FileText, RefreshCw, SlidersHorizontal, MessageCircleWarning } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RequestType } from "@/lib/data";

const requestTypes: {
  type: RequestType;
  path: string;
  description: string;
  icon: any;
  color: string;
  bg: string;
}[] = [
  {
    type: "New Policy" as RequestType,
    path: "/forms/new-business",
    description: "Create a new policy / quotation ticket using the detailed insurance form",
    icon: FileText,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    type: "Renewal" as RequestType,
    path: "/forms/renewal",
    description: "Create a renewal ticket for an existing policy",
    icon: RefreshCw,
    color: "text-accent",
    bg: "bg-accent/10 border-accent/20",
  },
  {
    type: "Changes Form" as RequestType,
    path: "/forms/changes",
    description: "Create a changes request ticket",
    icon: SlidersHorizontal,
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    type: "Customer Issue" as RequestType,
    path: "/forms/customer-issue",
    description: "Log a customer service issue or complaint",
    icon: MessageCircleWarning,
    color: "text-amber-600",
    bg: "bg-amber-100 border-amber-200",
  },
];

const ClientFormsLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Client Request Forms</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Select request type to open the correct form.
        </p>
      </div>

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
              return (
                <button
                  key={rt.type}
                  type="button"
                  onClick={() => navigate(rt.path)}
                  className="p-5 rounded-xl border-2 text-left transition-all duration-150 border-border hover:border-primary/30 hover:bg-secondary/50"
                >
                  <div className={`h-10 w-10 rounded-lg ${rt.bg} border flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${rt.color}`} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{rt.type}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rt.description}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientFormsLanding;
