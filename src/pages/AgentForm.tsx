import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Upload, Trash2, FileText, Loader2, X, ArrowLeft, Save } from "lucide-react";
import { useCreateAgent, useUpdateAgent, useDeleteAgent } from "@/hooks/useAgents";
import { useRagFiles, useUploadRagFile, useDeleteRagFile, RagFile } from "@/hooks/useRagFiles";
import { ChatPlayground } from "@/components/agent-studio/ChatPlayground";
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
  // Pending files for new agents (before first save)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();
  const { data: ragFiles, isLoading: loadingFiles } = useRagFiles(id);
  const uploadRagFile = useUploadRagFile();
  const deleteRagFile = useDeleteRagFile();

  const isSaving = createAgent.isPending || updateAgent.isPending;

  // Build live system prompt from current fields
  const liveSystemPrompt = [
    persona && `Persona: ${persona}`,
    instructions,
  ]
    .filter(Boolean)
    .join("\n\n") || "You are a helpful AI assistant.";

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
      const newAgent = await createAgent.mutateAsync(payload as any);
      // Upload pending files to the newly created agent
      if (pendingFiles.length > 0 && newAgent?.id) {
        for (const file of pendingFiles) {
          await uploadRagFile.mutateAsync({ agentId: newAgent.id, file });
        }
        setPendingFiles([]);
      }
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
      if (!files) return;
      if (isEditing && id) {
        for (const file of Array.from(files)) {
          await uploadRagFile.mutateAsync({ agentId: id, file });
        }
      } else {
        // Queue files for upload after agent creation
        setPendingFiles((prev) => [...prev, ...Array.from(files)]);
      }
    },
    [id, isEditing, uploadRagFile]
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/agent-studio")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-base font-semibold leading-tight">
              {isEditing ? name || "Editar Agente" : "Novo Agente"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditing ? "Editor & Playground" : "Configure seu novo agente"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive">
                  <Trash2 className="mr-1 h-3 w-3" />
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
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="h-7 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={isSaving || !name.trim()}>
            {isSaving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Split View */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Left: Configuration */}
        <ResizablePanel defaultSize={50} minSize={35}>
          <div className="h-full overflow-y-auto p-4 space-y-5">
            {/* Identity */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identity</h2>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="agent-name" className="text-xs">Nome</Label>
                  <Input
                    id="agent-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Auditor Agent"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="agent-persona" className="text-xs">Persona</Label>
                  <Textarea
                    id="agent-persona"
                    value={persona}
                    onChange={(e) => setPersona(e.target.value)}
                    placeholder="Ex: Você é um especialista em auditoria fiscal com 20 anos de experiência..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Core Instructions */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Core Instructions</h2>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Descreva o comportamento detalhado do agente... (System Prompt)"
                className="min-h-[180px] text-sm"
              />
            </section>

            <Separator />

            {/* Model Settings */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Model Settings</h2>
              <div className="space-y-1.5">
                <Label className="text-xs">Modelo LLM</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Temperatura: {temperature.toFixed(2)}</Label>
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
            </section>

            <Separator />

            {/* Knowledge Base */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Knowledge Base (RAG)</h2>

              <div
                className="rounded-md border-2 border-dashed border-border hover:border-primary/40 transition-colors p-4 text-center cursor-pointer"
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
                  <Loader2 className="h-5 w-5 mx-auto mb-1 text-primary animate-spin" />
                ) : (
                  <Upload className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                )}
                <p className="text-xs font-medium">Arraste arquivos aqui</p>
                <p className="text-[10px] text-muted-foreground">PDF, TXT, MD, CSV, JSON</p>
              </div>

              {/* Pending files (new agent, not yet saved) */}
              {!isEditing && pendingFiles.length > 0 && (
                <div className="space-y-1.5">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-md border text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="font-medium truncate">{f.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{formatFileSize(f.size)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => setPendingFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground text-center">
                    Serão enviados ao salvar o agente.
                  </p>
                </div>
              )}

              {/* Saved files (editing existing agent) */}
              {isEditing && (
                <>
                  {loadingFiles ? (
                    <div className="flex justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : ragFiles && ragFiles.length > 0 ? (
                    <div className="space-y-1.5">
                      {ragFiles.map((f: RagFile) => (
                        <div key={f.id} className="flex items-center justify-between p-2 rounded-md border text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{f.file_name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-muted-foreground">{formatFileSize(f.file_size || 0)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => deleteRagFile.mutate({ id: f.id, storagePath: f.storage_path, agentId: id! })}
                            >
                              <X className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground text-center py-2">
                      Nenhum arquivo anexado.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Playground Chat */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <ChatPlayground
            systemPrompt={liveSystemPrompt}
            model={model}
            temperature={temperature}
            agentName={name}
            agentId={id || "new"}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
