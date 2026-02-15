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
import { Loader2 } from "lucide-react";
import { useCreateLead } from "@/hooks/useLeads";
import { toast } from "sonner";

interface NewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function NewLeadModal({ open, onOpenChange }: NewLeadModalProps) {
  const [cnpj, setCnpj] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnae, setCnae] = useState("");
  const [sector, setSector] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enriched, setEnriched] = useState(false);
  const createLead = useCreateLead();

  const resetForm = () => {
    setCnpj("");
    setCompanyName("");
    setCnae("");
    setSector("");
    setEnriched(false);
  };

  const handleCnpjChange = async (value: string) => {
    const formatted = formatCnpj(value);
    setCnpj(formatted);

    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 14 && !enriched) {
      setEnriching(true);
      try {
        const res = await fetch(`https://minhareceita.org/${digits}`);
        if (res.ok) {
          const data = await res.json();
          setCompanyName(data.razao_social || "");
          setCnae(String(data.cnae_fiscal || ""));
          setSector(data.cnae_fiscal_descricao || "");
          setEnriched(true);
        } else {
          toast.error("Não foi possível consultar o CNPJ. Preencha manualmente.");
        }
      } catch {
        toast.error("Erro ao conectar com a Receita Federal. Preencha manualmente.");
      } finally {
        setEnriching(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    try {
      await createLead.mutateAsync({
        company_name: companyName,
        cnpj: cnpj.replace(/\D/g, "") || undefined,
        cnae: cnae || undefined,
        sector: sector || undefined,
      });
      toast.success("Lead cadastrado com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao criar lead.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <div className="relative">
              <Input
                id="cnpj"
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                disabled={enriching}
              />
              {enriching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {enriching && (
              <p className="text-xs text-muted-foreground">
                Enriquecendo dados da Receita Federal...
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Razão Social</Label>
            <Input
              id="company"
              placeholder="Nome da empresa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnae">CNAE</Label>
              <Input
                id="cnae"
                placeholder="Código CNAE"
                value={cnae}
                onChange={(e) => setCnae(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Setor</Label>
              <Input
                id="sector"
                placeholder="Setor de atuação"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createLead.isPending}>
            {createLead.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</>
            ) : (
              "Criar Lead"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
