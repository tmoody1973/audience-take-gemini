# Architecture diagrams

Reviewed September 8, 2026 against a3655da. See the linked gallery and About page for interactive views. The evidence-policy diagram is explicitly a target, not a completed implementation.

## Code references

- [Runtime Parallel search and bounded research](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/agent/agent-runner.ts#L225)
- [Question ledger and follow-up planning](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/agent/agent-runner.ts#L298)
- [Atomic publication call](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/agent/agent-runner.ts#L755)
- [Task dispatch](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/lib/tasks/cloud-tasks.ts)
- [Research worker entry point](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/app/tasks/research/route.ts)
- [Publication transaction](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/services/firestore-repo.ts#L1490)
- [Configuration-dependent Gemini backend](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/lib/google/genai-client.ts)
- [Current text-only critic request](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/critic/trailer-critic-engine.ts#L261)
- [External signals are empty in the dynamic adapter](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/features/scout-card/data.ts#L689)
- [Current source matching uses word overlap](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/features/scout-card/data.ts#L320)
- [Derived audio artifact service](https://github.com/tmoody1973/audience-take-gemini/blob/a3655da/src/services/scout-brief/service.ts)

## Limits

The critic has text-only input; backend configuration does not prove a deployed Vertex route. Legacy citation matching and seed verification still require repair. Ancillary services and optional Monitor paths are omitted to keep the maps focused.

The JSON specifications are maintained here; rendered HTML and preview images are in public/architecture. Delivery and visual-review receipts are recorded in VALIDATION.json. Regenerate and validate after code changes.
