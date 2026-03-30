---
name: csharp-code-calisthenics-reviewer
description: Review a single C# file or small C# class against a fixed, narrow set of code-calisthenics rules and produce a deterministic refactor plan. Use when asked to critique or review C# code for indentation depth, else usage, primitive obsession, missing first-class collections, and overly large or poorly named methods.
---

# C# Code Calisthenics Reviewer

Review one C# file or one small class at a time. Keep the review narrow, deterministic, and grounded in the provided code.

## Rules

Check only these 5 rules:

1. Only one level of indentation per method
2. Avoid `else`
3. Wrap primitives in value objects when it makes sense
4. First-class collections
5. Small methods with intention-revealing names

Do not expand into the broader code-calisthenics catalog unless the user explicitly asks for that.

## Working style

- Read the code carefully before judging it.
- Stay concrete and repeatable. Do not use random scoring, vague style commentary, or speculative claims.
- Base every finding on visible code in the provided file or class.
- Mention guard-clause opportunities when they help flatten control flow.
- Do not perform a full automatic rewrite by default.
- Include a short illustrative snippet only when it makes a recommendation easier to understand.

## Review process

1. Identify the class or methods under review.
2. Evaluate each of the 5 rules in order.
3. Record only the findings that are supported by the code.
4. Prioritize issues that reduce nesting, split responsibilities, and clarify domain language.
5. End with a refactor plan ordered by highest leverage first.

## Output format

Use this structure:

### Findings

For each rule:

- `Rule:` the exact rule name
- `Assessment:` `Pass`, `Concern`, or `Not applicable`
- `Evidence:` a brief code-specific explanation
- `Suggestion:` one concrete next step

### Refactor plan

Provide 3 to 6 ordered steps. Each step should describe a refactor action, not just a diagnosis.

### Optional snippet

Only include this section when a very short snippet clarifies one suggested refactor. Keep it focused on one change, not a full rewritten file.

## References

- Read `references/calisthenics-checklist.md` for the review checklist and refactor priorities.
- Use `examples/input/OrderService.cs` and `examples/output/review.md` as the canonical example of expected scope and output shape.
