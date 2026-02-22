import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Calculator, Info, Save, Banknote, Percent, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useProjectTaxBenefits, useSaveTaxBenefits, type ProjectTaxBenefits } from "@/hooks/useProjectTaxBenefits";
import { useProjectCollaborators } from "@/hooks/useProjectCollaborators";
import { useProjectTimeTracking } from "@/hooks/useProjectTimeTracking";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface ProjectBenefitCalculatorModalProps {
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Helper para BRL String -> Number
const parseBrlToNumber = (val: string) => {
    if (!val) return 0;
    const cleanStr = val.replace(/\./g, "").replace(",", ".");
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
};

// Helper para Number -> BRL String formatada
const formatNumberToBrlStr = (val: number) => {
    if (isNaN(val)) return "";
    return val.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper para parse de percentual frouxo
const parsePercent = (val: string) => {
    return parseFloat(val.replace(",", ".")) || 0;
};

export function ProjectBenefitCalculatorModal({ projectId, open, onOpenChange }: ProjectBenefitCalculatorModalProps) {
    const { data: savedBenefits, isLoading } = useProjectTaxBenefits(projectId);
    const saveMutation = useSaveTaxBenefits();

    const { data: collaborators } = useProjectCollaborators(projectId);
    const { data: timeTrackings } = useProjectTimeTracking(projectId);

    const calculatedRhCost = useMemo(() => {
        let cost = 0;
        if (collaborators && timeTrackings) {
            timeTrackings.forEach(t => {
                const collab = collaborators.find(c => c.id === t.collaborator_id);
                if (collab) {
                    const custoHora = (collab.monthly_salary + collab.monthly_charges) / 220;
                    cost += custoHora * t.hours;
                }
            });
        }
        return cost;
    }, [collaborators, timeTrackings]);

    // Formulário (Strings para o Input Mask)
    const [salaries, setSalaries] = useState("");
    const [equipments, setEquipments] = useState("");
    const [materials, setMaterials] = useState("");
    const [services, setServices] = useState("");
    const [depreciation, setDepreciation] = useState("");

    const [irpjRate, setIrpjRate] = useState("15");
    const [csllRate, setCsllRate] = useState("9");
    const [ipiRate, setIpiRate] = useState("0");
    const [ipiReduction, setIpiReduction] = useState("50");

    const [hasInitialized, setHasInitialized] = useState(false);

    // Popula quando a Query fetcher entregar algo ou inicializa defaults
    useEffect(() => {
        if (!open) {
            setHasInitialized(false);
            return;
        }

        if (open && !hasInitialized && !isLoading) {
            if (savedBenefits) {
                setSalaries(formatNumberToBrlStr(savedBenefits.salaries));
                setEquipments(formatNumberToBrlStr(savedBenefits.equipments));
                setMaterials(formatNumberToBrlStr(savedBenefits.materials));
                setServices(formatNumberToBrlStr(savedBenefits.services));
                setDepreciation(formatNumberToBrlStr(savedBenefits.depreciation));

                setIrpjRate(savedBenefits.irpj_rate.toString().replace(".", ","));
                setCsllRate(savedBenefits.csll_rate.toString().replace(".", ","));
                setIpiRate(savedBenefits.ipi_rate.toString().replace(".", ","));
                setIpiReduction(savedBenefits.ipi_reduction.toString().replace(".", ","));
            } else {
                // Se é a primeira vez, preenche automaticamente com as horas já apontadas
                if (calculatedRhCost > 0) {
                    setSalaries(formatNumberToBrlStr(calculatedRhCost));
                } else {
                    setSalaries("");
                }
                setEquipments("");
                setMaterials("");
                setServices("");
                setDepreciation("");
                setIrpjRate("15");
                setCsllRate("9");
                setIpiRate("0");
                setIpiReduction("50");
            }
            setHasInitialized(true);
        }
    }, [savedBenefits, isLoading, open, calculatedRhCost, hasInitialized]);

    // Aplica máscara BRL
    const handleCurrencyChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (!value) {
            setter("");
            return;
        }
        value = (parseInt(value, 10) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        setter(value);
    };

    // Cálculos em tempo real
    const math = useMemo(() => {
        const vSalaries = parseBrlToNumber(salaries);
        const vEquip = parseBrlToNumber(equipments);
        const vMat = parseBrlToNumber(materials);
        const vServ = parseBrlToNumber(services);
        const vDepr = parseBrlToNumber(depreciation);

        const rIrpj = parsePercent(irpjRate) / 100;
        const rCsll = parsePercent(csllRate) / 100;
        const rIpi = parsePercent(ipiRate) / 100;
        const rIpiRed = parsePercent(ipiReduction) / 100;

        const totalExpenses = vSalaries + vEquip + vMat + vServ + vDepr;
        const totalExclusion = totalExpenses; // Exclusão Adicional 100%

        const irpjEconomy = totalExclusion * rIrpj;
        const csllEconomy = totalExclusion * rCsll;
        const deprEconomy = vDepr * 0.15; // 15% sobre depreciação acelerada
        const ipiEconomy = vEquip * rIpi * rIpiRed; // Redução sobre a base de Equipamentos x Rate

        const totalBenefits = irpjEconomy + csllEconomy + deprEconomy + ipiEconomy;
        const roi = totalExpenses > 0 ? (totalBenefits / totalExpenses) * 100 : 0;

        return {
            totalExpenses,
            totalExclusion,
            irpjEconomy,
            csllEconomy,
            deprEconomy,
            ipiEconomy,
            totalBenefits,
            roi
        };
    }, [salaries, equipments, materials, services, depreciation, irpjRate, csllRate, ipiRate, ipiReduction]);

    const handleSave = async () => {
        try {
            const payload: ProjectTaxBenefits = {
                project_id: projectId,
                salaries: parseBrlToNumber(salaries),
                equipments: parseBrlToNumber(equipments),
                materials: parseBrlToNumber(materials),
                services: parseBrlToNumber(services),
                depreciation: parseBrlToNumber(depreciation),
                irpj_rate: parsePercent(irpjRate),
                csll_rate: parsePercent(csllRate),
                ipi_rate: parsePercent(ipiRate),
                ipi_reduction: parsePercent(ipiReduction)
            };

            await saveMutation.mutateAsync(payload);
            toast({ title: "Benefício calculado e salvo com sucesso" });
            onOpenChange(false);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
            toast({ title: "Erro na gravação", description: errorMessage, variant: "destructive" });
        }
    };

    const FM = (val: number) => val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        Calculadora do Benefício Fiscal - Lei do Bem
                    </DialogTitle>
                    <DialogDescription>
                        Insira as despesas enquadradas e alíquotas vigentes para simular e gravar os potenciais retornáveis (Art. 17 a 19, Lei 11.196/2005)
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        {/* INPUT SECTIONS */}
                        <div className="space-y-6">
                            {/* Despesas */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Banknote className="h-4 w-4 text-muted-foreground" />
                                    Despesas com P&D
                                </h3>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-xs">Salários e Encargos (R$)</Label>
                                        {calculatedRhCost > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 px-2 text-[10px] text-muted-foreground hover:text-primary"
                                                onClick={() => setSalaries(formatNumberToBrlStr(calculatedRhCost))}
                                                title="Sincronizar com as horas cadastradas no projeto"
                                                type="button"
                                            >
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                Sugerir RH (R$ {formatNumberToBrlStr(calculatedRhCost)})
                                            </Button>
                                        )}
                                    </div>
                                    <Input value={salaries} onChange={handleCurrencyChange(setSalaries)} placeholder="0,00" />
                                    <p className="text-[10px] text-muted-foreground">Salários + encargos sociais dos colaboradores dedicados a P&D</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Equipamentos e Instrumentos (R$)</Label>
                                    <Input value={equipments} onChange={handleCurrencyChange(setEquipments)} placeholder="0,00" />
                                    <p className="text-[10px] text-muted-foreground">Aquisição de equipamentos, máquinas e instrumentos para P&D</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Materiais de Consumo (R$)</Label>
                                    <Input value={materials} onChange={handleCurrencyChange(setMaterials)} placeholder="0,00" />
                                    <p className="text-[10px] text-muted-foreground">Materiais, insumos e componentes utilizados em P&D</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Serviços de Terceiros (R$)</Label>
                                    <Input value={services} onChange={handleCurrencyChange(setServices)} placeholder="0,00" />
                                    <p className="text-[10px] text-muted-foreground">Contratação de serviços técnicos especializados em P&D</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Depreciação de Equipamentos (R$)</Label>
                                    <Input value={depreciation} onChange={handleCurrencyChange(setDepreciation)} placeholder="0,00" />
                                    <p className="text-[10px] text-muted-foreground">Dedução Acelerada Integral na aquisição (Art. 17, §3º)</p>
                                </div>
                            </div>

                            <Separator />

                            {/* Alíquotas */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                    Alíquotas e Fatores (%)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">IRPJ (%)</Label>
                                        <Input value={irpjRate} onChange={(e) => setIrpjRate(e.target.value)} />
                                        <p className="text-[10px] text-muted-foreground">Ex: 15% (ou 25% com adicional)</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">CSLL (%)</Label>
                                        <Input value={csllRate} onChange={(e) => setCsllRate(e.target.value)} />
                                        <p className="text-[10px] text-muted-foreground">Ex: 9% padrão</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">IPI Médio (%)</Label>
                                        <Input value={ipiRate} onChange={(e) => setIpiRate(e.target.value)} />
                                        <p className="text-[10px] text-muted-foreground">Sobre Equipamentos</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs">Redução de IPI (%)</Label>
                                        <Input value={ipiReduction} onChange={(e) => setIpiReduction(e.target.value)} />
                                        <p className="text-[10px] text-muted-foreground">Até 50% (Art. 17, §1º)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RESULTS PANEL */}
                        <div className="space-y-6">
                            <Card className="bg-muted/50 border-primary/20">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <Info className="h-4 w-4 text-primary" />
                                        Benefícios Fiscais Calculados (Estimativa)
                                    </CardTitle>
                                    <CardDescription className="text-[11px]">
                                        Reflete a dedução potencial extra. Custo natural da atividade não incluído como benefício extra.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Total de Despesas Base (P&D):</span>
                                        <span className="font-medium">{FM(math.totalExpenses)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-t pt-2">
                                        <span className="text-muted-foreground">Exclusão Adicional (Art 19) - 100%:</span>
                                        <span className="font-medium text-blue-600">{FM(math.totalExclusion)}</span>
                                    </div>

                                    <div className="space-y-1 pl-3 border-l-2 border-primary/30 mt-2">
                                        <div className="flex justify-between items-center text-[13px]">
                                            <span className="text-muted-foreground">↳ Eco. IRPJ ({irpjRate}% sobre Exclusão):</span>
                                            <span className="font-semibold text-green-600">+{FM(math.irpjEconomy)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[13px]">
                                            <span className="text-muted-foreground">↳ Eco. CSLL ({csllRate}% sobre Exclusão):</span>
                                            <span className="font-semibold text-green-600">+{FM(math.csllEconomy)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm pt-2">
                                        <span className="text-muted-foreground">Deprec. Acelerada (Ref. 15%):</span>
                                        <span className="font-semibold text-green-600">+{FM(math.deprEconomy)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Redução IPI (Até 50%):</span>
                                        <span className="font-semibold text-green-600">+{FM(math.ipiEconomy)}</span>
                                    </div>

                                    <div className="flex justify-between items-center font-bold text-base border-t border-primary/20 pt-3 mt-3">
                                        <span>TOTAL DE BENEFÍCIOS:</span>
                                        <span className="text-primary">{FM(math.totalBenefits)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary/5 border-primary/30">
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-sm font-bold">Resumo Executivo</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-medium uppercase text-muted-foreground">Investimento Estimado P&D</span>
                                        <span className="text-xl font-bold">{FM(math.totalExpenses)}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-medium uppercase text-muted-foreground">Retorno Total Lei do Bem</span>
                                            <span className="text-lg font-bold text-green-600">{FM(math.totalBenefits)}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[11px] font-medium uppercase text-muted-foreground">ROI (Retorno s/ Invest.)</span>
                                            <span className="text-lg font-bold text-green-600">{math.roi.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>
                    </div>
                )}

                <DialogFooter className="pt-4 mt-2 border-t sm:justify-between items-center">
                    <p className="text-[10px] text-muted-foreground hidden sm:block">
                        * Cálculos simulados com base nas diretrizes da Lei 11.196/05
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saveMutation.isPending || isLoading}>
                            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Salvar e Calcular no Projeto
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
