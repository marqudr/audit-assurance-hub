import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClientProfile } from "@/hooks/useClientPortal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProjectRequestModal({ open, onOpenChange }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const { user } = useAuth();
  const { data: profile } = useClientProfile();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const companyId = (profile as any)?.company_id;
      if (!companyId) throw new Error("Empresa não encontrada no perfil");

      const { error } = await supabase.from("projects").insert({
        name,
        description,
        lead_id: companyId,
        user_id: user!.id,
        status: "novo" as any,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      toast({ title: "Projeto solicitado!", description: "Nossa equipe entrará em contato." });
      setName("");
      setDescription("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Novo Projeto</DialogTitle>
          <DialogDescription>
            Preencha os dados para iniciar uma nova análise de incentivo fiscal.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="project-name">Nome do Projeto</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Lei do Bem 2025"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-desc">Descrição</Label>
            <Textarea
              id="project-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva brevemente o projeto..."
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Solicitação
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
