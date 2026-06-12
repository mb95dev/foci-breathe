// ============================================================================
// 🎓 Zoran's FP Course — Module 2 deep-dive
// 🔗 FUNCTION COMPOSITION & ⚡ QUICK PROTOTYPING
//
// 🗺️ LEGEND
//    📦 ◆ [DATA]  immutable types — the workpiece, silent paper
//    ⚙️ ● [PURE]  transformations — stations, no side effects
//    🔊 ▲ [SHELL] side effects — the only place reality changes
//    ⭐ ★ ties a line of code to the metaphor
//
// 🏭 METAPHOR — THE ASSEMBLY LINE
//    Each function is a STATION 🛠️: workpiece enters, transformed workpiece
//    leaves. COMPOSITION 🔗 is bolting stations together so they become ONE
//    machine with one entrance and one exit. Two ways to ride the line:
//      (a) by VALUE    📦➡️🛠️➡️🛠️  push the workpiece station by station (Map)
//      (b) by FUNCTION 🛠️🔗🛠️=🏭  bolt stations into a machine, run later (Then)
//
// ⚡ QUICK PROTOTYPING — this file IS the prototype. No csproj, no Main:
//      ▶️ dotnet run Models/FunctionComposition.cs
// ============================================================================

// ───────────────────────────────────────────────────────────────────────────
// 1️⃣  📦 The workpiece
// ───────────────────────────────────────────────────────────────────────────

var box = new BreathingPattern("Box Breathing", "4-4-4-4 equal phases", new List<BreathingPhase>
{
    new("Inhale", TimeSpan.FromSeconds(4)),
    new("Hold",   TimeSpan.FromSeconds(4)),
    new("Exhale", TimeSpan.FromSeconds(4)),
    new("Rest",   TimeSpan.FromSeconds(4)),
});

// ───────────────────────────────────────────────────────────────────────────
// 2️⃣  🛠️ Stations: small pure functions, each Pattern -> Pattern
//     The type Pattern -> Pattern is CLOSED under composition 🧩: output of
//     any station fits the entrance of any other. That makes them LEGO.
// ───────────────────────────────────────────────────────────────────────────

Func<BreathingPattern, BreathingPattern> slowDown =                     // ⚙️⭐ station 1 🛠️
    p => p.Stretch(1.5);

Func<BreathingPattern, BreathingPattern> dropRests =                    // ⚙️⭐ station 2 🛠️
    p => p with { Phases = p.Phases.Where(ph => ph.Name != "Rest").ToList() };

Func<BreathingPattern, BreathingPattern> brandForSleep =                // ⚙️⭐ station 3 🛠️
    p => p with { Name = $"{p.Name} — Sleep Edition" };

// ───────────────────────────────────────────────────────────────────────────
// 3️⃣a  📦➡️ Composition by VALUE: the workpiece rides the line
// ───────────────────────────────────────────────────────────────────────────

box
    .Map(slowDown)        // ⚙️⭐ 📦 enters station 1
    .Map(dropRests)       // ⚙️⭐ ...rolls into station 2
    .Map(brandForSleep)   // ⚙️⭐ ...rolls into station 3
    .Describe()           // ⚙️ 🎼 transcription: Pattern -> string (still silent)
    .Print();             // 🔊 the ONLY noise in this file

// ───────────────────────────────────────────────────────────────────────────
// 3️⃣b  🏭 Composition by FUNCTION: build the machine FIRST, run it later
//      ⚠️ Note: `box` is not mentioned here — we compose MACHINERY, not values.
// ───────────────────────────────────────────────────────────────────────────

var sleepLine = slowDown.Then(dropRests).Then(brandForSleep);           // ⚙️⭐ 🛠️🔗🛠️🔗🛠️ = 🏭

sleepLine(box).Describe().Print();                                      // ✅ same result as 3a

// 💡 The machine is a VALUE — pass it around, store it, run many workpieces:
var fociFocus = new BreathingPattern("FOCI Focus", "Double inhale + long exhale", new List<BreathingPhase>
{
    new("Inhale", TimeSpan.FromSeconds(0.5)),
    new("Inhale", TimeSpan.FromSeconds(0.5)),
    new("Exhale", TimeSpan.FromSeconds(1)),
});

sleepLine(fociFocus).Describe().Print();   // ⭐ same line 🏭, different workpiece 📦

// ───────────────────────────────────────────────────────────────────────────
// 4️⃣  🧩 Why the types must align (dominos)
//     Composition only works when OUT of one station == IN of the next:
//        Pattern -> Pattern  ∘  Pattern -> string   ✅ dominos touch
//        Pattern -> string   ∘  Pattern -> Pattern  ❌ won't compile
//     🔬 Uncomment to watch the compiler defend the assembly line:
// ───────────────────────────────────────────────────────────────────────────
// var broken = BreathingFunctions.Describe.Then(slowDown);

// ============================================================================
// 📝 EXERCISE (one only — 15 minutes ⏱️):
//    Build `morningLine` 🌅 as a SINGLE composed Func<BreathingPattern, BreathingPattern>:
//      1. drop the Rest phases
//      2. speed up: Stretch(0.8)
//      3. rename to "<Name> — Morning Edition"
//    Then run BOTH `box` and `fociFocus` through it and Print the results.
//    🚫 Rule: no foreach, no intermediate pattern variables — composition only.
// ============================================================================
// ✅ your idea was right; two repairs:
//    1. Stretch(0.8) alone is not a station — freeze the factor inside a lambda
//       (that IS partial application: 🛠️ with one knob pre-set)
//    2. the rename station receives a PATTERN, not a name — dominos 🧩
var morningLine = dropRests
    .Then(p => p.Stretch(0.8))                                  // ⚙️⭐ station with pre-set knob
    .Then(p => p with { Name = $"{p.Name} — Morning Edition" }); // ⚙️⭐ rename the workpiece

morningLine(box).Describe().Print();
morningLine(fociFocus).Describe().Print();

// ───────────────────────────────────────────────────────────────────────────
// 5️⃣  🚦 Predicate composition — YOUR experiment, repaired
//     A rule is just a station whose output is bool: Order -> bool.
//     And() bolts two rules into one rule. Same assembly line, new cargo.
// ───────────────────────────────────────────────────────────────────────────

var goodOrder = new Order(new List<OrderItem> { new("Breathing mat", 49m) }, 49m, "Kraków");
var badOrder  = new Order(new List<OrderItem>(), 0m, null);

OrderRules.PrintExample(goodOrder);   // 🔊 all rules true  => valid
OrderRules.PrintExample(badOrder);    // 🔊 all rules false => invalid


// 📦 ◆ [DATA] The sheet music 🎼 — immutable records, no behavior, no lies
public record BreathingPhase(string Name, TimeSpan Duration);
public record BreathingPattern(string Name, string Description, IReadOnlyList<BreathingPhase> Phases);

// ⚙️ ● [PURE] Domain stations defined once, reusable everywhere
public static class BreathingFunctions
{
    // ♻️ Nondestructive: we never modify — we produce a new value.
    public static BreathingPattern Stretch(this BreathingPattern p, double factor) =>
        p with { Phases = p.Phases.Select(ph => ph with { Duration = ph.Duration * factor }).ToList() };

    public static string Describe(this BreathingPattern p) =>
        $"{p.Name}: " + string.Join(" → ", p.Phases.Select(ph => $"{ph.Name} {ph.Duration.TotalSeconds}s"));
}

// 🧰 The two composition primitives — small enough to memorize,
//    big enough to carry the whole course.
public static class FunctionalExtensions
{
    // ⚙️⭐ Map 📦➡️🛠️ : feed ONE workpiece into ONE station, take what comes out.
    //    "value-level composition" — you compose the JOURNEY of a value.

    public static TResult Map<T, TResult>(this T source, Func<T, TResult> fn) => 
              fn(source);
              
    // ⚙️⭐ Then 🛠️🔗🛠️ : bolt two stations into one machine (math: g ∘ f).
    //    "function-level composition" — you compose the MACHINERY itself.
    public static Func<TIn, TOut> Then<TIn, TMid, TOut>(
        this Func<TIn, TMid> first, Func<TMid, TOut> second) =>
        input => second(first(input));

    public static Func<T, bool> And<T>(this Func<T, bool> first, Func<T, bool> second) =>
             input => first(input) && second(input);

    public static Func<T, bool> And<T>(this Func<T, bool> first, Func<T, bool> second) =>
        input => first(input) && second(input);
    // 🔊 ▲ [SHELL] the only side effect, quarantined at the edge
    public static void Print(this string line) => Console.WriteLine(line);
}

// 📦 ◆ [DATA] your experiment's cargo
public record OrderItem(string Name, decimal Price);
public record Order(List<OrderItem> Items, decimal TotalAmount, string? ShippingAddress);

// ⚙️ ● [PURE] Rules as VALUES, not methods-that-answer.
//    Old OO style (your ValidateOrder with three ifs) ANSWERS the question.
//    Functional style: each rule IS a Func<Order, bool> you can compose 🔗.
public static class OrderRules
{
    // ⭐ No `order` parameter! A rule needs no order to EXIST —
    //    it needs one only to be APPLIED. (Your version took an Order
    //    and ignored it — the dishonest signature again, 3rd sighting 👀)
    public static readonly Func<Order, bool> HasItems =          // ⚙️⭐ rule = station 🛠️
        order => order.Items.Count > 0;

    public static readonly Func<Order, bool> HasPositiveAmount = // ⚙️⭐
        order => order.TotalAmount > 0;

    public static readonly Func<Order, bool> HasShippingAddress = // ⚙️⭐
        order => order.ShippingAddress != null;

    // 🔗 one machine made of three rules — note: no Order mentioned here,
    //    exactly like sleepLine never mentioned `box`
    public static readonly Func<Order, bool> IsValid =
        HasItems.And(HasPositiveAmount).And(HasShippingAddress);  // 🛠️🔗🛠️🔗🛠️ = 🏭

    // 🔊 ▲ [SHELL] apply each rule AND the composed machine, show the result
    public static void PrintExample(Order order) =>
        Console.WriteLine(
            $"📦 {order.ShippingAddress ?? "<no address>"}, items: {order.Items.Count}, total: {order.TotalAmount}\n" +
            $"   HasItems={HasItems(order)}  " +
            $"HasPositiveAmount={HasPositiveAmount(order)}  " +
            $"HasShippingAddress={HasShippingAddress(order)}\n" +
            $"   ✅ IsValid (all three And-ed) = {IsValid(order)}");
}

// ============================================================================
// 🗺️ EXECUTION WORKFLOW — how the expressions actually run
//
// There are TWO moments in time. Confusing them is the #1 composition bug.
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │ 🏗️ PHASE 1: COMPOSITION TIME — machines are built, NO data flows         │
// └──────────────────────────────────────────────────────────────────────────┘
//
//   var sleepLine = slowDown.Then(dropRests).Then(brandForSleep);
//
//   step 1: slowDown.Then(dropRests)
//           returns closure:  input => dropRests(slowDown(input))      🛠️🔗🛠️
//   step 2: (that).Then(brandForSleep)
//           returns closure:  input => brandForSleep(
//                                          dropRests(slowDown(input))) = 🏭
//
//   ⭐ sleepLine ≡ p => brandForSleep(dropRests(slowDown(p)))
//      Nothing executed yet — we only WRAPPED functions inside functions.
//      Same for rules:
//
//   IsValid ≡ order => ( HasItems(order) && HasPositiveAmount(order) )
//                        && HasShippingAddress(order)
//
// ┌──────────────────────────────────────────────────────────────────────────┐
// │ ⚡ PHASE 2: APPLICATION TIME — a workpiece finally flows                  │
// └──────────────────────────────────────────────────────────────────────────┘
//
//   sleepLine(box)  — the call unwinds INSIDE-OUT:
//
//   📦 box ──► ⚙️ slowDown ──► ⚙️ dropRests ──► ⚙️ brandForSleep ──► 📦 result
//        (4-4-4-4)      (6-6-6-6)        (6-6-6, no Rest)    ("— Sleep Edition")
//
//   IsValid(order) — flows left to right WITH SHORT-CIRCUIT ⛔:
//
//   📦 order ──► HasItems? ──true──► HasPositiveAmount? ──true──► HasShippingAddress?
//                   │false               │false                      │
//                   ▼                    ▼                           ▼
//                  ❌ false ⛔          ❌ false ⛔               ✅/❌ result
//                  (rules 2 & 3        (rule 3 never runs)
//                   NEVER execute)
//
// 💡 Why it matters in production: if HasShippingAddress did a DB lookup,
//    short-circuit means an empty cart NEVER hits the database. Order your
//    cheap rules first — same trick as `.Where()` before `.Select()` in EF.
// ============================================================================
