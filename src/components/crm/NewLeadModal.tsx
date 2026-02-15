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
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useCreateLead, useCreateLeadContact } from "@/hooks/useLeads";
import { toast } from "sonner";

interface ContactInput {
  name: string;
  role: string;
  phone: string;
  email: string;
}

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

const emptyContact = (): ContactInput => ({ name: "", role: "", phone: "", email: "" });

export function NewLeadModal({ open, onOpenChange }: NewLeadModalProps) {
  const [cnpj, setCnpj] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cnae, setCnae] = useState("");
  const [sector, setSector] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enriched, setEnriched] = useState(false);

  // Endereço
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  // Regimes
  const [taxRegime, setTaxRegime] = useState("");
  const [fiscalRegime, setFiscalRegime] = useState("");

  // Contatos
  const [contacts, setContacts] = useState<ContactInput[]>([emptyContact()]);

  const createLead = useCreateLead();
  const createContact = useCreateLeadContact();

  const resetForm = () => {
    setCnpj(""); setCompanyName(""); setCnae(""); setSector("");
    setStreet(""); setNumber(""); setComplement(""); setNeighborhood("");
    setCity(""); setState(""); setZip("");
    setTaxRegime(""); setFiscalRegime("");
    setContacts([emptyContact()]);
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
          // Endereço
          setStreet(data.logradouro || "");
          setNumber(data.numero || "");
          setComplement(data.complemento || "");
          setNeighborhood(data.bairro || "");
          setCity(data.municipio || "");
          setState(data.uf || "");
          setZip(data.cep || "");
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

  const updateContact = (index: number, field: keyof ContactInput, value: string) => {
    setContacts((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addContact = () => setContacts((prev) => [...prev, emptyContact()]);
  const removeContact = (index: number) => setContacts((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!companyName.trim()) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    try {
      const lead = await createLead.mutateAsync({
        company_name: companyName,
        cnpj: cnpj.replace(/\D/g, "") || undefined,
        cnae: cnae || undefined,
        sector: sector || undefined,
        address_street: street || undefined,
        address_number: number || undefined,
        address_complement: complement || undefined,
        address_neighborhood: neighborhood || undefined,
        address_city: city || undefined,
        address_state: state || undefined,
        address_zip: zip || undefined,
        tax_regime: taxRegime || undefined,
        fiscal_regime: fiscalRegime || undefined,
      });

      // Criar contatos válidos
      const validContacts = contacts.filter((c) => c.name.trim());
      for (const c of validContacts) {
        await createContact.mutateAsync({
          lead_id: lead.id,
          name: c.name,
          role: c.role || undefined,
          phone: c.phone || undefined,
          email: c.email || undefined,
        });
      }

      toast.success("Lead cadastrado com sucesso!");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Erro ao criar lead.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* CNPJ */}
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <div className="relative">
              <Input id="cnpj" placeholder="00.000.000/0001-00" value={cnpj} onChange={(e) => handleCnpjChange(e.target.value)} disabled={enriching} />
              {enriching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
            </div>
            {enriching && <p className="text-xs text-muted-foreground">Enriquecendo dados da Receita Federal...</p>}
          </div>

          {/* Dados da empresa */}
          <div className="space-y-2">
            <Label htmlFor="company">Razão Social</Label>
            <Input id="company" placeholder="Nome da empresa" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cnae">CNAE</Label>
              <Input id="cnae" placeholder="Código CNAE" value={cnae} onChange={(e) => setCnae(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Setor</Label>
              <Input id="sector" placeholder="Setor de atuação" value={sector} onChange={(e) => setSector(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Regime Tributário</Label>
              <Select value={taxRegime} onValueChange={setTaxRegime}>
                <SelectTrigger><SelectValue placeholder="Selecione o regime" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                  <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                  <SelectItem value="Lucro Arbitrado">Lucro Arbitrado</SelectItem>
                  <SelectItem value="MEI">MEI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Regime Fiscal</Label>
              <Select value={fiscalRegime} onValueChange={setFiscalRegime}>
                <SelectTrigger><SelectValue placeholder="Selecione o regime" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cumulativo">Cumulativo</SelectItem>
                  <SelectItem value="Não Cumulativo">Não Cumulativo</SelectItem>
                  <SelectItem value="Misto">Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Endereço */}
          <h4 className="text-sm font-semibold">Endereço</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="street">Logradouro</Label>
              <Input id="street" placeholder="Rua, Av..." value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input id="number" placeholder="Nº" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" placeholder="Sala, andar..." value={complement} onChange={(e) => setComplement(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" placeholder="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">UF</Label>
              <Input id="state" placeholder="SP" maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">CEP</Label>
              <Input id="zip" placeholder="00000-000" value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
          </div>

          <Separator />

          {/* Contatos */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Contatos</h4>
            <Button type="button" variant="ghost" size="sm" onClick={addContact}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
          {contacts.map((contact, i) => (
            <div key={i} className="space-y-3 rounded-md border p-3 relative">
              {contacts.length > 1 && (
                <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeContact(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input placeholder="Nome do contato" value={contact.name} onChange={(e) => updateContact(i, "name", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cargo</Label>
                  <Input placeholder="Ex: Diretor de P&D" value={contact.role} onChange={(e) => updateContact(i, "role", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Telefone</Label>
                  <Input placeholder="(11) 99999-9999" value={contact.phone} onChange={(e) => updateContact(i, "phone", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">E-mail</Label>
                  <Input placeholder="contato@empresa.com" value={contact.email} onChange={(e) => updateContact(i, "email", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createLead.isPending}>
            {createLead.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</> : "Criar Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
