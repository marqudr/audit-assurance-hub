import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, ArrowRight } from "lucide-react";

const stages = ["Prospect", "Qualified", "Proposal", "Negotiation", "Won", "Handover"];

const leads = [
  { id: 1, company: "MegaCorp Ltda", value: "R$ 450K", stage: "Prospect", complexity: "High" },
  { id: 2, company: "Industria Beta", value: "R$ 280K", stage: "Prospect", complexity: "Medium" },
  { id: 3, company: "TechServ S.A.", value: "R$ 620K", stage: "Qualified", complexity: "High" },
  { id: 4, company: "Retail Alpha", value: "R$ 180K", stage: "Qualified", complexity: "Low" },
  { id: 5, company: "FinanceGroup", value: "R$ 890K", stage: "Proposal", complexity: "High" },
  { id: 6, company: "LogisTech", value: "R$ 320K", stage: "Negotiation", complexity: "Medium" },
  { id: 7, company: "EnergyPlus", value: "R$ 1.2M", stage: "Negotiation", complexity: "High" },
  { id: 8, company: "DataCorp", value: "R$ 550K", stage: "Won", complexity: "Medium" },
  { id: 9, company: "BioHealth", value: "R$ 750K", stage: "Won", complexity: "High" },
  { id: 10, company: "AutoParts Inc", value: "R$ 190K", stage: "Handover", complexity: "Low" },
];

const CRM = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM Pipeline</h1>
        <p className="text-sm text-muted-foreground">Sales pipeline and lead management</p>
      </div>

      {/* Stage summary */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {stages.map((stage, i) => (
          <div key={stage} className="flex items-center">
            <div className="px-3 py-1.5 rounded-md bg-card border text-xs font-medium whitespace-nowrap">
              {stage}
              <Badge variant="secondary" className="ml-2 text-[10px] px-1.5">
                {leads.filter((l) => l.stage === stage).length}
              </Badge>
            </div>
            {i < stages.length - 1 && <ArrowRight className="h-3 w-3 mx-1 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-6 gap-3 overflow-x-auto min-w-[900px]">
        {stages.map((stage) => (
          <div key={stage} className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
              {stage}
            </div>
            {leads
              .filter((l) => l.stage === stage)
              .map((lead) => (
                <Card key={lead.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-3 space-y-2">
                    <p className="text-sm font-medium leading-tight">{lead.company}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {lead.value}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          lead.complexity === "High"
                            ? "border-danger/30 text-danger"
                            : lead.complexity === "Medium"
                            ? "border-warning/30 text-warning"
                            : "border-success/30 text-success"
                        }`}
                      >
                        {lead.complexity}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CRM;
