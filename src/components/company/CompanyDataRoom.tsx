import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyAttachments } from "@/hooks/useProjectAttachments";
import { toast } from "sonner";

interface CompanyDataRoomProps {
  leadId: string;
}

const statusLabels: Record<string, string> = {
  qualificacao: "Qualificação",
  diagnostico: "Diagnóstico",
  proposta: "Proposta",
  fechamento: "Fechamento",
  ganho: "Ganho",
  perdido: "Perdido",
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CompanyDataRoom({ leadId }: CompanyDataRoomProps) {
  const { data: attachments = [], isLoading } = useCompanyAttachments(leadId);

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

  // Group by project
  const grouped = attachments.reduce((acc, att: any) => {
    const key = att.project_name || "Sem projeto";
    if (!acc[key]) acc[key] = [];
    acc[key].push(att);
    return acc;
  }, {} as Record<string, any[]>);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground mt-4">Carregando documentos...</p>;
  }

  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FolderOpen className="h-10 w-10 mb-2" />
        <p className="text-sm">Nenhum documento no Data Room.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {Object.entries(grouped).map(([projectName, files]) => (
        <Card key={projectName}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> {projectName}
              <Badge variant="secondary" className="text-[10px]">{files.length} arquivo(s)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {files.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-xs group">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{a.file_name}</span>
                  <span className="text-muted-foreground shrink-0">{formatFileSize(a.file_size)}</span>
                  {a.phase && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {statusLabels[a.phase] || a.phase}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground">{format(new Date(a.created_at), "dd/MM/yy")}</span>
                  <Button
                    variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDownload(a.storage_path, a.file_name)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
