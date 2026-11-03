# AI paper collection and Learning Lab workshops

## 1. About the paper collection

This is a selective collection of famous and influential papers on large language models, assembled for a humanities reader rather than as an exhaustive computer-science syllabus. The choices follow three connected threads:

- **How modern language models became possible.** Landmark papers trace the architecture and training ideas behind contemporary systems: word embeddings, attention, Transformers, lager-scale pretraining, scaling laws, efficient adaptation, retrieval, and tool use.

- **How the conversational assistant was constructed.** A second group follows the deliberate shaping of model behavior through human feedback, instruction-following, dialogue training, and written behavioral principles. These papers show that the familiar helpful assistant is not simply what a language model naturally is, but a role produced through particular technical and human choices.

- **How language models produce the impression of character and selfhood.** We have also emphasized papers that connect directly to themes from our discussion: dialogue; the literary and technical construction of character; the apparent persistence of identity through memory and context; and the illusion of encountering a stable speaker, agent, or self behind generated language.

Together, the collection moves between the canonical technical history of LLMs and the interpretive questions the course raises: what these systems are, how their behavior has been shaped, how they perform personhood, and how we might describe that performance without prematurely treating the model as a humanlike mind.

## 2. The papers

- **Mikolov et al., “Efficient Estimation of Word Representations in Vector Space” (2013).** This paper introduced word2vec, an efficient method for learning representations in which words become points in a multidimensional space and semantic relationships become geometrical relationships. It matters because it offers an early, influential example of how statistical learning turns features of language into manipulable mathematical structure.

- **Bahdanau, Cho, and Bengio, “Neural Machine Translation by Jointly Learning to Align and Translate” (2014).** The authors introduced a practical attention mechanism that lets a model focus on different parts of a source sentence while producing each part of a translation. The paper matters as a crucial step away from compressing a whole text into a single fixed representation and toward the attention-based architectures that followed.

- **Christiano et al., “Deep Reinforcement Learning from Human Preferences” (2017).** This paper demonstrates that comparisons supplied by nonexpert humans can be turned into a training signal for complex behavior. It matters because it establishes a key premise behind later language-model alignment: desired behavior can be taught through judgments of outputs, not only through explicit rules or correct answers.

- **Vaswani et al., “Attention Is All You Need” (2017).** This paper introduced the Transformer, an architecture built around attention rather than recurrent processing. Nearly every major contemporary large language model descends from this design, making the paper the central architectural landmark in the collection.

- **Devlin et al., “BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding” (2018).** BERT showed how a Transformer could learn rich representations by attending to both left and right context, then be adapted to many language-understanding tasks. It matters both as a major advance in pretraining and as a reminder that the Transformer family includes influential non-generative models, not just chatbots.

- **Raffel et al., “Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer” (2019).** The T5 project recast many different language tasks in a single text-in/text-out format and systematically investigated transfer learning at scale. It matters because it helped make the same general model architecture usable across translation, classification, summarization, question answering, and other forms of language work.

- **Kaplan et al., “Scaling Laws for Neural Language Models” (2020).** The authors found predictable relationships between model performance and increases in parameters, training data, and computational resources. The paper matters because it supplied an empirical rationale for the industry’s drive toward ever-larger models and helped define the scale-centered development paradigm behind the first generation of LLMs.

- **Brown et al., “Language Models Are Few-Shot Learners” (2020).** The GPT-3 paper showed that a sufficiently large autoregressive model could perform many tasks from instructions or a handful of examples placed directly in its prompt, without conventional task-specific retraining. It matters because it made in-context learning visible as a powerful general interface and helped inaugurate the present era of general-purpose language models.

- **Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks” (2020).** This paper combines a generative language model with a system that retrieves relevant passages from an external collection. It matters because retrieval-augmented generation, or RAG, provides a practical way to ground responses in selected sources and is central to building course-specific or character-specific systems from a curated corpus.

- **Stiennon et al., “Learning to Summarize from Human Feedback” (2020).** The authors trained a language model to produce better summaries by learning from human comparisons among candidate outputs. It matters as a bridge between early preference learning and the human-feedback techniques later used to shape general conversational assistants.

- **Hu et al., “LoRA: Low-Rank Adaptation of Large Language Models” (2021).** LoRA introduced a way to customize large pretrained models by training a comparatively tiny set of additional parameters rather than modifying the entire model. It matters because it dramatically lowered the cost of adaptation and helped make experimentation with specialized models more accessible.

- **Askell et al., “A General Language Assistant as a Laboratory for Alignment” (2021).** This paper explicitly treats the general language assistant as an object to be constructed and studies traits such as helpfulness, honesty, and harmlessness. It matters for the course because it makes clear that the familiar assistant persona is a designed behavioral achievement, not the automatic or inevitable voice of a base language model.

- **Thoppilan et al., “LaMDA: Language Models for Dialog Applications” (2022).** LaMDA offers a technical account of training and evaluating a model specifically for open-ended dialogue, with attention to qualities such as sensibleness, specificity, interestingness, safety, and factual grounding. It matters because it connects model development directly to the production and evaluation of convincing conversational performance.

- **Wei et al., “Chain-of-Thought Prompting Elicits Reasoning in Large Language Models” (2022).** The paper showed that prompting large models to generate intermediate steps could substantially improve performance on some reasoning tasks. It matters because it popularized a way of eliciting apparently structured reasoning through language while also raising important questions about what such verbal traces do—and do not—reveal about a model’s internal process.

- **Ouyang et al., “Training Language Models to Follow Instructions with Human Feedback” (2022).** Often known as the InstructGPT paper, this work describes how demonstrations and ranked human preferences can turn a pretrained language model into a system that more reliably follows user instructions. It matters because it documents the technical construction of the cooperative assistant behavior that users now tend to mistake for the natural behavior of an LLM.

- **Hoffmann et al., “Training Compute-Optimal Large Language Models” (2022).** The Chinchilla paper argued that many large models had too many parameters and had been trained on too little data for their available compute. It matters because it revised the prevailing understanding of scaling and showed that better-balanced training could outperform much larger systems.

- **Yao et al., “ReAct: Synergizing Reasoning and Acting in Language Models” (2022).** ReAct interleaves language-model reasoning traces with actions that consult tools or external environments. It matters because it helped define the modern agent pattern: a model not merely generating text, but using text to plan, gather information, act, observe results, and continue.

- **Shanahan, “Talking About Large Language Models” (2022).** Shanahan argues for describing model behavior precisely while resisting the unexamined use of terms such as “knows,” “believes,” and “thinks.” The paper matters because it gives humanists a careful vocabulary for analyzing remarkably humanlike linguistic performances without assuming a humanlike mind behind them.

- **Bai et al., “Constitutional AI: Harmlessness from AI Feedback” (2022).** Constitutional AI uses a written set of principles, model-generated critiques and revisions, and AI-mediated preference judgments to shape assistant behavior. It matters because it shows unusually clearly how prose instructions and normative principles can be operationalized as part of a model’s training and apparent character.

- **Touvron et al., “LLaMA: Open and Efficient Foundation Language Models” (2023).** LLaMA demonstrated that comparatively smaller models trained on abundant public data could compete with much larger systems and made powerful model weights available to researchers. It matters because it catalyzed the open-weights ecosystem and expanded who could inspect, adapt, and build upon foundation models.

- **Park et al., “Generative Agents: Interactive Simulacra of Human Behavior” (2023).** This paper combines an LLM with stored experience, retrieval, reflection, and planning to create simulated characters whose behavior appears to persist across time and social interaction. It matters because it reveals how much of a convincing “person” can be produced by an architecture around the model—especially memory and context—rather than by the language model alone.

- **Shanahan, McDonell, and Reynolds, “Role-Play with Large Language Models” (2023).** The authors propose role-play as the most productive way to describe the humanlike behavior of dialogue agents without attributing to them a stable inner self. This is the collection’s central conceptual paper for thinking about character: it connects the technical fact of generated continuation to the theatrical and literary experience of encountering a speaker who seems to possess identity, knowledge, motives, and agency.

## 3. Workshop 1 — Creating a chatbot character

The first workshop asks how a language model produces the impression that a stable person is speaking. After a brief demonstration of how a raw base model behaves before it has been trained into the social role of an assistant, students will build the same character at two depths: first in an accessible no-code tool, using instructions, source texts, role, and tone; then in a small, editable chat application whose model, system instructions, sources, and interface they can inspect and alter directly with VS Code and Claude Code. By testing their characters for consistency, fidelity, anachronism, susceptibility to user framing, and drift toward the default assistant voice, students will be able to ask which elements of an apparent persona come from the source corpus, the prompt, the platform, the underlying assistant training, the interface, and the expectations of the human interlocutor.

## 4. Workshop 2 — Vibe coding humanities work

The second workshop asks what a humanities scholar learns by turning an interpretive or research procedure into a working tool—and what implementation forces the scholar to make explicit. Students will begin with a scholarly maneuver, such as comparing passages, tracing a motif, staging alternate interpretations, assembling a small edition, or teaching a concept; describe in ordinary language what goes in, what transformation occurs, and what should come out; and then use an AI coding agent to build the smallest functioning version in the same VS Code and Claude Code environment. Testing the prototype on both fitting and resistant examples will expose hidden assumptions, ambiguities, and missing evidence, after which students will revise the project’s interpretive claim and document what the AI generated, what they themselves decided, and what responsible publication would require.
