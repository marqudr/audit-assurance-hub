import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Upload, Trash2, FileText, Loader2, X, ArrowLeft } from "lucide-react";
import { useCreateAgent, useUpdateAgent, useDeleteAgent, Agent } from "@/hooks/useAgents";
import { useRagFiles, useUploadRagFile, useDeleteRagFile, RagFile } from "@/hooks/useRagFiles";
import { supabase } from "@/integrations/supabase/client";

const AVAILABLE_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5",
  "openai/gpt-5-mini",
];

export default function AgentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [name, setName] = useState("");
  const [persona, setPersona] = useState("");
  const [instructions, setInstructions] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState("google/gemini-3-flash-preview");
  const [status, setStatus] = useState<"active" | "inactive" | "draft">("draft");

  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const { data: ragFiles, isLoading: loadingFiles } = useRagFiles(id);
  const uploadRagFile = useUploadRagFile();
  const deleteRagFile = useDeleteRagFile();

  const isSaving = createAgent.isPending || updateAgent.isPending;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        navigate("/agent-studio");
        return;
      }
      setName(data.name);
      setPersona(data.persona || "");
      setInstructions(data.instructions || "");
      setTemperature(Number(data.temperature));
      setModel((data.model_config as any)?.model || "google/gemini-3-flash-preview");
      setStatus(data.status as any);
      setLoading(false);
    })();
  }, [id, navigate]);

  const handleSave = async () => {
    const payload = {
      name,
      persona,
      instructions,
      temperature,
      model_config: { model },
      status,
    };

    if (isEditing) {
      await updateAgent.mutateAsync({ id, ...payload });
    } else {
      await createAgent.mutateAsync(payload as any);
    }
    navigate("/agent-studio");
  };

  const handleDelete = async () => {
    if (id) {
      await deleteAgent.mutateAsync(id);
      navigate("/agent-studio");
    }
  };

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || !id) return;
      for (const file of Array.from(files)) {
        await uploadRagFile.mutateAsync({ agentId: id, file });
      }
    },
    [id, uploadRagFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/agent-studio")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? "Editar Agente" : "Novo Agente"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Atualize a configuração deste agente." : "Configure seu novo agente de IA."}
          </p>
        </div>
      </div>

      {/* Section A: Basic Config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Configuração Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Nome</Label>
              <Input
                id="agent-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Auditor Agent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-persona">Persona</Label>
              <Input
                id="agent-persona"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="Ex: Especialista em auditoria fiscal"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="agent-instructions">Instruções (System Prompt)</Label>
            <Textarea
              id="agent-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Descreva o comportamento detalhado do agente..."
              className="min-h-[150px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Modelo LLM</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Temperatura: {temperature.toFixed(2)}</Label>
            <Slider
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v)}
              min={0}
              max={1}
              step={0.01}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Preciso</span>
              <span>Criativo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section B: RAG (only when editing) */}
      {isEditing && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Base de Conhecimento (RAG)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="rounded-md border-2 border-dashed border-border hover:border-primary/40 transition-colors p-6 text-center cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = ".pdf,.txt,.md,.csv,.json";
                input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files);
                input.click();
              }}
            >
              {uploadRagFile.isPending ? (
                <Loader2 className="h-6 w-6 mx-auto mb-2 text-primary animate-spin" />
              ) : (
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">Arraste arquivos aqui</p>
              <p className="text-xs text-muted-foreground">PDF, TXT, MD, CSV, JSON</p>
            </div>

            {loadingFiles ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : ragFiles && ragFiles.length > 0 ? (
              <div className="space-y-2">
                {ragFiles.map((f: RagFile) => (
                  <div key={f.id} className="flex items-center justify-between p-2.5 rounded-md border text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium text-xs truncate">{f.file_name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-muted-foreground">{formatFileSize(f.file_size || 0)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          deleteRagFile.mutate({ id: f.id, storagePath: f.storage_path, agentId: id! })
                        }
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum arquivo anexado.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pb-6">
        {isEditing ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir agente?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Todos os arquivos associados serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <div />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/agent-studio")}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar" : "Criar Agente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
