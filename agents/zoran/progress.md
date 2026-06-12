# Functional C# 10 — Course Progress

Learner: mid-senior .NET dev (6+ yrs) · Practice domain: foci-breathe breathing app
Practice runtime: `dotnet run Models/<file>.cs` (file-based app, .NET 11 preview SDK)

## Module status

| # | Module | Status | Evidence |
|---|--------|--------|----------|
| 2 | Putting C# Into Functional Perspective | ✅ Done | `Models/BreathingExtensions.cs` — pure core (`Repeat`, `Generate`, `Describe`) + thin impure shell (`Print`); verified with `dotnet run` 2026-06-12 |
| 3 | Introducing Functional Types and Functions | ⬜ Next | — |
| 4 | Modeling the Domain with Types | ⬜ | — |
| 5 | Designing Pure Functions | ⬜ | — |
| 6 | Using Partially Applied Functions | ⬜ | — |
| 7 | Substituting Inheritance with Discriminated Unions | ⬜ | — |
| 8 | Modeling Missing Objects (Option&lt;T&gt;) | ⬜ | — |
| 9 | Modeling Complex Domain Objects | ⬜ | — |

## Session log

### 2026-06-12 — Module 2 (review + fixes)
- Learner rewrote `BreathingExtensions.cs` independently: split 9-int record into `BreathingPattern` + `BreathingPhase`, isolated `Console.WriteLine` into `Print`. Mindset shift landing.
- Fixed together: duplicate top-level declarations (CS0128), `namespace` vs top-level statements, `Generate` factory type mismatch (`Func<int, BreathingPhase>` vs promised `BreathingPattern`), `Enumerable.Repeat(pattern, count)` over dummy-0 + Select.
- Metaphors used: **coffee machine** (honest signatures), **sheet music vs performance** (pure core / impure shell, ◆●▲ silhouette).

### 2026-06-12 — Module 2 deep-dive (function composition + quick prototyping)
- Created `Models/FunctionComposition.cs`: `Map` (value-level) vs `Then` (function-level) composition, stations as `Func<Pattern, Pattern>`, dominos rule (types must align), `with`-expressions for nondestructive mutation.
- Metaphor: **assembly line** — stations (functions), workpiece (pattern), machine (composed Func).
- Verified: both composition styles print identical output; same machine reused on two patterns.
- EXERCISE DONE (with repairs): `morningLine` — learner had the right composition shape but two domino errors: `Stretch(0.8)` used without freezing the receiver (partial application gap) and the rename lambda typed as string→string instead of Pattern→Pattern.
- BONUS: learner independently invented predicate composition (`And` for `Func<T,bool>`, order-validation rules) — Module 5 instinct ahead of schedule. Repaired: rules took an `Order` parameter they ignored (dishonest signature, 3rd occurrence) and returned `Func` from instance-style methods instead of being rule VALUES.

### 2026-06-12 — Exercise ladder created
- `Models/Exercises01_Composition.cs`: 7 incremental exercises (uncomment-one-rung-at-a-time), Module 2 mastery: station → partial application → Then → one-machine-many-workpieces → predicate rules → Or/Not combinators → boss: station factory + composition-vs-application time prediction.
- Closure question answered in chat (compiler-generated closure classes, IsValid as a tree of AndClosures).
- LADDER PENDING: learner to climb rungs 1–7.

## Recurring strengths
- Rewrites code himself instead of pasting; keeps comments as personal study notes.

## Watch list (recurring gaps)
- Signature honesty: twice declared parameters/types the body didn't honor — recheck every new function's promise vs body.
- Dropped `TotalDuration` fold (`Aggregate`) — good first exercise for Module 3/5.

## Next lesson
Module 3, Lesson 1–3: records as domain types, functions that apply to a type, **object as a factory of other objects** — exercise: make `BreathingPattern` produce derived patterns (e.g. `SlowedDown(factor)`) as new values, never mutating.
