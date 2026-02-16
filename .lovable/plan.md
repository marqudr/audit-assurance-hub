

## Remover Pesquisa do Header + Notificacoes + Calendario por Hora na Agenda

### Resumo

Tres mudancas principais: (1) remover o campo de pesquisa do header global, (2) tornar o icone de notificacao funcional com um painel de alertas e apontamentos, (3) redesenhar a secao "Agenda de Hoje" na sheet lateral do CRM com um calendario visual separado por hora e seletor de data.

### Mudancas

#### 1. Remover pesquisa do AppHeader

- Remover os dois botoes de Search (desktop e mobile) do `AppHeader.tsx`
- Remover a prop `onOpenCommandPalette` do componente
- Atualizar `AppLayout.tsx` para nao passar mais a prop (manter o CommandPalette e atalho Cmd+K funcionando normalmente via teclado)
- Remover import de `Search` do lucide-react

**Arquivos:** `src/components/layout/AppHeader.tsx`, `src/components/layout/AppLayout.tsx`

#### 2. Tornar o icone de notificacao funcional

- Transformar o botao Bell no header em um trigger para um Sheet (painel lateral) de notificacoes
- O Sheet mostrara:
  - Alertas de projetos sem contato, atrasados e parados (reutilizando logica do `CrmActionAlerts`)
  - Compromissos do dia (da tabela `appointments`)
- O badge vermelho no icone Bell mostrara a contagem real de alertas + compromissos pendentes
- Criar um novo componente `NotificationsSheet.tsx` no layout

**Arquivos:** `src/components/layout/AppHeader.tsx`, novo `src/components/layout/NotificationsSheet.tsx`

#### 3. Redesenhar "Agenda de Hoje" com calendario por hora

Substituir a listagem simples de compromissos na `CrmRecentActivity` por um calendario visual por hora:

- **Grade horaria**: Exibir slots de 07:00 ate 20:00 (horario comercial), cada slot com 1 hora de altura
- **Compromissos posicionados**: Mostrar os compromissos no slot correspondente ao seu `appointment_time`
- **Seletor de data**: Um icone de calendario (CalendarDays) ao lado do titulo "Agenda" que abre um Popover com o componente Calendar do shadcn para selecionar outro dia
- **Adicionar compromisso com duplo-clique**: Ao fazer duplo-clique em um slot vazio, abrir um Dialog para criar um novo compromisso naquele horario pre-preenchido
- **Hook de appointments por data**: Criar um novo hook `useAppointmentsByDate` que busca compromissos para uma data especifica (nao apenas hoje)

**Arquivos:** `src/components/crm/CrmRecentActivity.tsx`, `src/hooks/useAppointments.ts`

### Detalhes Tecnicos

**`src/components/layout/AppHeader.tsx`:**
- Remover import de `Search`
- Remover prop `onOpenCommandPalette` da interface `AppHeaderProps`
- Remover os dois Button de pesquisa (linhas 71-85)
- Adicionar state `notificationsOpen` e Sheet para notificacoes no botao Bell
- Importar dados de projetos e appointments para calcular contagem real do badge

**`src/components/layout/AppLayout.tsx`:**
- Remover a prop `onOpenCommandPalette` do `<AppHeader>`
- Manter o `CommandPalette` e o listener de teclado Cmd+K intactos

**`src/components/layout/NotificationsSheet.tsx`:**
- Novo componente que recebe `open` e `onOpenChange`
- Busca projetos ativos e appointments do dia
- Exibe alertas (sem contato, atrasados, parados) e compromissos
- Reutiliza logica de contagem do CRM

**`src/hooks/useAppointments.ts`:**
- Adicionar novo hook `useAppointmentsByDate(date: string)`:
  - queryKey: `["appointments", date, userId]`
  - Busca appointments filtrados por `appointment_date = date`
  - Ordenados por `appointment_time` ascendente
- Manter `useTodayAppointments` existente (usado em outros lugares)

**`src/components/crm/CrmRecentActivity.tsx`:**
- Adicionar state `selectedDate` (default: hoje)
- Usar `useAppointmentsByDate(selectedDate)` em vez de `useTodayAppointments`
- Substituir a lista simples por uma grade horaria (07:00-20:00)
- Cada linha da grade: hora a esquerda, area de compromissos a direita
- Compromissos renderizados no slot correto baseado em `appointment_time`
- Duplo-clique em slot vazio: abrir Dialog com campos titulo e hora pre-preenchida
- Icone CalendarDays abre Popover com Calendar para trocar a data selecionada
- Ao trocar data, atualizar `selectedDate` e os compromissos refletem o novo dia
- Manter a secao "Ultimas Interacoes" intacta no topo

**Estrutura visual da grade horaria:**

```text
Agenda  [icon calendario]  16 Fev 2026
┌──────┬──────────────────────────────┐
│07:00 │                              │
├──────┼──────────────────────────────┤
│08:00 │ [Reuniao com cliente X]      │
├──────┼──────────────────────────────┤
│09:00 │                              │
├──────┼──────────────────────────────┤
│ ...  │  (duplo-clique para add)     │
├──────┼──────────────────────────────┤
│20:00 │                              │
└──────┴──────────────────────────────┘
```

### Resumo de Arquivos

| Acao | Arquivo |
|------|---------|
| Modificar | `src/components/layout/AppHeader.tsx` |
| Modificar | `src/components/layout/AppLayout.tsx` |
| Novo | `src/components/layout/NotificationsSheet.tsx` |
| Modificar | `src/hooks/useAppointments.ts` |
| Modificar | `src/components/crm/CrmRecentActivity.tsx` |

