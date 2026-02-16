import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useProjectAttachments } from "@/hooks/useProjectAttachments";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { usePhaseOutputs } from "@/hooks/usePhaseOutputs";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const CRM_PHASES = ["prospeccao", "qualificacao", "diagnostico", "proposta", "fechamento", "ganho", "perdido", "novo", "qualificado"];

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useAllPhaseOutputs(projectId: string) {
  return useQuery({
    queryKey: ["all-phase-outputs", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phase_outputs")
        .select("*")
        .eq("project_id", projectId)
        .eq("version_type", "human")
        .order("phase_number");
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

export function ProjectDataRoomTab({ projectId }: { projectId: string }) {
  const { data: allAttachments = [], isLoading: attLoading } = useProjectAttachments(projectId);
  const { data: phases = [] } = useProjectPhases(projectId);
  const { data: outputs = [], isLoading: outLoading } = useAllPhaseOutputs(projectId);

  // Filter only operational attachments (phase IS NULL = uploaded in operations workspace)
  const operationalAttachments = allAttachments.filter((a) => !a.phase || !CRM_PHASES.includes(a.phase));

  const handleDownload = async (storagePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("project-files").download(storagePath);
    if (error) { toast.error("Erro ao baixar arquivo"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = attLoading || outLoading;

  if (isLoading) return <p className="text-sm text-muted-foreground mt-4">Carregando documentos...</p>;

  if (operationalAttachments.length === 0 && outputs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FolderOpen className="h-10 w-10 mb-2" />
        <p className="text-sm">Nenhum documento operacional.</p>
      </div>
    );
  }

  const phaseMap = Object.fromEntries(phases.map((p) => [p.phase_number, p.phase_name]));

  return (
    <div className="space-y-4 mt-4">
      {/* Attachments */}
      {operationalAttachments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Arquivos Anexados
              <Badge variant="secondary" className="text-[10px]">{operationalAttachments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {operationalAttachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs group">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{a.file_name}</span>
                  <span className="text-muted-foreground shrink-0">{formatFileSize(a.file_size)}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yy")}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDownload(a.storage_path, a.file_name)}>
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Phase outputs as docs */}
      {outputs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Documentos Produzidos (Fases)
              <Badge variant="secondary" className="text-[10px]">{outputs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {outputs.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium">Fase {o.phase_number}: {phaseMap[o.phase_number] || `Fase ${o.phase_number}`}</span>
                  <Badge variant="default" className="text-[10px]">Versão Final</Badge>
                </div>
                <span className="text-muted-foreground">{format(new Date(o.created_at), "dd/MM/yy")}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
