// ============================================================================
// 🎓 Zoran's FP Course — EXERCISE LADDER 01: Function Composition
//
// ▶️ Run:  dotnet run Models/Exercises01_Composition.cs
//
// 🪜 HOW THIS FILE WORKS — incremental, one rung at a time:
//    1. Each exercise is a commented-out block. Uncomment ONLY the current one.
//    2. Replace the ❓ TODO part with your code.
//    3. Run. Compare with the ✅ EXPECTED comment. Match? Climb to the next rung.
//    4. Stuck > 10 minutes? Ask for a hint — not the solution.
//
// 🗺️ LEGEND: 📦 data · ⚙️ pure station · 🔊 side effect · ⭐ metaphor anchor
// 🏭 METAPHOR: stations on an assembly line; composition bolts them into machines.
//
// 🧰 The toolkit (records, Map, Then, And, Stretch, Describe, Print) is at the
//    bottom of the file — already complete, no need to touch it. Exercises 6–7
//    will ADD to it.
// ============================================================================

"🪜 Exercise ladder loaded. Uncomment Exercise 1 and climb.".Print();

// 📦 Shared workpieces for all exercises
var box = new BreathingPattern("Box Breathing", new List<BreathingPhase>
{
    new("Inhale", TimeSpan.FromSeconds(4)),
    new("Hold",   TimeSpan.FromSeconds(4)),
    new("Exhale", TimeSpan.FromSeconds(4)),
    new("Rest",   TimeSpan.FromSeconds(4)),
});

var fociFocus = new BreathingPattern("FOCI Focus", new List<BreathingPhase>
{
    new("Inhale", TimeSpan.FromSeconds(0.5)),
    new("Inhale", TimeSpan.FromSeconds(0.5)),
    new("Exhale", TimeSpan.FromSeconds(1)),
});

// ════════════════════════════════════════════════════════════════════════════
// 1️⃣ WARM-UP — one station, applied with Map                       difficulty ▰▱▱▱▱
//
//    Write a station `shout` that upper-cases a pattern's Name,
//    then push `box` through it with .Map() and print the description.
//
//    💡 A station is just Func<BreathingPattern, BreathingPattern>.
//
// ✅ EXPECTED: BOX BREATHING: Inhale 4s → Hold 4s → Exhale 4s → Rest 4s
// ════════════════════════════════════════════════════════════════════════════

 Func<BreathingPattern, BreathingPattern> shout => p with { Name = p.Name.ToUpper()};
 box.Map(shout).Describe().Print();

// ════════════════════════════════════════════════════════════════════════════
// 2️⃣ FREEZE THE KNOB — partial application by hand                 difficulty ▰▰▱▱▱
//
//    Stretch needs TWO things: a pattern and a factor. A station may take
//    only ONE. Build a station `doubled` with the factor 2.0 frozen inside.
//
//    💡 This is the fix you needed in morningLine: p => p.Stretch(...)
//
// ✅ EXPECTED: FOCI Focus: Inhale 1s → Inhale 1s → Exhale 2s
// ════════════════════════════════════════════════════════════════════════════

 Func<BreathingPattern, BreathingPattern> doubled = p => p.Stretch(2.0);
 fociFocus.Map(doubled).Describe().Print();

// ════════════════════════════════════════════════════════════════════════════
// 3️⃣ BOLT TWO STATIONS — first Then                                difficulty ▰▰▱▱▱
//
//    Compose `shout` and `doubled` (from rungs 1–2) into ONE machine
//    `shoutAndDouble` using .Then(). Run `box` through it.
//
//    🔮 PREDICT FIRST: does the order shout→doubled vs doubled→shout
//       change the output here? Decide, THEN run.
//
// ✅ EXPECTED: BOX BREATHING: Inhale 8s → Hold 8s → Exhale 8s → Rest 8s
// ════════════════════════════════════════════════════════════════════════════

 var shoutAndDouble = shout.Then(doubled);
 shoutAndDouble(box).Describe().Print();

// ════════════════════════════════════════════════════════════════════════════
// 4️⃣ ONE MACHINE, MANY WORKPIECES                                  difficulty ▰▰▰▱▱
//
//    Build `eveningLine`: drop all "Rest" phases, stretch by 1.25,
//    rename to "<Name> — Evening". ONE composed Func, no intermediate
//    pattern variables. Then run BOTH workpieces through it — but:
//
//    🚫 you may write `eveningLine(...)` only ONCE. Use LINQ over
//       new[] { box, fociFocus } to feed the line. (A machine is a value —
//       Select takes a Func directly!)
//
// ✅ EXPECTED: Box Breathing — Evening: Inhale 5s → Hold 5s → Exhale 5s
//              FOCI Focus — Evening: Inhale 0.625s → Inhale 0.625s → Exhale 1.25s
// ════════════════════════════════════════════════════════════════════════════

 var eveningLine = dropRests.Then(p => p.Stretch(1.25).Then(p => p with { Name = $"{p.Name} — Evening" }));
 new[] { box, fociFocus }.Select(eveningLine).ToList().ForEach(s => s.Describe().Print());

// ════════════════════════════════════════════════════════════════════════════
// 5️⃣ RULES AS VALUES — predicate composition                       difficulty ▰▰▰▱▱
//
//    A breathing pattern is "calming" when:
//      a) its exhale time is LONGER than its inhale time, AND
//      b) it has at least 3 phases.
//    Write the two rules as Func<BreathingPattern, bool> VALUES
//    (no parameters you don't use! 👀) and compose them with .And().
//
// ✅ EXPECTED: Box Breathing calming: False
//              FOCI Focus calming: False
//    🤔 BONUS: FOCI Focus has Exhale 1s vs Inhale 1s total — change one
//       duration in the workpiece to make it True and explain why.
// ════════════════════════════════════════════════════════════════════════════

// Func<BreathingPattern, bool> exhaleDominates = ❓;
// Func<BreathingPattern, bool> hasEnoughPhases = ❓;
// var isCalming = ❓;
// $"Box Breathing calming: {isCalming(box)}".Print();
// $"FOCI Focus calming: {isCalming(fociFocus)}".Print();

// ════════════════════════════════════════════════════════════════════════════
// 6️⃣ COMPLETE THE ALGEBRA — write Or and Not                       difficulty ▰▰▰▰▱
//
//    Go down to FunctionalExtensions and add two combinators yourself:
//      Or<T>  : (Func<T,bool>, Func<T,bool>) -> Func<T,bool>
//      Not<T> : Func<T,bool>                 -> Func<T,bool>
//    Then express here: "energizing = NOT calming OR has fewer than 4 phases"
//    as ONE composed rule. No && or || allowed HERE — only your combinators.
//
// ✅ EXPECTED: Box Breathing energizing: True
//              FOCI Focus energizing: True
// ════════════════════════════════════════════════════════════════════════════

// var isEnergizing = ❓;   // uses Not(...) and .Or(...)
// $"Box Breathing energizing: {isEnergizing(box)}".Print();
// $"FOCI Focus energizing: {isEnergizing(fociFocus)}".Print();

// ════════════════════════════════════════════════════════════════════════════
// 7️⃣ BOSS 👹 — SEE the two phases of time with your own eyes       difficulty ▰▰▰▰▰
//
//    a) Write `MakeStretcher`: a STATION FACTORY 🏗️ — given a factor,
//       it returns a station. Inside, BEFORE returning the lambda, print
//       "🏗️ building stretcher x{factor}". Inside the lambda itself,
//       print "⚙️ stretching {p.Name}".
//    b) Build: var gentle = MakeStretcher(1.1).Then(MakeStretcher(1.2));
//    c) 🔮 PREDICT the exact output order of the next two lines, write your
//       prediction in a comment, THEN run:
//          "— machine built, nothing stretched yet —".Print();
//          gentle(box).Describe().Print();
//
//    If your prediction was wrong, you've found the exact edge of your
//    mental model — reread the EXECUTION WORKFLOW graph in
//    FunctionComposition.cs and try to say WHY.
//
// ✅ EXPECTED ORDER: both 🏗️ lines print BEFORE "machine built",
//                    both ⚙️ lines print AFTER it.
// ════════════════════════════════════════════════════════════════════════════

// static Func<BreathingPattern, BreathingPattern> MakeStretcher(double factor)
// {
//     ❓
// }
// var gentle = ❓;
// // my prediction: ...
// "— machine built, nothing stretched yet —".Print();
// gentle(box).Describe().Print();


// ════════════════════════════════════════════════════════════════════════════
// 🧰 TOOLKIT — complete, don't modify (except Exercise 6 additions)
// ════════════════════════════════════════════════════════════════════════════

// 📦 ◆ [DATA]
public record BreathingPhase(string Name, TimeSpan Duration);
public record BreathingPattern(string Name, IReadOnlyList<BreathingPhase> Phases);

// ⚙️ ● [PURE] domain functions
public static class BreathingFunctions
{
    public static BreathingPattern Stretch(this BreathingPattern p, double factor) =>
        p with { Phases = p.Phases.Select(ph => ph with { Duration = ph.Duration * factor }).ToList() };

    public static string Describe(this BreathingPattern p) =>
        $"{p.Name}: " + string.Join(" → ", p.Phases.Select(ph => $"{ph.Name} {ph.Duration.TotalSeconds}s"));

    // helpers for Exercise 5 — total seconds spent in phases of a given name
    public static double TotalSeconds(this BreathingPattern p, string phaseName) =>
        p.Phases.Where(ph => ph.Name == phaseName).Sum(ph => ph.Duration.TotalSeconds);
}

// 🧰 composition primitives
public static class FunctionalExtensions
{
    // ⚙️⭐ value-level: one workpiece through one station
    public static TResult Map<T, TResult>(this T source, Func<T, TResult> fn) => fn(source);

    // ⚙️⭐ function-level: bolt stations into a machine
    public static Func<TIn, TOut> Then<TIn, TMid, TOut>(
        this Func<TIn, TMid> first, Func<TMid, TOut> second) =>
        input => second(first(input));

    // ⚙️⭐ rule algebra (Exercise 6: add Or and Not below)
    public static Func<T, bool> And<T>(this Func<T, bool> first, Func<T, bool> second) =>
        input => first(input) && second(input);

    // 🔊 ▲ [SHELL]
    public static void Print(this string line) => Console.WriteLine(line);
}
