import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { useLatestOutputs, useSavePhaseOutput } from "@/hooks/usePhaseOutputs";
import { toast } from "@/hooks/use-toast";

interface EditorPanelProps {
  projectId: string;
  phaseNumber: number;
}

export function EditorPanel({ projectId, phaseNumber }: EditorPanelProps) {
  const { humanOutput } = useLatestOutputs(projectId, phaseNumber);
  const saveMutation = useSavePhaseOutput();
  const [humanContent, setHumanContent] = useState("");

  useEffect(() => {
    setHumanContent(humanOutput?.content || "");
  }, [humanOutput]);

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({
        projectId,
        phaseNumber,
        versionType: "human",
        content: humanContent,
      });
      toast({ title: "Versão salva com sucesso" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <h3 className="text-sm font-semibold">Versão Final</h3>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
          Salvar
        </Button>
      </div>

      <div className="flex-1 p-3">
        <Textarea
          value={humanContent}
          onChange={(e) => setHumanContent(e.target.value)}
          className="h-full min-h-[300px] text-sm resize-none"
          placeholder="Escreva a versão final do documento desta fase..."
        />
      </div>
    </div>
  );
}
