import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useCreateProject } from "@/hooks/useProjects";
import { formatBRL, parseBRL } from "./NewLeadModal";
import { toast } from "sonner";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  companyName: string;
}

export function NewProjectModal({ open, onOpenChange, leadId, companyName }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dealValue, setDealValue] = useState("");

  const createProject = useCreateProject();

  const resetForm = () => {
    setName("");
    setDescription("");
    setDealValue("");
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome do projeto.");
      return;
    }
    try {
      await createProject.mutateAsync({
        lead_id: leadId,
        name,
        description: description || undefined,
        deal_value: dealValue ? parseBRL(dealValue) : undefined,
      });
      toast.success("Projeto criado com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao criar projeto.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
          <p className="text-sm text-muted-foreground">Empresa: {companyName}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Nome do Projeto</Label>
            <Input
              id="project-name"
              placeholder="Ex: Lei do Bem 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Descrição</Label>
            <Textarea
              id="project-desc"
              placeholder="Descreva o projeto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-deal">Valor do Negócio</Label>
            <Input
              id="project-deal"
              placeholder="R$ 0,00"
              value={dealValue}
              onChange={(e) => setDealValue(formatBRL(e.target.value))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createProject.isPending}>
            {createProject.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</>
            ) : (
              "Criar Projeto"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
