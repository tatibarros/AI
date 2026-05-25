# AGENT//OS v1.0 - Autonomous AI Agent Interface

Sistema retro-interativo de agente de IA autônomo com interface inspirada em terminais clássicos.

## 🚀 Quick Start

### Instalação (já feita)
```bash
npm install
```

### Rodar a aplicação
```bash
npm run dev
```

Acesse: **http://localhost:5173/**

## 🟢 Modo Mock (Padrão)

A aplicação está **configurada para usar Mock Mode por padrão**:

- ✅ Sem necessidade de API Key
- ✅ Sem custos
- ✅ Respostas simuladas realistas
- ✅ Perfeito para testes e desenvolvimento
- ✅ Mostra "🟢 MOCK MODE" no footer

### Ferramentas Disponíveis:
1. **🕐 get_current_time** - Retorna data/hora do sistema
2. **🧮 calculator** - Calcula expressões matemáticas
3. **🌐 web_search** - Simula busca na internet

### Exemplos de Tarefas:
- "Que horas são agora?"
- "Quanto é 1337 * 42 + 99?"
- "Qual é a raiz quadrada de 144?"
- "Pesquise sobre agentes de IA em 2025"

## 🔵 Usar API Real do Anthropic

Para usar a API real em produção:

### Passo 1: Obter Chave API
1. Vá para https://console.anthropic.com/
2. Crie uma conta ou faça login
3. Gere uma chave API (formato: `sk-ant-...`)

### Passo 2: Configurar Chave
Crie ou edite `.env.local` na raiz do projeto:
```env
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

### Passo 3: Ativar API Real
Edite `src/services/anthropicMock.js`:
```javascript
const useMock = false;  // Mude para false
```

### Passo 4: Reiniciar
```bash
npm run dev
```

O footer mudará para **"🔵 API REAL"** confirmando a mudança.

## 📋 Estrutura do Projeto

```
c:\Claude Projects\
├── index.html                   # Ponto de entrada HTML
├── vite.config.js              # Configuração do Vite
├── package.json                # Dependências
├── .env.example                # Exemplo de variáveis de ambiente
├── .env.local                  # Variáveis locais (não commitar!)
├── .gitignore                  # Git ignore (inclui .env.local)
└── src/
    ├── main.jsx                # Entrada React
    ├── components/
    │   └── AIAgent.jsx         # Componente principal
    └── services/
        └── anthropicMock.js    # Serviço de mock/API
```

## 🎨 Features

- ✅ Interface retro com tema verde neon
- ✅ Visualização de etapas de execução em tempo real
- ✅ Suporte a múltiplas iterações (max 6)
- ✅ Raciocínio transparente do agente
- ✅ Sistema de ferramentas (tools)
- ✅ ReAct Loop (Reasoning + Acting)
- ✅ Modo Mock e API Real
- ✅ Responsivo e interativo

## 🛠️ Desenvolvimento

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

## ⚠️ Importante

- **Nunca commitar `.env.local`** (contém sua chave API)
- **Mock Mode é gratuito** - use para testes
- **API Real custa dinheiro** - use apenas quando necessário
- Cada request à API custa aproximadamente $0.001-$0.01 USD

## 📝 Notas

- O indicador no footer (🟢/🔵) mostra qual modo está ativo
- Erro de CORS em mock mode é normal (não faz fetch de verdade)
- Respostas em português (conforme SYSTEM_PROMPT)
- Máximo 6 iterações por tarefa (limite de segurança)

## 🐛 Troubleshooting

**Erro: "VITE_ANTHROPIC_API_KEY não configurada"**
- Certifique-se de que `.env.local` existe com a chave
- Reinicie o servidor após adicionar a chave

**Interface não atualiza**
- Verifique console do navegador (F12)
- Limpe cache: Ctrl+Shift+R

**Mock não responde**
- Aguarde 1-2 segundos (simula latência de rede)
- Verifique que `useMock = true` em `anthropicMock.js`

---

**Feito com ❤️ usando React + Vite + Anthropic Claude**
