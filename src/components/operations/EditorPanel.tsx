import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { useLatestOutputs, useSavePhaseOutput } from "@/hooks/usePhaseOutputs";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface EditorPanelProps {
  projectId: string;
  phaseNumber: number;
  streamingContent: string;
}

export function EditorPanel({ projectId, phaseNumber, streamingContent }: EditorPanelProps) {
  const { aiOutput, humanOutput } = useLatestOutputs(projectId, phaseNumber);
  const saveMutation = useSavePhaseOutput();
  const [humanContent, setHumanContent] = useState("");
  const [tab, setTab] = useState("ai");

  useEffect(() => {
    setHumanContent(humanOutput?.content || "");
  }, [humanOutput]);

  const displayAi = streamingContent || aiOutput?.content || "";

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
      <Tabs value={tab} onValueChange={setTab} className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 pt-3">
          <TabsList className="h-8">
            <TabsTrigger value="ai" className="text-xs h-6">Versão IA</TabsTrigger>
            <TabsTrigger value="human" className="text-xs h-6">Versão Final</TabsTrigger>
          </TabsList>
          {tab === "human" && (
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
          )}
        </div>

        <TabsContent value="ai" className="flex-1 overflow-y-auto p-3 mt-0">
          {displayAi ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              <ReactMarkdown>{displayAi}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">
              Execute o agente para gerar conteúdo nesta fase.
            </p>
          )}
        </TabsContent>

        <TabsContent value="human" className="flex-1 p-3 mt-0">
          <Textarea
            value={humanContent}
            onChange={(e) => setHumanContent(e.target.value)}
            className="h-full min-h-[300px] text-sm resize-none"
            placeholder="Escreva a versão final do documento desta fase..."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
