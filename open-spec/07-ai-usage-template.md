# Open Spec 07: AI Usage Log Template

<!--
  SPEC-METADATA:
  Subsystem: DomoNow PropTech Engineering Governance
  Document: Protocol for Logging AI-Assisted Architectural Decisions
  Compliance: Open Spec SDD, Auditable Engineering Decision Records (EDRs)
-->

---

## AI Engineering Decision Record (EDR) Template

Every significant architectural decision, concurrency model, or security triage influenced by AI agents must be recorded using the following standardized template in `AI-USAGE.md`:

```markdown
### EDR-[NUMBER]: [Descriptive Title]

* **Date:** YYYY-MM-DD
* **Author / Reviewer:** [Senior Engineer / Architect Name]
* **AI Toolchain:** Google Antigravity Agent / OpenSpec Engine
* **Component / Subsystem:** [e.g., DomoNow.Parking.Infrastructure / Partial Index]

#### 1. Problem Statement & Context
[Describe the technical challenge, concurrency race, performance bottleneck, or architecture dilemma encountered.]

#### 2. AI Initial Proposal
[Detail the solution, code snippet, or approach suggested by the AI agent.]

#### 3. Human Architect Critique & Risk Evaluation
* **Identified Flaws or Blindspots:** [e.g., In-memory locking does not scale to multi-replica pods; missing optimistic concurrency token, etc.]
* **Security & Memory Considerations:** [e.g., Potential memory leak in uncancelled RxJS/Signals subscriptions, lack of parameterized SQL, etc.]
* **Scale Feasibility:** [How does this behave under 5,000 properties and 100K daily movements?]

#### 4. Accepted Architectural Decision
[Explicit description of the final ratified solution, pattern, and technical compromise adopted.]

#### 5. Code & Schema Validation Evidence
* **Diff / Key Code Changes:**
  \`\`\`csharp
  // Concrete implementation snippet
  \`\`\`
* **Verification Proof:** [e.g., 10 simultaneous HTTP request integration test output, load test metrics, unit test pass report.]
```
