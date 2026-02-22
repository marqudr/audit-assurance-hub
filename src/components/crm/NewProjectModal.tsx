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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCreateProject } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { toast } from "sonner";
import { NewLeadModal } from "./NewLeadModal";

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // leadId and companyName are now optional because the user might select them inside
  leadId?: string;
  companyName?: string;
}

const classificationOptions = [
  "Pesquisa Básica (PB)",
  "Pesquisa Aplicada (PA)",
  "Desenvolvimento Experimental (DE)",
  "Tecnologia Industrial Básica (TIB)",
  "Serviço de Apoio Técnico (SAT)",
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export function NewProjectModal({ open, onOpenChange, leadId: initialLeadId, companyName: initialCompanyName }: NewProjectModalProps) {
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const createProject = useCreateProject();

  const [selectedLeadId, setSelectedLeadId] = useState(initialLeadId || "");
  const [name, setName] = useState("");
  const [classification, setClassification] = useState("");
  const [objective, setObjective] = useState("");
  const [innovation, setInnovation] = useState("");
  const [technicalChallenges, setTechnicalChallenges] = useState("");
  const [techLead, setTechLead] = useState("");
  const [baseYear, setBaseYear] = useState<string>(currentYear.toString());

  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);

  const resetForm = () => {
    setSelectedLeadId(initialLeadId || "");
    setName("");
    setClassification("");
    setObjective("");
    setInnovation("");
    setTechnicalChallenges("");
    setTechLead("");
    setBaseYear(currentYear.toString());
  };

  const handleSubmit = async () => {
    if (!selectedLeadId) {
      toast.error("Selecione uma empresa para o projeto.");
      return;
    }
    if (!name.trim()) {
      toast.error("Informe o nome do projeto.");
      return;
    }

    try {
      await createProject.mutateAsync({
        lead_id: selectedLeadId,
        name,
        status: "qualificacao",
        classification: classification || undefined,
        objective: objective || undefined,
        innovation: innovation || undefined,
        technical_challenges: technicalChallenges || undefined,
        tech_lead: techLead || undefined,
        base_year: baseYear ? parseInt(baseYear, 10) : undefined,
      });

      toast.success("Projeto criado com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao criar projeto.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Seleção de Empresa */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="company">Empresa (Lead)</Label>
                {!initialLeadId && (
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => setNewLeadModalOpen(true)}
                  >
                    Cadastrar nova empresa
                  </Button>
                )}
              </div>
              {initialLeadId ? (
                <Input disabled value={initialCompanyName || ""} />
              ) : (
                <Select value={selectedLeadId} onValueChange={setSelectedLeadId} disabled={leadsLoading}>
                  <SelectTrigger id="company">
                    <SelectValue placeholder={leadsLoading ? "Carregando..." : "Selecione a empresa"} />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.company_name} {lead.cnpj ? `(${lead.cnpj})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Nome do Projeto */}
            <div className="space-y-2">
              <Label htmlFor="projectName">Nome do Projeto</Label>
              <Input
                id="projectName"
                placeholder="Ex: P&D de Novo Algoritmo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Classificação & Ano Base */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Classificação</Label>
                <Select value={classification} onValueChange={setClassification}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classificação" />
                  </SelectTrigger>
                  <SelectContent>
                    {classificationOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano Base</Label>
                <Select value={baseYear} onValueChange={setBaseYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Líder Técnico */}
            <div className="space-y-2">
              <Label htmlFor="techLead">Líder Técnico</Label>
              <Input
                id="techLead"
                placeholder="Nome do líder do projeto"
                value={techLead}
                onChange={(e) => setTechLead(e.target.value)}
              />
            </div>

            {/* TextAreas de Descrição/Lei do Bem */}
            <div className="space-y-2">
              <Label htmlFor="objective">Objetivo do Projeto</Label>
              <Textarea
                id="objective"
                placeholder="Qual o objetivo principal deste projeto?"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="innovation">Inovação</Label>
              <Textarea
                id="innovation"
                placeholder="Descreva a novidade e os saltos tecnológicos envolvidos."
                value={innovation}
                onChange={(e) => setInnovation(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technicalChallenges">Desafios Técnicos</Label>
              <Textarea
                id="technicalChallenges"
                placeholder="Quais as incertezas e barreiras técnicas enfrentadas?"
                value={technicalChallenges}
                onChange={(e) => setTechnicalChallenges(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createProject.isPending}>
              {createProject.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Secundário de Nova Empresa */}
      <NewLeadModal open={newLeadModalOpen} onOpenChange={setNewLeadModalOpen} />
    </>
  );
}
