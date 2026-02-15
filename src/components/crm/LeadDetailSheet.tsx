import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TaxSimulator } from "./TaxSimulator";
import type { Lead } from "@/hooks/useLeads";

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  novo: { label: "Novo", className: "bg-blue-100 text-blue-800 border-blue-200" },
  qualificado: { label: "Qualificado", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  proposta: { label: "Proposta", className: "bg-purple-100 text-purple-800 border-purple-200" },
  ganho: { label: "Ganho", className: "bg-green-100 text-green-800 border-green-200" },
};

export function LeadDetailSheet({ lead, open, onOpenChange }: LeadDetailSheetProps) {
  if (!lead) return null;

  const status = statusConfig[lead.status] || statusConfig.novo;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Lead</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{lead.company_name}</h3>
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">CNPJ</span>
                <p className="font-medium">{lead.cnpj || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">CNAE</span>
                <p className="font-medium">{lead.cnae || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Setor</span>
                <p className="font-medium">{lead.sector || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Faixa de Receita</span>
                <p className="font-medium">{lead.revenue_range || "—"}</p>
              </div>
            </div>
          </div>
          <Separator />
          <TaxSimulator lead={lead} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
