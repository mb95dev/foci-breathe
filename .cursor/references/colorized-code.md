# Colorized code

Translating the "colorized math equations" idea to code. The principle: **when a snippet has multiple conceptual roles, color lets the eye read it as a diagram, not a string of symbols.** One glance should tell you "this part is domain, this part is infrastructure, this part is the analogy's bouncer" — without reading the identifiers.

This is not syntax highlighting. Syntax highlighting colors *by language structure* (keyword, string, identifier). Semantic colorizing colors *by architectural role*, which is what the learner actually needs to internalize.

---

## When to colorize

Colorize when:
- The snippet spans multiple layers (domain / application / infrastructure)
- The snippet illustrates a pattern where specific tokens carry the pattern's meaning (e.g. the aggregate root method vs child mutation)
- The snippet is the "Technical" step in ADEPT and the learner has just been given an analogy that some tokens directly embody
- You're in an artifact (HTML/React), where real color is available

Skip colorizing when:
- The snippet is short (under ~8 lines) and has only one role
- The output format doesn't support color (fenced code blocks inline — use role-comment tags instead)
- The colors would compete with syntax highlighting in a way that reduces clarity

---

## Artifact palette (HTML/React contexts)

Semantic palette — consistent across the conversation whenever possible:

| Role | Color | Hex | Notes |
|---|---|---|---|
| Domain / pure business logic | teal | `#0891b2` | "the stuff that would be the same if you switched frameworks" |
| Application / orchestration | violet | `#7c3aed` | handlers, use-cases, command/query dispatch |
| Infrastructure / I/O | amber | `#d97706` | DB, HTTP, bus, file system, clock |
| Tests / assertions | slate | `#64748b` | test setup, expectations |
| The analogy's referent | rose | `#e11d48` | the "bouncer" / "recipe" / etc. — highlight the exact tokens the analogy maps to |

Accessibility: pair color with a leading glyph or text label for color-blind safety. E.g. `◆ domain`, `◇ app`, `▲ infra` in the legend. Never convey meaning by color alone.

---

## Inline format (fenced code blocks)

Chat-native code blocks don't render custom color. Use role-comment tags at the end of each line, plus a legend above the block:

```csharp
// [D] Domain  [A] Application  [I] Infrastructure  <- the bouncer

public async Task<Result> Handle(PlaceOrderCmd cmd, CancellationToken ct)  // [A]
{
    var customer = await _customers.FindAsync(cmd.CustomerId, ct);         // [I]
    var order = Order.Create(customer, cmd.Items);        // [D] <- the bouncer
    await _orders.AddAsync(order, ct);                                     // [I]
    await _bus.PublishAsync(new OrderPlaced(order.Id), ct);                // [I]
    return Result.Ok(order.Id);
}
```

The `<- the bouncer` marker ties the code back to the analogy in Phase 2 of ADEPT. This is the correlation the user preference explicitly requires.

---

## Artifact template (single-file React)

When a snippet really earns an artifact (a full pattern explanation with 30+ lines and multiple layers), use this skeleton:

```jsx
// role color legend
const C = {
  domain: '#0891b2',   // ◆
  app:    '#7c3aed',   // ◇
  infra:  '#d97706',   // ▲
  test:   '#64748b',   // ◯
  focus:  '#e11d48',   // ★ (the analogy's referent)
};

// Inside JSX:
<pre className="text-sm leading-relaxed">
  <span style={{color: C.app}}>public async Task</span>
  <span>&lt;Result&gt; Handle(PlaceOrderCmd cmd) </span>
  {'\n'}
  <span style={{color: C.infra}}>  var customer = await _customers.FindAsync(...);</span>
  {'\n'}
  <span style={{color: C.focus}}>  var order = Order.Create(customer, cmd.Items);</span>
  <span style={{color: C.domain}}> // ★ aggregate root: the bouncer</span>
  ...
</pre>
```

Keep the legend at the top of the artifact, immediately visible without scrolling.

---

## What not to do

- **Don't over-color.** If everything is colored, nothing is colored. Aim for 2–4 roles max per snippet.
- **Don't use palette inconsistently across one explanation.** If teal means "domain" in paragraph 2, it must still mean "domain" in paragraph 6.
- **Don't replace syntax highlighting with semantic color** when both are in play and would confuse the eye. Either use a code block with inline role comments, or move to a fully custom-rendered artifact.
- **Don't colorize without a legend.** The learner shouldn't have to guess.

---

## The underlying principle

Kalid Azad's observation about colorized math: the eye treats a colored equation as a **map**, bouncing between regions rather than linearly parsing symbols. The same is true for code. A well-colored aggregate-root snippet lets the learner see "domain, infra, domain, infra" as a silhouette — the *rhythm of responsibilities* — before they read any identifiers. That rhythm is the pattern they're learning; the identifiers are incidental.

Designed right, one colorized snippet can replace three paragraphs of prose.