---
inclusion: always
---

# Customer Tracking

Two files to keep the customer in the loop.

## 1. Questions (`docs/customer-questions.md`)

When you're unsure about something during work — add it here.

- Mark it `[MANDATORY]` (blocks progress) or `[OPTIONAL]` (nice to clarify).
- Add a short reason why it matters and today's date.
- Tell me: "Question added for customer."
- When I give you the answer — remove it from the file and use the answer.
- Only unanswered questions stay in the file.

### Format:

```markdown
# Customer Questions

## Unanswered

### [MANDATORY] Short question
- **Why:** One line on why it matters
- **Added:** YYYY-MM-DD

### [OPTIONAL] Short question
- **Why:** One line on why it matters
- **Added:** YYYY-MM-DD
```

## 2. Constraints (`docs/feature-constraints.md`)

When you build something with a limit, fixed value, or rule the customer should know — add it here.

- Tell me: "Constraint added for customer."
- If the customer wants it changed, update or remove after fixing.

### Format:

```markdown
# What the Customer Should Know

## Limits
- **What:** value — why/where

## Fixed Values
- **What:** value — where used

## Rules
- **Rule:** what it does — where enforced

## Known Limitations
- **What:** description — impact
```
