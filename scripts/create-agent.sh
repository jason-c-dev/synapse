#!/bin/bash
# Usage: ./synapse/scripts/create-agent.sh my-agent

set -e
AGENT_DIR="${1:?Usage: create-agent.sh <agent-name>}"
SYNAPSE_REPO="https://github.com/jason-c-dev/synapse.git"

mkdir -p "$AGENT_DIR" && cd "$AGENT_DIR"
git init

# Add Synapse as submodule (recursive gets obsidian-mcp nested submodule too)
git submodule add "$SYNAPSE_REPO" synapse
git submodule update --init --recursive
(cd synapse && npm install)

# Copy agent template
cp synapse/agent.example.md agent.md

# Symlink platform instructions
ln -s synapse/CLAUDE.md CLAUDE.md

# Link platform skills
mkdir -p .claude/skills
for skill in synapse/skills/*/; do
  name=$(basename "$skill")
  ln -s "../../synapse/skills/$name" ".claude/skills/$name"
done

# Create .env.example from Synapse's
cp synapse/.env.example .env.example

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.sessions/
.DS_Store
*.log
.mcp.json
.claude/settings.local.json
EOF

# Create package.json
cat > package.json << EOF
{
  "name": "$AGENT_DIR",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "start": "SYNAPSE_PROJECT_DIR=\$PWD node synapse/src/agent.js",
    "dev": "SYNAPSE_PROJECT_DIR=\$PWD node --watch synapse/src/agent.js"
  }
}
EOF

echo ""
echo "Agent project created: $AGENT_DIR"
echo ""
echo "Next steps:"
echo "  1. Edit agent.md — define your agent's identity"
echo "  2. cp .env.example .env — add your bot token and vault path"
echo "  3. Add custom skills in .claude/skills/"
echo "  4. npm start"
