import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Bot,
  Settings,
  Plus,
  FileText,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  const handleSelect = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, projects, agents..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleSelect("/")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/crm")}>
            <Users className="mr-2 h-4 w-4" />
            CRM
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/operations")}>
            <FolderKanban className="mr-2 h-4 w-4" />
            Operations
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/agent-studio")}>
            <Bot className="mr-2 h-4 w-4" />
            Agent Studio
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem>
            <Plus className="mr-2 h-4 w-4" />
            Create New Project
          </CommandItem>
          <CommandItem>
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Recent Projects">
          <CommandItem onSelect={() => handleSelect("/operations")}>
            <FileText className="mr-2 h-4 w-4" />
            TechCorp — Tax Review 2025
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/operations")}>
            <FileText className="mr-2 h-4 w-4" />
            GlobalBank — Compliance Audit
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/operations")}>
            <FileText className="mr-2 h-4 w-4" />
            StartupXYZ — R&D Tax Credit
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
