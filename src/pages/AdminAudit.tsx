import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogTable } from "@/components/admin/AuditLogTable";

const AdminAudit = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Histórico de Auditoria</h1>
        <p className="text-sm text-muted-foreground">Registro completo de todas as operações do sistema</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Logs de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAudit;
