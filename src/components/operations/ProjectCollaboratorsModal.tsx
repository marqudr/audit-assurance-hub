import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useProjectCollaborators, useAddCollaborator, useDeleteCollaborator } from "@/hooks/useProjectCollaborators";

// Função para formatar CPF enquanto digita
const cpfMask = (value: string) => {
    return value
        .replace(/\D/g, '') // remove não números
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1'); // limita a 14 chars
};

const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '') return false;
    // Elimina CPFs invalidos conhecidos
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    // Valida 1o digito
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    // Valida 2o digito
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
};

const currencyMask = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (!v) return "";
    v = (parseInt(v) / 100).toFixed(2);
    v = v.replace(".", ",");
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    return v;
};

const parseCurrency = (value: string) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\./g, "").replace(",", "."));
};

interface ProjectCollaboratorsModalProps {
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProjectCollaboratorsModal({ projectId, open, onOpenChange }: ProjectCollaboratorsModalProps) {
    const { data: collaborators, isLoading } = useProjectCollaborators(projectId);
    const addMutation = useAddCollaborator();
    const deleteMutation = useDeleteCollaborator();

    const [isAdding, setIsAdding] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [cpf, setCpf] = useState("");
    const [role, setRole] = useState("");
    const [education, setEducation] = useState("");
    const [salary, setSalary] = useState("");
    const [charges, setCharges] = useState("");

    const resetForm = () => {
        setName("");
        setCpf("");
        setRole("");
        setEducation("");
        setSalary("");
        setCharges("");
        setIsAdding(false);
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) resetForm();
        onOpenChange(newOpen);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !cpf || !role) {
            toast({ title: "Preencha os campos obrigatórios (*)", variant: "destructive" });
            return;
        }

        if (!validateCPF(cpf)) {
            toast({ title: "CPF Inválido", description: "O CPF informado não é válido.", variant: "destructive" });
            return;
        }

        try {
            await addMutation.mutateAsync({
                project_id: projectId,
                name,
                cpf,
                role,
                education: education === "none" ? null : (education || null),
                monthly_salary: parseCurrency(salary) || 0,
                monthly_charges: parseCurrency(charges) || 0,
            });
            toast({ title: "Colaborador adicionado com sucesso!" });
            resetForm();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao adicionar";
            toast({ title: "Erro ao adicionar", description: errorMessage, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remover este colaborador do projeto?")) return;
        try {
            await deleteMutation.mutateAsync({ id, projectId });
            toast({ title: "Colaborador removido!" });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao remover";
            toast({ title: "Erro ao remover", description: errorMessage, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Gerenciar Colaboradores
                    </DialogTitle>
                    <DialogDescription>
                        Adicione e visualize a equipe alocada neste projeto.
                    </DialogDescription>
                </DialogHeader>

                {!isAdding ? (
                    <div className="space-y-4 pt-4">
                        <div className="flex justify-end">
                            <Button onClick={() => setIsAdding(true)} size="sm">
                                <Plus className="h-4 w-4 mr-1" /> Novo Colaborador
                            </Button>
                        </div>

                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Cargo/Função</TableHead>
                                        <TableHead className="text-right">Salário Mensal</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                            </TableCell>
                                        </TableRow>
                                    ) : collaborators && collaborators.length > 0 ? (
                                        collaborators.map((c) => (
                                            <TableRow key={c.id}>
                                                <TableCell>
                                                    <div className="font-medium">{c.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{c.cpf}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{c.role}</div>
                                                    {c.education && <div className="text-[10px] text-muted-foreground">{c.education}</div>}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    R$ {c.monthly_salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                                    {(c.monthly_charges > 0) && (
                                                        <div className="text-[10px] text-muted-foreground font-normal">
                                                            + R$ {c.monthly_charges.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} encargos
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                                                Nenhum colaborador alocado neste projeto.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome Completo *</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ex: João da Silva" />
                            </div>
                            <div className="space-y-2">
                                <Label>CPF *</Label>
                                <Input
                                    value={cpf}
                                    onChange={(e) => setCpf(cpfMask(e.target.value))}
                                    required
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo / Função *</Label>
                                <Input value={role} onChange={(e) => setRole(e.target.value)} required placeholder="Ex: Pesquisador Pleno" />
                            </div>
                            <div className="space-y-2">
                                <Label>Escolaridade</Label>
                                <Select value={education} onValueChange={setEducation}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a escolaridade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Não informada</SelectItem>
                                        <SelectItem value="Educação Superior Incompleta">Educação Superior Incompleta</SelectItem>
                                        <SelectItem value="Educação Superior Completa">Educação Superior Completa</SelectItem>
                                        <SelectItem value="Pós-Graduação Completa">Pós-Graduação Completa</SelectItem>
                                        <SelectItem value="Mestrado Completo">Mestrado Completo</SelectItem>
                                        <SelectItem value="Doutorado Completo">Doutorado Completo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Salário Mensal (R$)</Label>
                                <Input
                                    type="text"
                                    value={salary} onChange={(e) => setSalary(currencyMask(e.target.value))}
                                    placeholder="0,00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Encargos Mensais (R$)</Label>
                                <Input
                                    type="text"
                                    value={charges} onChange={(e) => setCharges(currencyMask(e.target.value))}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
                            <Button type="submit" disabled={addMutation.isPending}>
                                {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                                Salvar Colaborador
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
