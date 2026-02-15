

## Novo Layout do Workspace Operations

Reestruturar o workspace do pipeline operacional para que a area principal seja dividida entre a **conversa com o agente** (esquerda) e o **editor de versao final** (direita), com a selecao do agente no topo da pagina. O Data Room passa a ser acessivel via aba/botao dentro do painel de conversa ou do header.

---

### Mudancas no Layout

**Antes:**
```text
+------------------+-------------------+-----------+
|   Data Room      |   Editor (tabs    |  Agent    |
|   (arquivos)     |   IA / Final)     |  Sidebar  |
+------------------+-------------------+-----------+
```

**Depois:**
```text
+-- Header: [Agente Select] [Executar] [Aprovar Fase] [Data Room] --+
+----------------------------+--------------------------------------+
|   Chat com Agente          |   Editor Versao Final                |
|   (conversa streaming      |   (textarea editavel + salvar)       |
|    com historico)           |   + botao "Criar Documento"          |
+----------------------------+--------------------------------------+
```

---

### Alteracoes por Arquivo

**1. `OperationsWorkspace.tsx`**
- Mover a selecao do agente, botao Executar e botao Aprovar para o header (barra de ferramentas abaixo do timeline)
- Remover o `AgentSidebar` como card separado
- O split view principal passa a ser: Chat (esquerda) + Editor Final (direita)
- Adicionar botao/icone para abrir o Data Room em um Sheet/Drawer lateral

**2. Novo componente: `AgentChatPanel.tsx`**
- Interface de chat completa reutilizando a logica de streaming do `agent-chat`
- Historico de mensagens com avatars (User/Bot), renderizacao Markdown
- Input de mensagem na parte inferior
- Reutiliza `useConversation` para persistir o historico do chat por fase
- Botao "Criar Documento" que pega o conteudo de uma resposta do agente e a salva como `phase_output` (versao "ai"), tambem com opcao de anexar ao Data Room como arquivo

**3. `EditorPanel.tsx` (simplificado)**
- Remover a tab "Versao IA" (o conteudo IA agora vive no chat)
- Manter apenas o editor de "Versao Final" com textarea e botao Salvar
- Adicionar botao "Criar Documento da Conversa" que gera um documento consolidado a partir das respostas do agente no chat e o salva como output ou anexo no Data Room

**4. `AgentSidebar.tsx`**
- Sera refatorado: a logica de selecao de agente, execucao e aprovacao sobe para um toolbar no `OperationsWorkspace`
- O componente pode ser removido ou transformado em funcoes utilitarias

**5. `DataRoomPanel.tsx`**
- Continua existindo, mas sera exibido dentro de um `Sheet` (drawer lateral) em vez de ocupar um painel fixo
- Acionado por um botao no header do workspace

---

### Logica de "Criar Documento"

- Um botao no painel do chat ou no editor permite selecionar mensagens do agente e compilar em um documento
- O documento e salvo como `phase_output` (versao "ai") e opcionalmente como arquivo no Data Room (upload de um `.md` gerado ao bucket `project-files`)
- O fluxo: usuario conversa com agente -> clica "Criar Documento" -> conteudo e copiado para o editor de versao final e/ou salvo como anexo

---

### Toolbar do Header (dentro do workspace)

Componentes inline na barra abaixo do timeline:
- **Select de Agente** (dropdown com agentes ativos)
- **Botao "Executar Agente"** (inicia uma mensagem automatica no chat)
- **Botao "Data Room"** (abre Sheet lateral com uploads/arquivos)
- **Botao "Aprovar Fase"** (gatekeeping manual, restrito)
- Status da ultima execucao (badge)

---

### Sequencia de Implementacao

1. Criar `AgentChatPanel.tsx` -- chat completo com streaming, historico e botao "Criar Documento"
2. Simplificar `EditorPanel.tsx` -- remover tab IA, manter apenas editor de versao final
3. Refatorar `OperationsWorkspace.tsx` -- novo layout com toolbar no header, split view chat+editor, Data Room em Sheet
4. Remover ou refatorar `AgentSidebar.tsx` -- logica migrada para o workspace
5. Ajustar `DataRoomPanel.tsx` -- empacotar dentro de um Sheet

