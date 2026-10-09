# Rules

Instructions too narrow for CLAUDE.md. A rule with `paths:` frontmatter loads
only when Claude touches a matching file, so it costs nothing the rest of the
time — this is the main lever for keeping startup context small.

```markdown
---
paths:
  - "src/api/**/*.ts"
---
# API conventions
- Every handler validates input with the shared zod schema.
- Errors use the envelope in `src/api/errors.ts`; never raw throws.
```

A rule with no `paths:` loads every session, same as CLAUDE.md — use sparingly.

Caveat: path-scoped rules are NOT re-injected after a context compaction. They
reload the next time Claude reads a matching file. Anything that must survive
compaction belongs in CLAUDE.md or STATE.md.
