import { useState, useRef, useEffect } from "react";

const TOOLS = [
  {
    name: "web_search",
    description: "Busca informações atuais na internet sobre qualquer assunto.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Termo de busca" },
      },
      required: ["query"],
    },
  },
  {
    name: "calculator",
    description: "Avalia expressões matemáticas e retorna o resultado numérico.",
    input_schema: {
      type: "object",
      properties: {
        expression: { type: "string", description: "Expressão matemática, ex: 2 * (3 + 4)" },
      },
      required: ["expression"],
    },
  },
  {
    name: "get_current_time",
    description: "Retorna a data e hora atual do sistema.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

function executeTool(name, input) {
  if (name === "calculator") {
    try {
      const result = Function('"use strict"; return (' + input.expression + ')')();
      return `Resultado: ${result}`;
    } catch {
      return "Erro: expressão inválida.";
    }
  }
  if (name === "get_current_time") {
    return `Data e hora atual: ${new Date().toLocaleString("pt-BR")}`;
  }
  if (name === "web_search") {
    return `[Simulação de busca] Resultados para "${input.query}": Esta é uma busca simulada. Em produção, conecte a uma API real como Brave Search ou SerpAPI para obter resultados reais da web.`;
  }
  return "Ferramenta não encontrada.";
}

const TOOL_ICONS = {
  web_search: "🌐",
  calculator: "🧮",
  get_current_time: "🕐",
};

const SYSTEM_PROMPT = `Você é um agente autônomo inteligente com acesso a ferramentas. Seu objetivo é resolver tarefas do usuário de forma sistemática, usando as ferramentas disponíveis quando necessário.

Ferramentas disponíveis:
- web_search: buscar informações na internet
- calculator: calcular expressões matemáticas
- get_current_time: obter data e hora atual

Sempre que possível, use ferramentas para fornecer respostas precisas e atualizadas. Explique seu raciocínio de forma clara. Responda sempre em português.`;

export default function AIAgent() {
  const [messages, setMessages] = useState([]);
  const [apiMessages, setApiMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState([]);
  const [iterCount, setIterCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, steps]);

  const addStep = (type, content) => {
    setSteps((prev) => [...prev, { type, content, id: Date.now() + Math.random() }]);
  };

  const runAgent = async (userText) => {
    setIsRunning(true);
    setSteps([]);
    setIterCount(0);

    const userMsg = { role: "user", content: userText };
    const newApiMessages = [...apiMessages, userMsg];
    setApiMessages(newApiMessages);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: userText, id: Date.now() },
    ]);

    addStep("thought", "Analisando a tarefa...");

    let currentMessages = newApiMessages;
    let iteration = 0;
    const MAX_ITER = 6;

    while (iteration < MAX_ITER) {
      iteration++;
      setIterCount(iteration);

      let data;
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            tools: TOOLS,
            messages: currentMessages,
          }),
        });
        data = await res.json();
      } catch (err) {
        addStep("error", "Erro de rede: " + err.message);
        break;
      }

      if (data.error) {
        addStep("error", data.error.message || "Erro na API.");
        break;
      }

      const stopReason = data.stop_reason;
      const content = data.content || [];

      // Collect text blocks
      const textBlocks = content.filter((b) => b.type === "text");
      if (textBlocks.length > 0) {
        const combinedText = textBlocks.map((b) => b.text).join("\n");
        addStep("thought", combinedText);
      }

      if (stopReason === "end_turn") {
        const finalText =
          textBlocks.length > 0
            ? textBlocks.map((b) => b.text).join("\n")
            : "Tarefa concluída.";
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: finalText, id: Date.now() },
        ]);
        setApiMessages([...currentMessages, { role: "assistant", content }]);
        break;
      }

      if (stopReason === "tool_use") {
        const toolBlocks = content.filter((b) => b.type === "tool_use");
        const toolResults = [];

        for (const tool of toolBlocks) {
          addStep("tool_call", { name: tool.name, input: tool.input });
          const result = executeTool(tool.name, tool.input);
          addStep("tool_result", { name: tool.name, result });
          toolResults.push({
            type: "tool_result",
            tool_use_id: tool.id,
            content: result,
          });
        }

        currentMessages = [
          ...currentMessages,
          { role: "assistant", content },
          { role: "user", content: toolResults },
        ];
        continue;
      }

      // Unexpected stop
      break;
    }

    if (iteration >= MAX_ITER) {
      addStep("error", "Limite de iterações atingido.");
    }

    setIsRunning(false);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isRunning) return;
    setInput("");
    runAgent(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setApiMessages([]);
    setSteps([]);
    setIterCount(0);
    setIsRunning(false);
    inputRef.current?.focus();
  };

  const suggestions = [
    "Que horas são agora?",
    "Quanto é 1337 * 42 + 99?",
    "Pesquise sobre agentes de IA em 2025",
    "Qual é a raiz quadrada de 144?",
  ];

  return (
    <div style={styles.root}>
      {/* Scanline overlay */}
      <div style={styles.scanlines} />

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.statusDot(isRunning)} />
          <span style={styles.logo}>AGENT//OS</span>
          <span style={styles.version}>v1.0</span>
        </div>
        <div style={styles.headerRight}>
          {isRunning && (
            <span style={styles.iterBadge}>iter {iterCount}/6</span>
          )}
          <button onClick={handleReset} style={styles.resetBtn}>
            RESET
          </button>
        </div>
      </header>

      <div style={styles.body}>
        {/* Left: Chat */}
        <section style={styles.chatPane}>
          <div style={styles.paneLabel}>// CONVERSA</div>

          <div style={styles.chatScroll}>
            {messages.length === 0 && (
              <div style={styles.emptyState}>
                <div style={styles.bigIcon}>⬡</div>
                <p style={styles.emptyTitle}>Agente pronto.</p>
                <p style={styles.emptyHint}>Digite uma tarefa ou escolha uma sugestão:</p>
                <div style={styles.suggestions}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      style={styles.suggestBtn}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} style={styles.message(m.role)}>
                <div style={styles.msgRole}>{m.role === "user" ? "▶ USER" : "◀ AGENT"}</div>
                <div style={styles.msgText}>{m.text}</div>
              </div>
            ))}

            {isRunning && (
              <div style={styles.thinking}>
                <span style={styles.thinkingDots}>●●●</span>
                <span style={styles.thinkingLabel}>processando</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma tarefa para o agente..."
              style={styles.textarea}
              disabled={isRunning}
              rows={2}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isRunning}
              style={styles.sendBtn(!input.trim() || isRunning)}
            >
              {isRunning ? "..." : "▶ RUN"}
            </button>
          </div>
        </section>

        {/* Right: Execution trace */}
        <section style={styles.tracePane}>
          <div style={styles.paneLabel}>// EXECUÇÃO</div>
          <div style={styles.traceScroll}>
            {steps.length === 0 && (
              <div style={styles.traceEmpty}>Aguardando execução...</div>
            )}
            {steps.map((step) => (
              <StepCard key={step.id} step={step} />
            ))}
          </div>
        </section>
      </div>

      {/* Footer tools */}
      <footer style={styles.footer}>
        {TOOLS.map((t) => (
          <div key={t.name} style={styles.toolChip}>
            <span>{TOOL_ICONS[t.name]}</span>
            <span style={styles.toolName}>{t.name}</span>
          </div>
        ))}
        <span style={styles.footerNote}>claude-sonnet-4 · ReAct Loop · max 6 iter</span>
      </footer>
    </div>
  );
}

function StepCard({ step }) {
  const { type, content } = step;

  if (type === "thought") {
    return (
      <div style={stepStyles.card("#0f1a0f", "#22c55e33", "#22c55e")}>
        <div style={stepStyles.label("#22c55e")}>💭 RACIOCÍNIO</div>
        <div style={stepStyles.text("#d4f4d4")}>{content}</div>
      </div>
    );
  }

  if (type === "tool_call") {
    return (
      <div style={stepStyles.card("#0a1220", "#3b82f633", "#3b82f6")}>
        <div style={stepStyles.label("#3b82f6")}>
          {TOOL_ICONS[content.name]} CHAMANDO: {content.name}
        </div>
        <pre style={stepStyles.pre("#93c5fd")}>
          {JSON.stringify(content.input, null, 2)}
        </pre>
      </div>
    );
  }

  if (type === "tool_result") {
    return (
      <div style={stepStyles.card("#120f1a", "#a855f733", "#a855f7")}>
        <div style={stepStyles.label("#a855f7")}>✓ RESULTADO: {content.name}</div>
        <div style={stepStyles.text("#e9d5ff")}>{content.result}</div>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div style={stepStyles.card("#1a0f0f", "#ef444433", "#ef4444")}>
        <div style={stepStyles.label("#ef4444")}>✗ ERRO</div>
        <div style={stepStyles.text("#fca5a5")}>{content}</div>
      </div>
    );
  }

  return null;
}

const stepStyles = {
  card: (bg, border, borderColor) => ({
    background: bg,
    border: `1px solid ${border}`,
    borderLeft: `3px solid ${borderColor}`,
    borderRadius: 4,
    padding: "10px 12px",
    marginBottom: 8,
    animation: "fadeIn .3s ease",
  }),
  label: (color) => ({
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 10,
    fontWeight: 700,
    color,
    letterSpacing: "0.1em",
    marginBottom: 6,
    textTransform: "uppercase",
  }),
  text: (color) => ({
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 12,
    color,
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }),
  pre: (color) => ({
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 11,
    color,
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }),
};

const C = {
  bg: "#080c08",
  surface: "#0d120d",
  surfaceHigh: "#111811",
  border: "#1a2a1a",
  borderBright: "#22c55e44",
  green: "#22c55e",
  greenDim: "#16a34a",
  greenFaint: "#052e16",
  text: "#c8e6c9",
  textDim: "#4a7c59",
  textMuted: "#2d4a35",
  accent: "#86efac",
};

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: C.bg,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    color: C.text,
    overflow: "hidden",
    position: "relative",
  },
  scanlines: {
    position: "fixed",
    inset: 0,
    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.15) 2px, rgba(0,0,0,.15) 4px)",
    pointerEvents: "none",
    zIndex: 1000,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    borderBottom: `1px solid ${C.border}`,
    background: C.surface,
    flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 12 },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  statusDot: (running) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: running ? C.green : C.greenDim,
    boxShadow: running ? `0 0 8px ${C.green}` : "none",
    animation: running ? "pulse 1s infinite" : "none",
  }),
  logo: {
    fontSize: 16,
    fontWeight: 700,
    color: C.green,
    letterSpacing: "0.15em",
    textShadow: `0 0 10px ${C.green}55`,
  },
  version: { fontSize: 11, color: C.textDim, letterSpacing: "0.1em" },
  iterBadge: {
    fontSize: 11,
    color: C.green,
    background: C.greenFaint,
    border: `1px solid ${C.borderBright}`,
    padding: "2px 8px",
    borderRadius: 2,
  },
  resetBtn: {
    background: "transparent",
    border: `1px solid ${C.border}`,
    color: C.textDim,
    padding: "4px 12px",
    fontSize: 11,
    cursor: "pointer",
    letterSpacing: "0.1em",
    borderRadius: 2,
    transition: "all .2s",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  chatPane: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    borderRight: `1px solid ${C.border}`,
    minWidth: 0,
  },
  tracePane: {
    display: "flex",
    flexDirection: "column",
    width: 340,
    flexShrink: 0,
  },
  paneLabel: {
    fontSize: 10,
    color: C.textDim,
    letterSpacing: "0.15em",
    padding: "8px 16px",
    borderBottom: `1px solid ${C.border}`,
    background: C.surface,
    flexShrink: 0,
  },
  chatScroll: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  traceScroll: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
  },
  traceEmpty: {
    color: C.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 40,
    letterSpacing: "0.05em",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    textAlign: "center",
    gap: 8,
  },
  bigIcon: {
    fontSize: 48,
    color: C.greenDim,
    lineHeight: 1,
    marginBottom: 8,
    filter: `drop-shadow(0 0 16px ${C.green}44)`,
  },
  emptyTitle: {
    fontSize: 16,
    color: C.green,
    margin: 0,
    letterSpacing: "0.1em",
  },
  emptyHint: {
    fontSize: 12,
    color: C.textDim,
    margin: "4px 0 12px",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    maxWidth: 480,
  },
  suggestBtn: {
    background: C.greenFaint,
    border: `1px solid ${C.borderBright}`,
    color: C.accent,
    padding: "6px 12px",
    fontSize: 11,
    cursor: "pointer",
    borderRadius: 2,
    letterSpacing: "0.03em",
    transition: "all .2s",
    fontFamily: "inherit",
  },
  message: (role) => ({
    padding: "12px 14px",
    borderRadius: 4,
    background: role === "user" ? C.surfaceHigh : C.greenFaint,
    border: `1px solid ${role === "user" ? C.border : C.borderBright}`,
    animation: "fadeIn .3s ease",
  }),
  msgRole: {
    fontSize: 9,
    fontWeight: 700,
    color: C.textDim,
    letterSpacing: "0.2em",
    marginBottom: 6,
  },
  msgText: {
    fontSize: 13,
    color: C.text,
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  thinking: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    color: C.textDim,
  },
  thinkingDots: {
    fontSize: 12,
    color: C.green,
    animation: "blink 1.2s infinite",
    letterSpacing: "0.2em",
  },
  thinkingLabel: {
    fontSize: 11,
    letterSpacing: "0.1em",
    color: C.textDim,
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "12px 16px",
    borderTop: `1px solid ${C.border}`,
    background: C.surface,
    flexShrink: 0,
    alignItems: "flex-end",
  },
  textarea: {
    flex: 1,
    background: C.bg,
    border: `1px solid ${C.border}`,
    color: C.text,
    padding: "10px 12px",
    fontSize: 13,
    fontFamily: "inherit",
    resize: "none",
    borderRadius: 4,
    outline: "none",
    lineHeight: 1.5,
  },
  sendBtn: (disabled) => ({
    background: disabled ? C.surfaceHigh : C.green,
    color: disabled ? C.textMuted : C.bg,
    border: "none",
    padding: "10px 16px",
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 4,
    letterSpacing: "0.08em",
    transition: "all .2s",
    flexShrink: 0,
    height: 44,
  }),
  footer: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    borderTop: `1px solid ${C.border}`,
    background: C.surface,
    flexShrink: 0,
    flexWrap: "wrap",
  },
  toolChip: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    background: C.greenFaint,
    border: `1px solid ${C.border}`,
    padding: "3px 8px",
    borderRadius: 2,
    fontSize: 11,
  },
  toolName: { color: C.textDim, letterSpacing: "0.05em" },
  footerNote: {
    marginLeft: "auto",
    fontSize: 10,
    color: C.textMuted,
    letterSpacing: "0.08em",
  },
};

// Inject keyframes
const styleTag = document.createElement("style");
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
  @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #080c08; }
  ::-webkit-scrollbar-thumb { background: #1a2a1a; border-radius: 2px; }
  textarea:focus { border-color: #22c55e44 !important; box-shadow: 0 0 0 1px #22c55e22; }
  button:hover:not(:disabled) { filter: brightness(1.15); }
`;
document.head.appendChild(styleTag);
