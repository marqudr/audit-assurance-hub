import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, Clock, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useProjectCollaborators } from "@/hooks/useProjectCollaborators";
import {
    useProjectTimeTracking,
    useAddTimeTracking,
    useDeleteTimeTracking,
} from "@/hooks/useProjectTimeTracking";

interface ProjectTimeTrackingModalProps {
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const MONTHS = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
];

export function ProjectTimeTrackingModal({ projectId, open, onOpenChange }: ProjectTimeTrackingModalProps) {
    const { data: collaborators, isLoading: loadingCollaborators } = useProjectCollaborators(projectId);
    const { data: timeTrackings, isLoading: loadingTracking } = useProjectTimeTracking(projectId);

    const addMutation = useAddTimeTracking();
    const deleteMutation = useDeleteTimeTracking();

    const currentMonth = (new Date().getMonth() + 1).toString();
    const currentYear = new Date().getFullYear().toString();

    const [collaboratorId, setCollaboratorId] = useState<string>("");
    const [month, setMonth] = useState<string>(currentMonth);
    const [year, setYear] = useState<string>(currentYear);
    const [hours, setHours] = useState<string>("");
    const [description, setDescription] = useState<string>("");

    // Auto-select first collaborator if there's only one or none selected yet
    useEffect(() => {
        if (collaborators && collaborators.length === 1 && !collaboratorId) {
            setCollaboratorId(collaborators[0].id);
        }
    }, [collaborators, collaboratorId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!collaboratorId || !month || !year || !hours) {
            toast({ title: "Preencha todos os campos obrigatórios (*)", variant: "destructive" });
            return;
        }

        const numericHours = parseFloat(hours.replace(",", "."));
        if (isNaN(numericHours) || numericHours <= 0) {
            toast({ title: "Horas inválidas", description: "Insira um valor numérico válido maior que zero.", variant: "destructive" });
            return;
        }

        try {
            await addMutation.mutateAsync({
                project_id: projectId,
                collaborator_id: collaboratorId,
                month: parseInt(month),
                year: parseInt(year),
                hours: numericHours,
                description,
            });
            toast({ title: "Apontamento registrado com sucesso!" });
            // Deixa Mês/Ano/Colaborador intactos para rápida inclusão em lote
            setHours("");
            setDescription("");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao registrar apontamento";
            toast({ title: "Erro ao adicionar", description: errorMessage, variant: "destructive" });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remover este apontamento?")) return;
        try {
            await deleteMutation.mutateAsync({ id, projectId });
            toast({ title: "Apontamento removido!" });
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido ao remover";
            toast({ title: "Erro ao remover", description: errorMessage, variant: "destructive" });
        }
    };

    // Helper map to quickly get collaborator name
    const collaboratorMap = useMemo(() => {
        const map = new Map<string, string>();
        collaborators?.forEach(c => map.set(c.id, c.name));
        return map;
    }, [collaborators]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Apontamento de Horas
                    </DialogTitle>
                    <DialogDescription>
                        Registre as horas dedicadas pelos membros deste projeto (fluxo contínuo).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* Add Form (Inline Workflow) */}
                    <div className="bg-muted/30 p-4 rounded-lg border">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-12 gap-3 items-end">
                                <div className="col-span-12 sm:col-span-4 space-y-1.5">
                                    <Label className="text-xs font-semibold">Colaborador *</Label>
                                    <Select value={collaboratorId} onValueChange={setCollaboratorId}>
                                        <SelectTrigger disabled={loadingCollaborators}>
                                            <SelectValue placeholder="Selecione um membro..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {collaborators?.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name} - {c.role}</SelectItem>
                                            ))}
                                            {collaborators?.length === 0 && (
                                                <SelectItem value="none" disabled>Nenhum membro alocado</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-6 sm:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-semibold">Mês *</Label>
                                    <Select value={month} onValueChange={setMonth}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MONTHS.map(m => (
                                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-6 sm:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-semibold">Ano *</Label>
                                    <Input
                                        type="number"
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        min="2000"
                                        max="2100"
                                    />
                                </div>
                                <div className="col-span-12 sm:col-span-2 space-y-1.5">
                                    <Label className="text-xs font-semibold">Horas *</Label>
                                    <Input
                                        type="text"
                                        value={hours}
                                        onChange={(e) => setHours(e.target.value.replace(/[^0-9,.]/g, ''))}
                                        placeholder="Ex: 8.5"
                                    />
                                </div>
                                <div className="col-span-12 sm:col-span-2">
                                    <Button type="submit" className="w-full" disabled={addMutation.isPending || !collaboratorId}>
                                        {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                        Lançar
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold">Descrição das atividades</Label>
                                <Input
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descreva as tarefas realizadas pelo colaborador..."
                                />
                            </div>
                        </form>
                    </div>

                    {/* History Table */}
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Colaborador</TableHead>
                                    <TableHead>Período</TableHead>
                                    <TableHead>Horas</TableHead>
                                    <TableHead>Atividades</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingTracking ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-6">
                                            <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : timeTrackings && timeTrackings.length > 0 ? (
                                    timeTrackings.map((t) => (
                                        <TableRow key={t.id}>
                                            <TableCell className="font-medium text-sm">
                                                {collaboratorMap.get(t.collaborator_id) || "Colaborador Removido"}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {MONTHS.find(m => m.value === t.month.toString())?.label}/{t.year}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {t.hours}h
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate" title={t.description}>
                                                {t.description || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive opacity-50 hover:opacity-100"
                                                    onClick={() => handleDelete(t.id)}
                                                    title="Excluir apontamento"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                                            Nenhum lançamento de horas encontrado para este projeto.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
