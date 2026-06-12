# Memory techniques (Kod Pamięci)

These techniques come from the Polish "Kod Pamięci" memory course. They're complementary to ADEPT: ADEPT is about *explaining*, these are about *encoding and retrieving*. Use them to bookend and augment explanations.

The umbrella concept is **Multisensory Concentration** (*Koncentracja Wielozmysłowa*): concentration isn't a muscle you train by staring at a candle — it's an *active* directing of multiple senses onto the information you want to remember. The techniques below all implement this principle.

---

## Free Notes / "You know more than you think"

**When to use it**: before starting a new substantial topic (distributed systems, DDD, a new framework). Before any explanation where activating prior knowledge will accelerate encoding.

**How**:
- Prompt: *"Before I explain [topic], take 2–3 minutes (or 10 if it's a big area). Write or say out loud everything you associate with it — even if you're not sure it's relevant. Don't stop, don't edit, don't judge. Just dump."*
- Learner can write, type, or dictate — whatever keeps the pen moving.
- The sheer act of doing it activates the existing siatka wiedzy (knowledge network), so new material has attachment points.

**Why it works**: retrieval strengthens memory *and* makes subsequent encoding stickier. Cold-starting into a new topic is like trying to dock a boat at an empty pier. Free-notes sets up the pier.

**In conversation**: a lightweight version is enough: *"Quick — before I explain the outbox pattern, what three words come to mind when you hear 'distributed transactions'? Whatever they are."*

---

## Magic 5: "What does this remind me of?"

**When to use it**: every time you introduce a new concept that has a structural similarity to something the learner already knows. (Which is most of the time, for a senior dev — most architecture patterns are variations on a small set of shapes.)

**How**:
- Prompt: *"Z czym Ci się to kojarzy?"* → "What does this remind you of?"
- Alternative: *"What's a concrete example of this you've seen?"* — works better when the learner is blank.
- Accept weird answers. The goal isn't a *correct* association; any association attaches the new node to the network.

**Example in use**:
> New concept: Saga pattern.
> Prompt: "What does a multi-step transaction that can fail partway through and need compensation remind you of?"
> Possible answers: booking a flight+hotel+car where any leg can fail; a try/finally block; distributed two-phase commit (more sophisticated answer).

All three are fine entry points. Use whichever the learner gives you.

**Why it works**: new information bonds to existing knowledge through association. The brain's storage is associative, not indexed — "add new link to existing node" is the cheapest encoding operation available.

---

## Proactive Looking / Listening / Note-taking

The three active-concentration techniques. Each one weaponizes internal dialogue rather than fighting it.

### Proactive Looking

**When**: the learner is looking at a diagram, code snippet, architecture drawing, or any mostly-visual information.

**How**: ask them to narrate what they see in internal dialogue. *"Before I explain the diagram, describe it in one sentence — what's the big shape? Where do the arrows point?"*

The narration *is* the concentration. It's what stops the eyes from glazing over while the mind wanders to lunch.

### Proactive Listening

**When**: long verbal/narrative explanations, talks, podcasts, meetings.

**How**: internal commentary in the form of questions — *"What does she want me to take away? Do I agree? What's the counter-example?"* Shorter than the speaker, because you think faster than they talk.

**In teaching**: at a natural pause, ask *"if you had to paraphrase what I just said in one sentence, what would you say?"*. This isn't a test — it's forcing the active-listening circuit to engage.

### Proactive Note-taking

**When**: dense multi-concept input (a long explanation, an architecture review, a conference talk).

**How**: write fast, keywords only, no polish. The process of writing — not the resulting notes — is the concentration mechanism. Engages visual + motor + auditory simultaneously.

**In teaching**: for long explanations, suggest the learner jot 3 keywords noting:
- **Order** (what came first, middle, last)
- **Importance** (what mattered most)
- **Novelty** (what was new to them)

This is also the hook for Flash Review later.

---

## Flash Review (Błyskawiczna Powtórka)

**When**: twice for anything worth remembering — right after the explanation, and right before you need to use it (interview, meeting, exam).

**How** (five beats, 60–90 seconds total):

1. **Relax.** Sit upright, one breath, eyes closed or soft-focused.
2. **Recall intent.** Finish the sentence *"I remember that..."* — state what you're about to recall.
3. **Return to the scene.** Where were you when you learned it? What did you see? What did you think? This is not nostalgia — the episodic context is a retrieval cue.
4. **Reconstruct the content.** In order, by importance, what was new, what was interesting. Say it out loud or write it.
5. **Stop.** Don't re-read the original — the recall *is* the review. Re-reading is worse than recall.

**Why it works**: retrieval practice consolidates memory better than re-exposure. Re-reading feels productive but is largely passive; recall is the active process that strengthens the trace. "Tuż po zapamiętaniu, tuż przed testem" — right after encoding, right before retrieval demand.

**In teaching**: the "Consolidate" phase of the teaching loop *is* a mini flash-review. For bigger topics, explicitly prompt the learner to do a full flash-review before the next session or before the interview.

---

## Indirect Reconstruction (Rekonstrukcja Pośrednia)

**When**: the learner knows they know something but can't surface it. ("What was that pattern called... it's like CQRS but for time-ordered events...")

**How**:
1. State the intent: "I want to remember X."
2. Breathe for 30 seconds — the relaxation lets the retrieval happen; straining blocks it.
3. Recall the *context* of when you learned it, not the fact itself. Where were you? Who told you? What else was in the chapter?
4. Describe each sensory fragment as it surfaces. Each fragment pulls on adjacent memories.
5. Keep circling. The answer surfaces through its neighbors, not head-on.

**In teaching**: if the learner is stuck mid-recall, don't just give them the answer. Prompt sideways: *"Don't reach for the name directly. What was the first example I used? What shape was the diagram?"* Often the missing term returns within 20 seconds.

**If it doesn't come back**: take a break. The brain continues searching in the background (this is real — the "tip of the tongue" state is a known phenomenon, often resolved minutes to hours later). Come back and try again.

---

## How these layer with ADEPT

| ADEPT phase | Memory technique that fits |
|---|---|
| Before starting | Free Notes, Magic-5 ("what does this remind you of?") |
| During diagram | Proactive Looking ("describe it first") |
| During explanation | Proactive Listening ("paraphrase what I just said") |
| During multi-concept lectures | Proactive Note-taking (3 keywords: order/importance/novelty) |
| After teaching | Flash Review (the consolidation phase of the teaching loop) |
| On re-surfacing later | Indirect Reconstruction when stuck |

The ADEPT loop is how you *explain*. These techniques are how you get the explanation to *stick*. Use them together.