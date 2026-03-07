FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends git curl \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash \
    && ln -s /root/.local/bin/claude /usr/local/bin/claude

WORKDIR /app

# Build vault-mcp (filesystem-backed)
COPY obsidian-mcp/ /app/obsidian-mcp/
RUN cd /app/obsidian-mcp && npm ci && npm run build

# Install Synapse
COPY package.json package-lock.json /app/synapse/
RUN cd /app/synapse && npm ci
COPY src/ /app/synapse/src/
COPY CLAUDE.md agent.md /app/synapse/
COPY .claude/ /app/synapse/.claude/

# .mcp.json with deterministic container paths
RUN echo '{"mcpServers":{"obsidian":{"type":"stdio","command":"node","args":["/app/obsidian-mcp/build/index.js"],"env":{"OBSIDIAN_VAULT":"/vault"}}}}' \
    > /app/synapse/.mcp.json

WORKDIR /app/synapse
CMD ["node", "src/agent.js"]
