We are building a collaborative canvas for writing short-form prose and poetry (say, 50 - 5000 words in length).

The goal of the canvas is to help the user go from a high-level idea of themes / characters / plot to a specific piece of writing whose form and content they are happy with.

We would like to organize data as nodes on a canvas based on level of abstraction. At the highest level of abstraction are "vibes" - high-level sentiments and themes that the author wants to communicate. Slightly less abstract are "sketches" - notes about characters, locations, events, etc. Even less abstract are "snippets" - pieces of text that the author has written, as well as quotations from other places which may serve as stylistic or ideological references. Finally there is the body of the text itself, which should be a standard document editor interface as opposed to an element on the canvas.

At any point the author should have the option to only see the elements at the k highest levels of abstraction (i.e. only vibes, vibes + sketches, vibes + sketches + snippets, all content). There should also be AI features for taking a node from the (k-1)th level of abstraction and using it to suggest something at the kth level of abstraction - for instance, suggesting a new plot device (sketch node) related to a vibe, or rewriting a passage from the final document based on a style reference (snippet node).

Architecture details:
- Python backend with FastAPI. Use Gemini Flash for LLM calls that require less thought / should be faster, and Claude Opus for LLM calls that require more thought / can be slower.
- Frontend is NextJS + Tailwind. Use tldraw for the canvas implementation. Use whatever is convenient for the document editor interface.