import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Download, Trash2, Loader2 } from "lucide-react";
import { useProjectAttachments, useUploadAttachment, useDeleteAttachment } from "@/hooks/useProjectAttachments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const CATEGORIES = [
  { value: "balanco", label: "Balanço" },
  { value: "folha_pagamento", label: "Folha de Pagamento" },
  { value: "contrato", label: "Contrato" },
  { value: "nota_fiscal", label: "Nota Fiscal" },
  { value: "relatorio_tecnico", label: "Relatório Técnico" },
  { value: "outro", label: "Outro" },
];

interface DataRoomPanelProps {
  projectId: string;
  phaseNumber: number;
}

export function DataRoomPanel({ projectId, phaseNumber }: DataRoomPanelProps) {
  const { data: attachments, isLoading } = useProjectAttachments(projectId);
  const uploadMutation = useUploadAttachment();
  const deleteMutation = useDeleteAttachment();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("outro");

  // Show all files — filtering by phase is optional for data room
  const files = attachments || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMutation.mutateAsync({ projectId, file, phase: undefined });
      toast({ title: "Arquivo enviado com sucesso" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("project-files").createSignedUrl(storagePath, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Erro ao baixar", variant: "destructive" });
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = fileName;
    a.click();
  };

  const handleDelete = async (id: string, storagePath: string) => {
    try {
      await deleteMutation.mutateAsync({ id, storagePath, projectId });
      toast({ title: "Arquivo removido" });
    } catch (err: any) {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-sm font-semibold">Data Room</h3>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
          Upload
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.xml,.xlsx,.xls,.csv,.doc,.docx,.txt"
          onChange={handleUpload}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && files.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Nenhum arquivo no Data Room</p>
            <p className="text-[10px]">Faça upload de evidências (PDF, XML, XLSX)</p>
          </div>
        )}
        {files.map((f) => (
          <div key={f.id} className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors group">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{f.file_name}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatSize(f.file_size)} · {format(new Date(f.created_at), "dd/MM/yy")}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleDownload(f.storage_path, f.file_name)}
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={() => handleDelete(f.id, f.storage_path)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
