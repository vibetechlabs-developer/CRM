import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewBusinessForm from "./NewBusinessForm";
import RenewalRequestForm from "./RenewalRequestForm";
import PolicyChangeForm from "./PolicyChangeForm";
import CancellationForm from "./CancellationForm";
import CustomerIssueForm from "./CustomerIssueForm";

const FORM_TITLES: Record<string, string> = {
  "new-policy": "New Policy",
  renewal: "Renewal",
  adjustment: "Adjustment",
  cancellation: "Cancellation",
  "customer-issue": "Customer Issue",
};

const ClientTicketForm = () => {
  const navigate = useNavigate();
  const { formType } = useParams<{ formType: string }>();

  const formContent = useMemo(() => {
    switch (formType) {
      case "new-policy":
        return <NewBusinessForm />;
      case "renewal":
        return <RenewalRequestForm />;
      case "adjustment":
        return <PolicyChangeForm />;
      case "cancellation":
        return <CancellationForm />;
      case "customer-issue":
        return <CustomerIssueForm />;
      default:
        return null;
    }
  }, [formType]);

  if (!formContent) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/new-ticket")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to request types
        </Button>
        <p className="text-sm text-muted-foreground">Invalid form type selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/new-ticket")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to request types
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          Request type: {formType ? FORM_TITLES[formType] ?? formType : "Unknown"}
        </p>
      </div>
      {formContent}
    </div>
  );
};

export default ClientTicketForm;
