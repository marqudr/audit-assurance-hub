import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PHASE_CHECKLIST, useLeadChecklist, useToggleChecklistItem } from "@/hooks/useLeadChecklist";
import type { LeadStatus } from "@/hooks/useLeads";

interface PhaseChecklistProps {
  leadId: string;
  phase: LeadStatus;
}

export function PhaseChecklist({ leadId, phase }: PhaseChecklistProps) {
  const { data: checklist = [] } = useLeadChecklist(leadId);
  const toggleItem = useToggleChecklistItem();
  const items = PHASE_CHECKLIST[phase] || [];

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold">Checklist da Fase</h4>
      <div className="space-y-2">
        {items.map((item) => {
          const isChecked = item.locked || checklist.some(
            (c) => c.phase === phase && c.item_key === item.key && c.completed
          );
          return (
            <div key={item.key} className="flex items-center gap-2">
              <Checkbox
                id={`${leadId}-${item.key}`}
                checked={isChecked}
                disabled={item.locked || toggleItem.isPending}
                onCheckedChange={(checked) => {
                  toggleItem.mutate({
                    leadId,
                    phase,
                    itemKey: item.key,
                    completed: !!checked,
                  });
                }}
              />
              <Label
                htmlFor={`${leadId}-${item.key}`}
                className="text-sm cursor-pointer"
              >
                {item.label}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
