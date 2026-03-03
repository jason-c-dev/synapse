---
name: complete-tasks
description: Mark tasks as completed in a vault note. Specify a note name and optionally which tasks.
argument-hint: "<note name> [all | task description]"
---

# Complete Tasks

Mark tasks as completed in an existing vault note using the read-overwrite pattern.

## Steps

1. **Parse arguments** — extract the note name and which tasks to complete ("all" if not specified)

2. **Read the note** — call `vault_read` with the note name to get current content

3. **Identify tasks** — find all `- [ ]` lines in the note. If the user specified particular tasks, match only those. If "all", select every incomplete task.

4. **Confirm with user** — list the tasks that will be marked complete and ask for confirmation, unless the user already specified clearly

5. **Rewrite the note** — call `vault_create` with `overwrite: true`, replacing matched `- [ ]` with `- [x]` while preserving all other content exactly

6. **Confirm** — report how many tasks were marked complete in which note

## Important

- Always `vault_read` first — never guess at note contents
- Preserve frontmatter, formatting, and all unchanged content exactly
- If the note is not found, tell the user and suggest `vault_search` to find it
