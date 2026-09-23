---
description: Rule to explicitly evaluate and recommend relevant skills before executing the user's prompt.
---

# Evaluate Skills Before Execution

**Context**: The user has explicitly requested that every time a new prompt/request is received, the agent must evaluate which installed skills or plugins are appropriate for the task *before* proceeding with execution.

**Instructions**:
1. When receiving a new request from the user, briefly pause and scan the available skills (e.g., `xlsx`, `diagram-design`, `ponytail`, `superpowers` suite).
2. Internally evaluate if any of the available skills are relevant to the current task.
3. If a skill is highly relevant, either invoke the skill immediately using its trigger (or by reading its `SKILL.md`), or explicitly inform the user in your response that you are applying the principles of that skill to solve their problem.
4. If no specific skill is needed, proceed normally, but maintain awareness of the project's overall toolset.
