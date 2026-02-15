import { useEffect, useState, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { Upload, Trash2, FileText, Loader2, X } from "lucide-react";
import { Agent, useCreateAgent, useUpdateAgent, useDeleteAgent } from "@/hooks/useAgents";
import { useRagFiles, useUploadRagFile, useDeleteRagFile, RagFile } from "@/hooks/useRagFiles";

const AVAILABLE_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5",
  "openai/gpt-5-mini",
];

interface AgentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null; // null = create mode
}

export function AgentDrawer({ open, onOpenChange, agent }: AgentDrawerProps) {
  const [name, setName] = useState("");
  const [persona, setPersona] = useState("");
  const [instructions, setInstructions] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState("google/gemini-3-flash-preview");
  const [status, setStatus] = useState<"active" | "inactive" | "draft">("draft");

  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const { data: ragFiles, isLoading: loadingFiles } = useRagFiles(agent?.id);
  const uploadRagFile = useUploadRagFile();
  const deleteRagFile = useDeleteRagFile();

  const isEditing = !!agent;
  const isSaving = createAgent.isPending || updateAgent.isPending;

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setPersona(agent.persona || "");
      setInstructions(agent.instructions || "");
      setTemperature(Number(agent.temperature));
      setModel((agent.model_config as any)?.model || "google/gemini-3-flash-preview");
      setStatus(agent.status);
    } else {
      setName("");
      setPersona("");
      setInstructions("");
      setTemperature(0.7);
      setModel("google/gemini-3-flash-preview");
      setStatus("draft");
    }
  }, [agent, open]);

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
      await updateAgent.mutateAsync({ id: agent.id, ...payload });
    } else {
      await createAgent.mutateAsync(payload as any);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (agent) {
      await deleteAgent.mutateAsync(agent.id);
      onOpenChange(false);
    }
  };

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || !agent) return;
      for (const file of Array.from(files)) {
        await uploadRagFile.mutateAsync({ agentId: agent.id, file });
      }
    },
    [agent, uploadRagFile]
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Editar Agente" : "Novo Agente"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Atualize a configuração deste agente."
              : "Configure seu novo agente de IA."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Section A: Basic Config */}
          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="agent-instructions">Instruções (System Prompt)</Label>
              <Textarea
                id="agent-instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Descreva o comportamento detalhado do agente..."
                className="min-h-[120px]"
              />
            </div>

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
          </div>

          <Separator />

          {/* Section B: RAG Knowledge Base (only when editing) */}
          {isEditing && (
            <div className="space-y-4">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Base de Conhecimento (RAG)
              </Label>

              {/* Drop zone */}
              <div
                className="rounded-md border-2 border-dashed border-border hover:border-primary/40 transition-colors p-6 text-center cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.multiple = true;
                  input.accept = ".pdf,.txt,.md,.csv,.json";
                  input.onchange = (e) =>
                    handleFileUpload((e.target as HTMLInputElement).files);
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

              {/* File list */}
              {loadingFiles ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : ragFiles && ragFiles.length > 0 ? (
                <div className="space-y-2">
                  {ragFiles.map((f: RagFile) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2.5 rounded-md border text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium text-xs truncate">{f.file_name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {formatFileSize(f.file_size || 0)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRagFile.mutate({
                              id: f.id,
                              storagePath: f.storage_path,
                              agentId: agent.id,
                            });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhum arquivo anexado.
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Section C: Status */}
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

        <SheetFooter className="flex gap-2 pt-4">
          {isEditing && (
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
          )}
          <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar" : "Criar Agente"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
