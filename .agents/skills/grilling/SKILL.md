---
name: grilling
description: Stress-test a plan or design when the user explicitly asks for grilling or a thorough challenge. Use focused questions only for decisions that materially affect the result.
---

Use this skill only when the user asks to stress-test an idea or plan. For ordinary implementation requests, proceed from the request and available project context; do not turn this skill into a default intake interview.

Identify only decisions whose answers could materially change the plan. Inspect the repository and use available evidence to resolve factual unknowns. Batch the important unresolved choices into one concise round, include a recommended default, and avoid asking about implementation details that can be safely inferred. Ask another round only if the user's answer reveals a consequential new branch.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Word each question so "yes" accepts your recommended answer.

When useful, group dependent choices and ask the upstream question first. Once the goal, scope, and acceptance criteria are clear enough to act, stop interviewing and summarize the agreed brief. Do not require every theoretical branch to be settled.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent with a fresh context window to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the consequential uncertainties are resolved. Proceed with the requested work after the brief is clear; require an extra confirmation only when the user explicitly asked for a plan approval checkpoint or an unresolved choice would materially change the outcome.
