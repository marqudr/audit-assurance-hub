import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  PenTool,
  Shield,
  Search,
  BookOpen,
  Calculator,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";

const agents = [
  {
    id: 1,
    name: "Writer Agent",
    role: "Narrative Drafting",
    icon: PenTool,
    docs: 12,
    lastTrained: "2 days ago",
    status: "active" as const,
  },
  {
    id: 2,
    name: "Auditor Agent",
    role: "Quality Assurance",
    icon: Shield,
    docs: 28,
    lastTrained: "1 day ago",
    status: "active" as const,
  },
  {
    id: 3,
    name: "Researcher Agent",
    role: "Legal Research",
    icon: Search,
    docs: 45,
    lastTrained: "3 hours ago",
    status: "active" as const,
  },
  {
    id: 4,
    name: "Instructor Agent",
    role: "Knowledge Base",
    icon: BookOpen,
    docs: 8,
    lastTrained: "5 days ago",
    status: "training" as const,
  },
  {
    id: 5,
    name: "Calculator Agent",
    role: "Tax Computation",
    icon: Calculator,
    docs: 15,
    lastTrained: "1 week ago",
    status: "idle" as const,
  },
];

const knowledgeDocs = [
  { name: "Lei_12973_2014.pdf", status: "indexed" as const, pages: 42 },
  { name: "IN_RFB_1700.pdf", status: "indexed" as const, pages: 128 },
  { name: "Jurisprudencia_CARF_2024.pdf", status: "indexing" as const, pages: 65 },
  { name: "Manual_Transfer_Pricing.pdf", status: "indexed" as const, pages: 210 },
];

const AgentStudio = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Studio</h1>
          <p className="text-sm text-muted-foreground">Configure and train your AI agents</p>
        </div>
        <Button size="sm">
          <Bot className="mr-2 h-4 w-4" />
          New Agent
        </Button>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow group">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2.5 group-hover:bg-primary/15 transition-colors">
                    <agent.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.role}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    agent.status === "active"
                      ? "border-success/30 text-success text-[10px]"
                      : agent.status === "training"
                      ? "border-warning/30 text-warning text-[10px]"
                      : "text-[10px]"
                  }
                >
                  {agent.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {agent.docs} documents
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {agent.lastTrained}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Configuration Panel */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Agent Config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Agent Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Persona
              </label>
              <div className="flex items-center gap-3 p-3 rounded-md border">
                <div className="rounded-full bg-primary/10 p-3">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Auditor Agent</p>
                  <p className="text-xs text-muted-foreground">Quality Assurance Specialist</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Instructions — What to do
              </label>
              <div className="rounded-md border p-3 text-sm text-muted-foreground min-h-[60px]">
                Cross-reference all financial values with source documents. Flag any discrepancy above 0.5%...
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Instructions — What to avoid
              </label>
              <div className="rounded-md border p-3 text-sm text-muted-foreground min-h-[60px]">
                Never assume values without source reference. Do not generate legal conclusions...
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Knowledge Base (RAG)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop zone */}
            <div className="rounded-md border-2 border-dashed border-border hover:border-primary/40 transition-colors p-6 text-center cursor-pointer">
              <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Drop PDFs here</p>
              <p className="text-xs text-muted-foreground">or click to browse files</p>
            </div>

            {/* Indexed documents */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Indexed Documents
              </label>
              {knowledgeDocs.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between p-2.5 rounded-md border text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium text-xs">{doc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{doc.pages} pages</span>
                    {doc.status === "indexed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-warning animate-pulse" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgentStudio;
