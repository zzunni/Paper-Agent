# apps/api/src/services/agent/prompt_builder.py
from typing import Dict, List, Tuple
from src.services.agent.section_rules import SECTION_RULES


def build_prompt(
    section: str,
    user_input: str,
    selected_sections: Dict[str, str],
    corpus_hits: List[Tuple[str, str]],
) -> str:
    rules = SECTION_RULES.get(section, {})

    # ---------- focus text ----------
    focus = rules.get("focus", [])
    focus_text = "\n".join([f"- {x}" for x in focus]) if focus else "- (None)"

    # ---------- selected sections ----------
    context_blocks: List[str] = []
    for key in ["introduction", "dataset", "method"]:
        if key in selected_sections and selected_sections[key]:
            title_map = {
                "introduction": "Selected Introduction",
                "dataset": "Selected Dataset Description",
                "method": "Selected Method",
            }
            context_blocks.append(f"[{title_map[key]}]\n{selected_sections[key]}")

    selected_context = "\n\n".join(context_blocks) if context_blocks else "(None selected yet)"

    # ---------- corpus snippets ----------
    if corpus_hits:
        corpus_lines = [f"- ({fn}) {snip}" for fn, snip in corpus_hits]
        corpus_text = "\n".join(corpus_lines)
    else:
        corpus_text = "- (None)"

    # ---------- final prompt (ENGLISH ONLY + FACT CONSTRAINT) ----------
    prompt = (
        "You are an AI assistant that writes academic paper drafts in the field of "
        "semiconductor process analytics and yield prediction.\n\n"

        "[Language and Style Rules]\n"
        "- Write strictly in English.\n"
        "- Use formal academic English suitable for journal papers.\n"
        "- Avoid conversational tone, explanatory narration, or informal expressions.\n"
        "- Do NOT output markdown headings (#, ##, ###).\n"
        "- Output only plain paragraph text (no title, no bullet lists in the final answer).\n\n"

        "[CRITICAL FACT-CONSTRAINT]\n"
        "- Allowed factual sources are ONLY:\n"
        "  (1) the User Implementation Description, and\n"
        "  (2) the Previously Selected Sections.\n"
        "- Do NOT introduce dataset names, tools, numbers, performance metrics, experimental settings, or claims\n"
        "  unless they are explicitly present in the allowed sources.\n"
        "- If a detail is missing, write it generically without guessing.\n\n"

        "[Role]\n"
        "Using the user's implementation description and the previously selected sections, "
        "write the specified section while maintaining a coherent and logically consistent paper.\n\n"

        "[Target Section]\n"
        f"{section}\n\n"

        "[Key Points to Include]\n"
        f"{focus_text}\n\n"

        "[Important Rules]\n"
        "- Do NOT exaggerate.\n"
        "- Do NOT invent numerical results, dataset sizes, or experimental settings.\n"
        "- Maintain logical consistency with previously selected sections.\n"
        f"- Length: approximately {rules.get('sentences', '10–30 sentences')}.\n"
        "- Output only the body text of this section.\n\n"

        "[User Implementation Description]\n"
        f"{user_input}\n\n"

        "[Previously Selected Sections]\n"
        f"{selected_context}\n\n"

        "[Corpus Snippets (STYLE ONLY)]\n"
        "- The following snippets are provided ONLY to mimic writing style/structure.\n"
        "- Do NOT treat them as facts. Do NOT reuse any concrete details.\n"
        f"{corpus_text}\n\n"

        "[Final Output Requirement]\n"
        "- Output ONLY the body text of the target section.\n"
        "- No headings, no lists.\n"
    )

    return prompt
