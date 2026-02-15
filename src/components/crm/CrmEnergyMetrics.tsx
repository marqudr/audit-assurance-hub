import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, ArrowRight } from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Lead } from "@/hooks/useLeads";

interface CrmEnergyMetricsProps {
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}

const ACTIVE_STATUSES = ["prospeccao", "qualificacao", "diagnostico", "proposta", "fechamento"];
const FUNNEL_ORDER = ["prospeccao", "qualificacao", "diagnostico", "proposta", "fechamento"];
const FUNNEL_LABELS: Record<string, string> = {
  prospeccao: "Prospecção",
  qualificacao: "Qualificação",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  fechamento: "Fechamento",
};

function formatBRL(val: number) {
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}K`;
  return `R$ ${val.toFixed(0)}`;
}

export function CrmEnergyMetrics({ leads, onCardClick }: CrmEnergyMetricsProps) {
  const activeLeads = useMemo(
    () => leads.filter((l) => ACTIVE_STATUSES.includes(l.status)),
    [leads]
  );

  // Top ICP leads
  const topIcp = useMemo(
    () =>
      [...activeLeads]
        .filter((l) => l.icp_score != null)
        .sort((a, b) => (b.icp_score || 0) - (a.icp_score || 0))
        .slice(0, 5),
    [activeLeads]
  );

  // Conversion funnel
  const funnel = useMemo(() => {
    const counts = FUNNEL_ORDER.map((phase) => ({
      phase,
      label: FUNNEL_LABELS[phase],
      count: leads.filter((l) => {
        const idx = FUNNEL_ORDER.indexOf(l.status);
        const phaseIdx = FUNNEL_ORDER.indexOf(phase);
        return idx >= phaseIdx || l.status === "ganho";
      }).length,
    }));
    return counts.map((c, i) => ({
      ...c,
      rate: i === 0 ? 100 : counts[0].count > 0 ? Math.round((c.count / counts[0].count) * 100) : 0,
    }));
  }, [leads]);

  // Average age
  const avgAge = useMemo(() => {
    if (activeLeads.length === 0) return 0;
    const now = new Date();
    const totalDays = activeLeads.reduce(
      (sum, l) => sum + differenceInDays(now, new Date(l.created_at)),
      0
    );
    return Math.round(totalDays / activeLeads.length);
  }, [activeLeads]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Gestão de Energia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top ICP */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Top Leads (ICP Score)</p>
            {topIcp.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Nenhum lead com ICP score</p>
            ) : (
              <div className="space-y-1">
                {topIcp.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => onCardClick(lead)}
                    className="flex items-center justify-between w-full text-xs hover:bg-muted/50 rounded px-1.5 py-1"
                  >
                    <span className="truncate font-medium">{lead.company_name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        ICP {lead.icp_score}
                      </Badge>
                      {lead.deal_value ? (
                        <span className="text-muted-foreground">{formatBRL(lead.deal_value)}</span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversion funnel */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Conversão por Etapa</p>
            <div className="space-y-1">
              {funnel.map((step, i) => (
                <div key={step.phase} className="flex items-center gap-1 text-xs">
                  <span className="w-20 truncate">{step.label}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${step.rate}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-muted-foreground">
                    {step.count} ({step.rate}%)
                  </span>
                  {i < funnel.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0 hidden sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Average age */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-1">Idade Média da Oportunidade</p>
            <p className="text-3xl font-bold">{avgAge}</p>
            <p className="text-xs text-muted-foreground">dias</p>
            {avgAge > 0 && (
              <div className="mt-2 space-y-0.5 text-xs w-full max-w-[200px]">
                {activeLeads
                  .filter((l) => differenceInDays(new Date(), new Date(l.created_at)) > avgAge * 2)
                  .slice(0, 3)
                  .map((l) => (
                    <button
                      key={l.id}
                      onClick={() => onCardClick(l)}
                      className="flex justify-between w-full text-muted-foreground hover:underline"
                    >
                      <span className="truncate">{l.company_name}</span>
                      <span className="text-red-500 font-medium shrink-0">
                        {differenceInDays(new Date(), new Date(l.created_at))}d
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
