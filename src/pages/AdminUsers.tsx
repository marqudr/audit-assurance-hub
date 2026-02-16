import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, List, GitBranch } from "lucide-react";
import { UserTable } from "@/components/admin/UserTable";
import { UserTree } from "@/components/admin/UserTree";
import { InviteUserModal } from "@/components/admin/InviteUserModal";

const AdminUsers = () => {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie usuários internos e de clientes</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Usuário
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table">
            <TabsList className="mb-4">
              <TabsTrigger value="table" className="gap-1.5">
                <List className="h-4 w-4" />
                Tabela
              </TabsTrigger>
              <TabsTrigger value="tree" className="gap-1.5">
                <GitBranch className="h-4 w-4" />
                Hierarquia
              </TabsTrigger>
            </TabsList>
            <TabsContent value="table">
              <UserTable />
            </TabsContent>
            <TabsContent value="tree">
              <UserTree />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <InviteUserModal open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
};

export default AdminUsers;
