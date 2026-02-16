import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { useProjectAttachments, useUploadAttachment } from "@/hooks/useProjectAttachments";
import { getClientFriendlyStatus } from "@/hooks/useClientPortal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Download,
  Upload,
  FileText,
  Loader2,
} from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const PHASE_NAMES = [
  "Elegibilidade",
  "Diagnóstico Técnico",
  "Rastreabilidade",
  "Memória de Cálculo",
  "Engenharia de Narrativa",
  "Stress Test",
  "Transmissão",
];

const ACCEPTED_TYPES = ".pdf,.xml,.xlsx,.xls,.csv,.doc,.docx";

export default function PortalProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["portal-project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Phases
  const { data: phases, isLoading: phasesLoading } = useProjectPhases(projectId);

  // Approved human outputs only (RLS handles filtering)
  const { data: outputs } = useQuery({
    queryKey: ["portal-outputs", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phase_outputs")
        .select("*")
        .eq("project_id", projectId!)
        .order("phase_number");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Attachments
  const { data: attachments } = useProjectAttachments(projectId);
  const uploadMutation = useUploadAttachment();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Limite de 20MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      await uploadMutation.mutateAsync({ projectId, file });
      toast({ title: "Arquivo enviado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("project-files")
      .createSignedUrl(storagePath, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Erro ao baixar arquivo", variant: "destructive" });
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = fileName;
    a.click();
  };

  const phaseIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-primary" />;
      case "review":
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground/40" />;
    }
  };

  if (projectLoading || phasesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Projeto não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/portal/projetos")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      {/* Estimated benefit */}
      {project.estimated_benefit_min && (
        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Benefício Estimado</span>
            <span className="text-lg font-bold font-mono text-success">
              {Number(project.estimated_benefit_min).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Phase Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progresso do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PHASE_NAMES.map((name, idx) => {
              const phase = phases?.find((p) => p.phase_number === idx + 1);
              const status = phase?.status ?? "not_started";
              const output = outputs?.find((o) => o.phase_number === idx + 1);

              return (
                <div key={idx} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    {phaseIcon(status)}
                    {idx < 6 && (
                      <div
                        className={`w-0.5 h-8 mt-1 ${
                          status === "approved" ? "bg-success" : "bg-border"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        Fase {idx + 1}: {name}
                      </p>
                      <Badge
                        variant="outline"
                        className={
                          status === "approved"
                            ? "bg-success/10 text-success border-success/20"
                            : status === "review"
                            ? "bg-warning/10 text-warning border-warning/20"
                            : status === "in_progress"
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {getClientFriendlyStatus(status)}
                      </Badge>
                    </div>
                    {/* Download final output if available */}
                    {output && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Relatório final disponível
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            // Content is stored as text, offer as download
                            const blob = new Blob([output.content], { type: "text/plain" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `${name.replace(/\s+/g, "_")}_relatorio.txt`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Baixar Relatório
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Data Room */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Data Room</CardTitle>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Enviar Documento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!attachments || attachments.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum documento enviado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{att.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(att.created_at).toLocaleDateString("pt-BR")}
                        {att.file_size && ` · ${(att.file_size / 1024).toFixed(0)} KB`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleDownload(att.storage_path, att.file_name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
