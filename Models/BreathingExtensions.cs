//<summary>
// <description>
// Zoran Horvat Functional Programming in C#
// </description>
// 1. This class is meant to learn quick prototyping with C# and .NET (functional)
// 2. Composing functions
// 2.1 Referenctial transparency
// 2.2 Pure functions
// 2.3 Immutable data
// 2.4 Higher-order functions
// 2.5 Partial application
// 2.6 Currying
// 2.7 Composition
// 2.8 Memoization
// 2.9 Lazy evaluation
//</summary>

//Function composition
// Entry point for running the breathing example
// You may need to put this in a Main method if running as a console app.
// Top-level statements entry point for running breathing example

var fociFocus = new BreathingPattern("FOCI Focus", "Double inhale + long exhale", new List<BreathingPhase>
{
    new BreathingPhase("Inhale", "Inhale for 0.5 seconds", TimeSpan.FromSeconds(0.5)),
    new BreathingPhase("Inhale", "Inhale for 0.5 seconds", TimeSpan.FromSeconds(0.5)),
    new BreathingPhase("Exhale", "Exhale for 1 second", TimeSpan.FromSeconds(1)),
});

fociFocus.Repeat(10).Print();

var boxBreathing = new BreathingPattern("Box Breathing", "4-4-4-4 equal phases", new List<BreathingPhase>
{
    new BreathingPhase("Inhale", "Inhale for 4 seconds", TimeSpan.FromSeconds(4)),
    new BreathingPhase("Hold", "Hold for 4 seconds", TimeSpan.FromSeconds(4)),
    new BreathingPhase("Exhale", "Exhale for 4 seconds", TimeSpan.FromSeconds(4)),
    new BreathingPhase("Rest", "Rest for 4 seconds", TimeSpan.FromSeconds(4)),
});

boxBreathing.Repeat(10).Print();

public static class BreathingExtensions
{
    // Higher-order function: the factory's output type must match the promise
    // in the return type — signature and body tell the same story.
    public static IEnumerable<BreathingPattern> Generate(int count, Func<int, BreathingPattern> factory) =>
        Enumerable.Range(0, count).Select(factory);

    // Enumerable.Repeat can repeat the value itself — no dummy 0 + Select needed.
    public static IEnumerable<BreathingPattern> Repeat(this BreathingPattern pattern, int count) =>
        Enumerable.Repeat(pattern, count);

    public static string Describe(this BreathingPattern pattern) =>
        $"{pattern.Name} - {pattern.Description}: " +
            string.Join(", ", pattern.Phases.Select(phase => $"{phase.Name} ({phase.Duration.TotalSeconds}s)"));

    public static void Print(this IEnumerable<BreathingPattern> patterns)
    {
        foreach (var pattern in patterns)
        {
            Console.WriteLine(pattern.Describe());
        }
    }
}

public record BreathingPattern(string Name, string Description, IEnumerable<BreathingPhase> Phases);
public record BreathingPhase(string Name, string Description, TimeSpan Duration);