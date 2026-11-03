# Simulation

**Inputs:** four fictional library personas, individual Markdown knowledge
packets with verified quotes, a shared scenario, two timed events, and four
full-text research papers.

**Operations:** retrieve two cards → call Claude for one speaker → append
the reply → keep that speaker's short memo → rotate speakers. Twenty turns
total. Each output becomes the next call's input.

**Outputs:** the same actual model-generated meeting as an inspectable
[HTML page](outputs/index.html) and [Markdown transcript](outputs/conversation.md),
with raw requests, responses, input snapshots and token accounting.

**Student move:** add the chatbot from the preceding activity as a fifth
persona, choose its knowledge, and rerun. Compare the conversation rather
than just its final answer.

The example shows a shared room, not a prediction of a real community. It
uses one model, authored roles, fixed turns and simple keyword retrieval.
Early consensus and unresolved costs are features of the saved output to
question, not research findings.
