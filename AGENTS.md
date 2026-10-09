# AGENTS.md

Read `CLAUDE.md` first and follow it; it is the project instruction file. Codex runs here only as a
read-only reviewer, in three roles (CLAUDE.md, "Model routing"): the cold review
(`scripts/codex-review.sh`, gpt-6-astra, which judges the code without the plan), the adversarial review
(`scripts/codex-adversarial.sh`, gpt-5.6-sol, which tries to break what the change claims), and the second
opinion (`scripts/codex-opinion.sh`, gpt-6-astra, which argues the case against a settled document). In
every role it never edits a file. Tie each finding to a file and line, and a concrete scenario.
