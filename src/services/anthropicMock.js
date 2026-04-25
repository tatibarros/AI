/**
 * Mock service that simulates Anthropic API responses
 * Useful for testing without API keys or rate limits
 * 
 * To use real API instead:
 * 1. Set VITE_ANTHROPIC_API_KEY in .env
 * 2. Change useMock to false below
 */

const useMock = true; // Toggle to false to use real API

// Realistic mock responses based on common tasks
const mockResponses = {
  "que horas": {
    text: "Deixa eu verificar a hora atual para você.",
    tool: "get_current_time",
  },
  "hora": {
    text: "Vou obter a hora atual do sistema.",
    tool: "get_current_time",
  },
  "calcul": {
    text: "Vou calcular essa expressão para você.",
    tool: "calculator",
  },
  "quanto": {
    text: "Deixa eu fazer esse cálculo.",
    tool: "calculator",
  },
  "raiz": {
    text: "Vou calcular a raiz para você.",
    tool: "calculator",
  },
  "pesquis": {
    text: "Vou pesquisar essa informação para você.",
    tool: "web_search",
  },
  "busca": {
    text: "Vou buscar informações sobre esse assunto.",
    tool: "web_search",
  },
};

// Extract numbers from expressions for mock calculator
function extractNumbers(expr) {
  const nums = expr.match(/\d+/g) || [];
  return nums.map(Number);
}

// Determine which tool to use based on user input
function determineMockTool(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    return "get_current_time"; // Default fallback
  }
  
  const lower = userInput.toLowerCase();
  
  for (const [keyword, data] of Object.entries(mockResponses)) {
    if (lower.includes(keyword)) {
      return data.tool;
    }
  }
  
  // Default detection
  if (lower.includes("+") || lower.includes("-") || lower.includes("*") || lower.includes("/")) {
    return "calculator";
  }
  if (lower.includes("hora") || lower.includes("time")) {
    return "get_current_time";
  }
  if (lower.includes("pesquis") || lower.includes("busca")) {
    return "web_search";
  }
  
  return "get_current_time"; // Default fallback
}

// Generate mock message response
function generateMockMessage(userInput, iteration = 1) {
  // Ensure userInput is a string
  let userInputStr = userInput;
  if (typeof userInput !== 'string') {
    userInputStr = JSON.stringify(userInput);
  }
  
  const toolToUse = determineMockTool(userInputStr);
  
  if (iteration === 1) {
    // First iteration: choose tool
    const thoughtText = `Vou analisar sua tarefa: "${userInputStr}". 
Parece que você quer usar a ferramenta ${toolToUse}. 
Deixa eu executar isso para você.`;

    let toolInput = {};
    if (toolToUse === "calculator") {
      // Extract expression from user input - look for numbers and operators
      const match = userInputStr.match(/\d+[\s\d+\-*/%().]*/);
      if (match) {
        toolInput = {
          expression: match[0].trim(),
        };
      } else {
        // Fallback: try to extract everything between "é" and "?"
        const fallback = userInputStr.match(/[0-9+\-*/%().\s]+/);
        toolInput = {
          expression: fallback ? fallback[0].trim() : "2 + 2",
        };
      }
    } else if (toolToUse === "web_search") {
      toolInput = {
        query: userInputStr.replace(/pesquise|pesquis|busca|search/gi, "").trim(),
      };
    }

    return {
      stop_reason: "tool_use",
      content: [
        { type: "text", text: thoughtText },
        {
          type: "tool_use",
          id: `tool_${Date.now()}`,
          name: toolToUse,
          input: toolInput,
        },
      ],
    };
  } else {
    // Second iteration: return final answer based on tool result
    const finalAnswers = {
      calculator: `Perfeito! Executei o cálculo para você. O resultado é exibido à direita.`,
      get_current_time: `A data e hora atual já foram obtidas da sua máquina. Você pode ver acima!`,
      web_search: `Os resultados da busca foram compilados. Esta é uma simulação - em produção, conectaria a uma API real de busca.`,
    };

    return {
      stop_reason: "end_turn",
      content: [
        {
          type: "text",
          text: finalAnswers[toolToUse] || "Tarefa concluída com sucesso!",
        },
      ],
    };
  }
}

/**
 * Main function to call Anthropic API or mock
 */
export async function callAnthropicAPI(payload) {
  if (!useMock) {
    // Use real API
    return callRealAPI(payload);
  }

  // Mock implementation
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      const userInput = payload.messages
        .filter((m) => m.role === "user")
        .pop()?.content || "unknown";

      // Determine iteration based on number of messages
      const iteration = Math.ceil(payload.messages.length / 2);
      const response = generateMockMessage(userInput, iteration);

      resolve({
        id: `msg_mock_${Date.now()}`,
        type: "message",
        role: "assistant",
        content: response.content,
        model: "claude-sonnet-4-20250514",
        stop_reason: response.stop_reason,
        stop_sequence: null,
        usage: {
          input_tokens: Math.floor(Math.random() * 100) + 50,
          output_tokens: Math.floor(Math.random() * 150) + 50,
        },
      });
    }, 800); // Simulate 800ms API latency
  });
}

/**
 * Real API call implementation
 */
async function callRealAPI(payload) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      "API Key não configurada. Configure VITE_ANTHROPIC_API_KEY no .env"
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Erro na API do Anthropic");
  }

  return response.json();
}

/**
 * Helper to switch between mock and real API
 */
export function setUseMock(value) {
  useMock = value;
}

export function isUsingMock() {
  return useMock;
}
