import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { formatBRL, parseBRL } from "./NewLeadModal";
import { useUpdateLead, type Lead } from "@/hooks/useLeads";
import { toast } from "sonner";

interface TaxSimulatorProps {
  lead: Lead;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}K`;
  }
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function TaxSimulator({ lead }: TaxSimulatorProps) {
  const [headcount, setHeadcount] = useState(lead.engineering_headcount?.toString() || "");
  const [budget, setBudget] = useState(lead.rd_annual_budget ? formatBRL((lead.rd_annual_budget * 100).toString()) : "");
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<{ min: number; max: number } | null>(
    lead.estimated_benefit_min && lead.estimated_benefit_max
      ? { min: lead.estimated_benefit_min, max: lead.estimated_benefit_max }
      : null
  );
  const updateLead = useUpdateLead();

  const handleSimulate = async () => {
    const budgetNum = parseBRL(budget);
    if (!budgetNum || budgetNum <= 0) {
      toast.error("Informe um orçamento válido.");
      return;
    }
    setSimulating(true);
    // Simula delay de "IA"
    await new Promise((r) => setTimeout(r, 1500));
    const min = budgetNum * 0.205;
    const max = budgetNum * 0.34;
    setResult({ min, max });

    await updateLead.mutateAsync({
      id: lead.id,
      engineering_headcount: headcount ? parseInt(headcount) : null,
      rd_annual_budget: budgetNum,
      estimated_benefit_min: min,
      estimated_benefit_max: max,
    });
    setSimulating(false);
  };

  const handleGenerateProposal = async () => {
    await updateLead.mutateAsync({ id: lead.id, status: "proposta" as any });
    toast.success("Proposta gerada com sucesso!");
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold">Simulador de Potencial Fiscal</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="headcount">Qtd. de Engenheiros</Label>
          <Input
            id="headcount"
            type="number"
            placeholder="Ex: 25"
            value={headcount}
            onChange={(e) => setHeadcount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Orçamento Anual de P&D</Label>
          <Input
            id="budget"
            placeholder="R$ 0,00"
            value={budget}
            onChange={(e) => setBudget(formatBRL(e.target.value))}
          />
        </div>
      </div>
      <Button
        variant="ghost"
        className="text-primary"
        onClick={handleSimulate}
        disabled={simulating}
      >
        {simulating ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Simulando...</>
        ) : (
          <><Sparkles className="mr-2 h-4 w-4" /> Rodar Simulação IA</>
        )}
      </Button>

      {result && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Benefício Fiscal Estimado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(result.min)} – {formatCurrency(result.max)}
            </p>
            <p className="text-xs text-muted-foreground">
              Baseado na Lei 11.196 (Lei do Bem)
            </p>
            <Button variant="default" onClick={handleGenerateProposal} className="w-full mt-2">
              Gerar Proposta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
