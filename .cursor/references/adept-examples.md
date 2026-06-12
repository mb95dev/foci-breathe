# ADEPT worked examples

Additional canonical explanations to reuse or adapt. Each follows the full Activate → ADEPT → Consolidate loop. Pick one, don't read them all at once.

---

## CQRS (Command Query Responsibility Segregation)

**Activate**: "Have you ever had a screen that was slow because the query had to join six tables, when the write side only touched two of them?"

**Analogy**: CQRS is a **restaurant with separate takeout and dine-in counters**. Orders (commands) go to one line where the kitchen processes them carefully. Menu questions and status checks (queries) go to a different line that never blocks a cook.

**Diagram**: command side (controller → command handler → domain → repo → DB) on one track, query side (controller → query handler → read DB / projection) on a parallel track, both ultimately feeding the same UI. Optional event/projection arrow connecting them.

**Example**: E-commerce order dashboard. Writing an order needs strong consistency — stock must decrement atomically. Reading the "orders shipped this week" list wants a denormalized view, pre-joined, cached, sometimes slightly stale. CQRS lets you optimize each without compromise.

**Plain-English**: "Writes and reads have different needs. Stop pretending one model serves both."

**Technical**: Two distinct models — `ICommandHandler<TCommand>` and `IQueryHandler<TQuery, TResult>`, often with MediatR. Write model enforces invariants; read model is optimized for projection. Pairs naturally with event sourcing but does **not** require it.

**Consolidate**: "When would CQRS be over-engineering? Give me the red-flag use case where you'd just use EF Core with one model."

**Next to explore**: event sourcing, outbox pattern, eventual consistency.

---

## Circuit Breaker (Polly)

**Activate**: "When you call a flaky downstream service and it's timing out, what happens to your thread pool?"

**Analogy**: A circuit breaker is a **home electrical breaker**. Normal flow: current passes through. Too many faults in quick succession: the breaker trips, and *no* current flows for a cooldown period. After cooldown, it tentatively tries one request (half-open) — success closes the breaker, failure trips it again.

**Diagram**: state machine with three nodes (Closed → Open → Half-Open → Closed), with transition labels (failure threshold hit; timeout elapsed; success; failure).

**Example**: Your `FuelDeliveryService` calls an external pricing API. Pricing API degrades — takes 30s per call instead of 200ms. Without a breaker, your connection pool exhausts and *your own* API goes down. With Polly's circuit breaker, after 5 consecutive failures it opens for 30 seconds — downstream stops getting hammered, your threads stay healthy, users get a fast "temporarily unavailable" instead of a hang.

**Plain-English**: "Fail fast instead of failing slow. Give the downstream service space to recover."

**Technical**: `Policy.Handle<HttpRequestException>().CircuitBreakerAsync(exceptionsAllowedBeforeBreaking: 5, durationOfBreak: TimeSpan.FromSeconds(30))`. In .NET 8+, prefer `Microsoft.Extensions.Resilience` / `Polly.Core` with `ResiliencePipeline`.

**Consolidate**: "Why is a circuit breaker *more important* than retries in a distributed system, even though retries feel more intuitive?"

**Next to explore**: bulkhead isolation, retry+jitter, Polly's `ResiliencePipeline` in .NET 8.

---

## Modular Monolith vs Microservices

**Activate**: "What's your team's deployment story right now — one pipeline, or many? That already constrains this decision."

**Analogy**: A modular monolith is a **house with well-partitioned rooms**. Microservices are a **street of separate houses**. Same family, but now every guest needs an address, utilities, and their own security. Worth it when the families actually need separate lives. Painful when they still share a kitchen.

**Diagram**: two side-by-side layouts — one process with internal module boundaries (ports/adapters between them, no network) vs multiple processes connected by a message bus and HTTP.

**Example**: A team of 6 shipping a Swedish social-services platform. One deployment, sub-second request paths between modules, one database with bounded contexts as schemas. That's a modular monolith — and it's often the right answer for 80% of teams. A team of 60, with 8 sub-teams each needing independent deploy cadence and polyglot stacks? That's when microservices start paying for themselves.

**Plain-English**: "Microservices trade in-process simplicity for independent deployability. Pay the tax only when you need the benefit."

**Technical**: Modular monolith = one process, multiple bounded contexts enforced by project structure and access rules (e.g. internal classes, ArchUnit-style tests, folder-scoped DI). Communication = in-process method calls or an in-process mediator. Microservices = separate processes, separate DBs, inter-service communication via HTTP/gRPC/message bus, separate CI/CD, observability per service.

**Consolidate**: "Senior interview: 'When would you split a modular monolith into services?' — give me three *concrete* triggers, not 'when it gets too big'."

**Next to explore**: strangler fig pattern for migration, Conway's law, the "distributed monolith" anti-pattern.

---

## EF Core N+1 and `AsSplitQuery`

**Activate**: "You've probably hit this one — load orders, each has lines, iterate and get 1 + N queries. What's your current fix?"

**Analogy**: The default `Include` is a **cartesian salad**: one row per combination, so joining Order (10 rows) with OrderLine (50 rows each) gives you 500 rows streamed over the wire. `AsSplitQuery` is **separate shopping trips**: one trip for orders, one for lines, assembled in memory. Fewer bytes, more round-trips. Different trade-off.

**Diagram**: two query plans side by side — single cartesian join vs two separate queries with in-memory stitching.

**Example**: `context.Orders.Include(o => o.Lines).Include(o => o.Shipments).ToList()` with eager loads on two collections produces a query where row count = |Orders| × |Lines| × |Shipments|. For 100 orders × 10 lines × 3 shipments that's 3,000 rows, most duplicated. `AsSplitQuery()` turns it into three queries totalling ~400 rows.

**Plain-English**: "Single query = fewer round-trips, more duplication. Split query = more round-trips, less duplication. Pick based on which is the bottleneck."

**Technical**: `context.Orders.Include(...).AsSplitQuery()`. Can be set globally via `UseSqlServer(..., o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery))`. **Caveat**: split queries are *not* in a single transaction by default — if the data changes between queries, you can see inconsistency. Single-query keeps consistency for free.

**Consolidate**: "What's the one scenario where you'd deliberately stay with a cartesian-explosion `Include` even knowing about split queries?"

**Next to explore**: compiled queries, `IQueryable` vs `IEnumerable`, projection (`Select`) as the simplest N+1 fix.

---

## SOLID — Interface Segregation (as example)

(Use this shape for any single SOLID letter.)

**Activate**: "Ever inherited an interface where 8 of the 10 methods throw `NotImplementedException`? That's the pain point."

**Analogy**: A fat interface is a **Swiss Army knife you're forced to carry whole** even when you only need the scissors. ISP says: give everyone the smallest tool they actually use.

**Diagram**: one `IEmployee` with 12 methods vs three small interfaces (`IPaid`, `IScheduled`, `IReportsTo`) each with 2–4 methods; clients depend only on what they need.

**Example**: A `IReportGenerator` interface with `GenerateWeekly`, `GenerateMonthly`, `GenerateAnnual`, `ExportCsv`, `ExportPdf`, `EmailToStakeholders`. A class that only needs weekly reports is now forced to stub out five methods or drag in dependencies (email!) it doesn't want. Split into `IWeeklyReport`, `IReportExporter`, `IReportDistributor` — each tiny, each independently implementable, each independently mockable.

**Plain-English**: "Don't force clients to depend on methods they don't use."

**Technical**: "Clients should not be forced to depend upon interfaces that they do not use." (Martin, 2002). In .NET this often shows up as: one big `IRepository<T>` → several role interfaces (`IReadOnlyRepository<T>`, `IWriteRepository<T>`).

**Consolidate**: "Name the smell that tells you an interface has violated ISP. One-sentence answer."

**Next to explore**: LSP's relationship to ISP, the Interface Segregation → Dependency Inversion chain, role interfaces vs header interfaces (Fowler).

---

## Expression trees (the one that's always asked)

**Activate**: "When you write `users.Where(u => u.Age > 18)` against EF Core, where does the SQL come from? Think about it before reading on."

**Analogy**: A lambda passed to `IEnumerable.Where` is a **recipe someone cooks in a kitchen they own** — executed immediately, in your process. A lambda passed to `IQueryable.Where` is a **recipe mailed to a remote chef** — it's not executed locally, it's serialized, shipped, and translated into the remote kitchen's language (SQL). The recipe itself has to be inspectable — that's what an expression tree is.

**Diagram**: lambda → compiler → two possible outputs: `Func<T,bool>` (opaque IL, can only execute) vs `Expression<Func<T,bool>>` (AST, can be inspected, traversed, translated).

**Example**: EF Core's LINQ provider traverses the expression tree, finds the `BinaryExpression` for `>`, the `MemberExpression` for `u.Age`, the `ConstantExpression` for `18`, and emits `WHERE Age > 18`. If you try to put something non-translatable inside — `Where(u => SomeCSharpMethod(u))` — EF throws, because the tree has a `MethodCallExpression` it can't convert.

**Plain-English**: "An expression tree is a lambda you can read as data. That's what lets libraries translate your C# into something else."

**Technical**: `Expression<TDelegate>` wraps a lambda as an AST rooted in `Expression` types (`BinaryExpression`, `MemberExpression`, `MethodCallExpression`, etc.). The compiler emits tree-building calls instead of IL when the target type is `Expression<T>`.

**Consolidate**: "A senior interviewer asks 'why does `IQueryable.Where` take `Expression<Func<T,bool>>` but `IEnumerable.Where` takes `Func<T,bool>`?' — 30-second answer."

**Next to explore**: `IQueryProvider`, dynamic LINQ, how Dapper/EF diverge on this fundamentally.