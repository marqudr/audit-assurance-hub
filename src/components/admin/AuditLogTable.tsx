import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { format } from "date-fns";

const opColors: Record<string, string> = {
  INSERT: "bg-green-100 text-green-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
};

export function AuditLogTable() {
  const [tableName, setTableName] = useState<string>("");
  const [operation, setOperation] = useState<string>("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useAuditLogs({
    tableName: tableName || undefined,
    operation: operation || undefined,
    page,
  });

  const logs = data?.data || [];
  const total = data?.count || 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={tableName} onValueChange={(v) => { setTableName(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tabela" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {["leads", "projects", "profiles", "user_roles", "project_phases", "phase_outputs", "project_attachments"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={operation} onValueChange={(v) => { setOperation(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Operação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="INSERT">INSERT</SelectItem>
            <SelectItem value="UPDATE">UPDATE</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Carregando...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Tabela</TableHead>
              <TableHead>Operação</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log: any) => (
              <>
                <TableRow key={log.id} className="cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                  <TableCell>{expandedId === log.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</TableCell>
                  <TableCell className="text-xs">{format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss")}</TableCell>
                  <TableCell><Badge variant="outline">{log.table_name}</Badge></TableCell>
                  <TableCell><Badge className={opColors[log.operation] || ""}>{log.operation}</Badge></TableCell>
                  <TableCell className="text-xs font-mono">{log.record_id?.substring(0, 8)}...</TableCell>
                </TableRow>
                {expandedId === log.id && (
                  <TableRow key={`${log.id}-detail`}>
                    <TableCell colSpan={5}>
                      <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded text-xs">
                        {log.old_data && (
                          <div>
                            <p className="font-semibold mb-1">Dados Anteriores</p>
                            <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{JSON.stringify(log.old_data, null, 2)}</pre>
                          </div>
                        )}
                        {log.new_data && (
                          <div>
                            <p className="font-semibold mb-1">Dados Novos</p>
                            <pre className="whitespace-pre-wrap break-all max-h-40 overflow-auto">{JSON.stringify(log.new_data, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{total} registros</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={(page + 1) * 25 >= total} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
