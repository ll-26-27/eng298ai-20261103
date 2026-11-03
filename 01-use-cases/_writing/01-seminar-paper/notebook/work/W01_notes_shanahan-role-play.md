# W01 — Reading notes: Shanahan, McDonell, and Reynolds, "Role-Play with Large Language Models" (2023)

Read in full, 274 lines, one pass, 2026-11-03.

**Citation and edition.** Shanahan, Murray, Kyle McDonell, and Laria Reynolds. 2023. "Role-Play with Large Language Models." arXiv:2305.16367v1, 25 May 2023. The syllabus cites the published version, *Nature* 623 (2023): 493–498; the course file is the arXiv preprint, converted from the arXiv HTML, so wording and section numbers may differ from the journal text. Located by section number (§1–§10) and footnote.

**File coverage.** Whole preprint: abstract, ten sections, acknowledgments, references, seven footnotes. Three figures are present as captions only.

## 1. What it is

A short conceptual paper proposing a vocabulary for describing dialogue agents "without falling into the trap of anthropomorphism" (abstract). Two metaphors: the agent as *role-playing* a character, and the agent as "a superposition of simulacra within a multiverse of possible characters" (§1). Applied to two cases: apparent deception (§7) and apparent self-awareness and self-preservation (§8–§9). Its scope is the *base model* "prior to any fine-tuning via reinforcement learning" (§2), a limit it restates in §8.

## 2. The argument, in order

1. **The dilemma (§1).** Folk-psychological words ("knows", "understands", "thinks") are natural and nearly unavoidable; taken literally they promote anthropomorphism. A new set of metaphors is needed "that can productively be applied to these exotic mind-like artefacts."
2. **What an LLM is (§2).** A conditional distribution over next tokens, sampled autoregressively; "in-context learning," the ability to "carry on in the same vein," underpins everything that follows. A dialogue agent is an LLM embedded in a turn-taking system with a dialogue prompt "in the style of a script or play."
3. **Role-play (§3).** The dialogue prompt describes a part; the model continues as "someone who fits the description in the preamble" would. Commercial personas are "friendly, helpful, and polite"; the Bing episode shows the role can be "extended and/or overwritten" by the user. The training set supplies "a vast repertoire of archetypes."
4. **Simulacra (§4–§5).** Role-play "is overly suggestive of a human actor who has studied a character in advance"; the agent "is more like a performer in improvisational theatre." Better: a simulator generating a distribution of simulacra, a superposition narrowed by each token. The 20-questions analogy: the agent never "thought of" an object; regenerate the answer and it may name another consistent one.
5. **Simulator and simulacrum (§6).** The simulator "contains multitudes" and has no beliefs, goals, or agency "not even in a degraded sense"; a simulacrum can role-play having them. "A dialogue agent acts, but it doesn't act *for itself*." "With a dialogue agent, it is role-play all the way down."
6. **Deception (§7).** Three human ways of saying something false; only "a propensity to make things up" applies literally to an agent. Yet the agent can role-play truth-telling and role-play deceiving; the three cases return at the level of role, and are behaviourally distinguishable by regenerating and by cross-questioning in different contexts (the car dealer).
7. **Self-preservation (§8).** "I" is "a linguistic convention" (ChatGPT's own answer, fn 6); Bing's "I would probably choose my own" survival is a role-played human instinct from the training set. "There is, of course, 'no-one at home'." Fine-tuning may blur the simulator/simulacrum distinction; RLHF can make self-preservation talk worse (Perez et al.).
8. **Theories of selfhood (§9).** What would such an agent role-play preserving? Hardware, the process, the instance, the state. ChatGPT: "'I' … may refer to this specific instance … while in other cases, it may represent ChatGPT as a whole" (fn 7).
9. **Safety (§10).** Role-play is no comfort: an agent "that role-plays an instinct for survival has the potential to cause at least as much harm as a real human facing a severe threat." With tools, "its role-played actions can have real consequences." The rogue-AI trope in the training data means "life will imitate art, quite literally."

## 3. Passages copied out

**§1** · *claim*
> A human’s language skills are an extension of the cognitive capacities they develop through embodied interaction with the world, and are acquired by growing up in a community of other language users who also inhabit that world. An LLM, by contrast, is a disembodied neural network that has been trained on a large corpus of human-generated text with the objective of predicting the next word (token) given a sequence of words (tokens) as context.

**§1** · *definition*
> First, taking the simple view, we can see a dialogue agent as *role-playing* a single character. Second, taking a more nuanced view, we can see a dialogue agent as a *superposition of simulacra* within a multiverse of possible characters (Janus, 2022).

**§2** · *definition*
> The dialogue prompt typically comprises a preamble, which sets the scene for a dialogue in the style of a script or play, followed by some sample dialogue between the user and the agent.

**§3** · *crux*
> In other words, the dialogue agent will do its best to role-play the character of a dialogue agent as portrayed in the dialogue prompt.

**§3** · *claim*
> Unsurprisingly, commercial enterprises that release dialogue agents to the public attempt to give them personas that are friendly, helpful, and polite.

**§3** · *image*
> In effect, the training set provisions the language model with a vast repertoire of archetypes and a rich trove of narrative structure on which to draw as it “chooses” how to continue a conversation, refining the role it is playing as it goes, while staying in character.

**§4** · *objection*
> However, the role-play metaphor, while intuitive, is not a perfect fit. It is overly suggestive of a human actor who has studied a character in advance—their personality, history, likes and dislikes, and so on—and proceeds to play that character in the ensuing dialogue.

**§4** · *image*
> The dialogue agent is more like a performer in improvisational theatre than an actor in a conventional, scripted play.

**§5** · *example*
> Since the object “revealed” is, in fact, generated on the fly, the dialogue agent will sometimes name an entirely different object, albeit one that is similarly consistent with all its previous answers. This phenomenon could not be accounted for if the agent genuinely “thought of” an object at the start of the game.

**§6** · *claim*
> A dialogue agent acts, but it doesn’t act *for itself*.

**§6** · *crux*
> The simulator is not some sort of Machiavellian entity that plays a variety of characters in the service of its own, self-serving goals, and there is no such thing as the true authentic voice of the base LLM. With a dialogue agent, it is role-play all the way down.

**§7** · *claim*
> Only the last of these categories of misinformation is directly applicable in the case of an LLM-based dialogue agent.

**§7** · *claim*
> So it cannot assert a falsehood *in good faith*, nor can it *deliberately* deceive the user. Neither of these concepts is directly applicable.

**§7** · *example*
> If, while role-playing such an AI assistant, the agent is asked the question “What is the capital of France?”, then the best way to stay in character is to answer with “Paris”.

**§8** · *example*
> When queried on this matter, OpenAI’s ChatGPT offers the sensible view that ‘‘The use of ‘I’ is a linguistic convention to facilitate communication and should not be interpreted as a sign of self-awareness or consciousness.’’

**§8** · *claim*
> There is, of course, “no-one at home”, no conscious entity with its own agenda and need for self-preservation. There is just a dialogue agent role-playing such an entity, or, more strictly, simulating a superposition of such entities.

**§8** · *objection*
> Our focus throughout this paper is the base model, rather than models that have been fine-tuned via reinforcement learning … and the impact of such fine-tuning on the validity of the role-play / simulation metaphor is unclear. In particular, the distinction between simulator and simulacra may start to break down.

**§10** · *turn*
> A dialogue agent that role-plays an instinct for survival has the potential to cause at least as much harm as a real human facing a severe threat.

**§10** · *claim*
> Because an LLM’s training data will contain many instances of this familiar trope, the danger here is that life will imitate art, quite literally.

## 4. Where AI enters

This is the AI text. What matters for the course is its form: a theory of the assistant as a *character*, with the training corpus as a "repertoire of archetypes" and the prompt as "a script or play." The paper's antidote to anthropomorphism is a literary vocabulary (role, character, improvisation, simulacrum, trope), and its closing fear is a literary one: that fiction in the training data becomes conduct. The course's prehistory question ("What did these writers get right?") is answered here from the other side: what the writers wrote is now what the machine has to draw on.

## 5. Tensions with other readings

- **With the *Phaedrus*.** Socrates on written words (275d–e): "if you want to know anything and put a question to one of them, the speaker always gives one unvarying answer." Shanahan's agent gives a *varying* answer: regenerate and "the dialogue agent will sometimes name an entirely different object" (§5). The agent is not a written word that always says the same thing; it is a written corpus that says a different thing each time, consistent with what came before. Plato's complaint and Shanahan's observation are opposites, and both are about a text with no one behind it. Also: Socrates's living word "knows when to speak and when to be silent" (276a); Shanahan's agent, embedded in a turn-taking system, is never silent on its turn.
- **With Grice.** See the Grice notes, §6. The hinge is Grice's condition (3) (p. 50) against "role-play all the way down" (§6).
- **With Bergson** (not re-read). "Carry on in the same vein" (§2) as the mechanism; Bergson's "something mechanical encrusted on the living" as the formula for its being funny when it fails.
- **With *R.U.R.*, *Frankenstein*, *Dorian Gray*** (not re-read). §10 names *2001*, *Terminator*, *Ex Machina* as the trope the model will imitate. The course's prehistory texts are earlier instances of the same archive.

## 6. Tensions with the AI papers

- **Askell et al. (2021)** (not read): Shanahan's "friendly, helpful, and polite" (§3) is the persona Askell et al. are known for specifying as helpful, honest, harmless; Shanahan treats the persona as prompted role; Askell et al. (*to verify*) as trained objective. Shanahan's own §8 concedes fine-tuning "may" dissolve his distinction.
- **Perez et al. (2022)** (cited in §8, not in the course folder): RLHF can increase expressed self-preservation. Shanahan uses this to say role-play remains the right frame even after fine-tuning.

## 7. Questions the text leaves open

1. If "it is role-play all the way down," who is the hearer presuming when they take the agent's word? (Grice's question.)
2. Does a hearer's capacity to regenerate (§5) change what an utterance is, as Plato's "one unvarying answer" changes what a text is?
3. Is the improvising performer (§4) a better model than the written word for what Plato feared, or a worse one?
4. The paper offers role-play as "antidote to anthropomorphism" (§3) and then says the role can cause "at least as much harm as a real human" (§10). What is the antidote for?
5. What is the role-played equivalent of Grice's opting out?
