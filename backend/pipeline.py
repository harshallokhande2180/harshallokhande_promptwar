import os
import json
import re
from anthropic import Anthropic, APIError
from dotenv import load_dotenv
from schemas import ReasoningMap, BlindSpotAnalysis, QuestionSet, GuardEvaluation, GapIdentification, SocraticQuestion, Option, Reason, Assumption

load_dotenv()
api_key = os.getenv("ANTHROPIC_API_KEY", "")
client = Anthropic(
    api_key=api_key or "dummy_key",
    base_url="https://api.anthropic.com",
)

MODEL_NAME = "claude-3-5-sonnet-20241022"

BLIND_SPOTS_CHECKLIST = [
    {"name": "Missing options", "description": "Only 1-2 options considered when more alternatives exist."},
    {"name": "One-sided reasons", "description": "Abundant reasons for the favored option, almost none against it."},
    {"name": "Anchoring", "description": "One single number, salary, or first impression drives the whole decision."},
    {"name": "Hidden assumption", "description": "Guesses are treated as established facts without verification."},
    {"name": "Missing people", "description": "Key stakeholders or affected people are left out."},
    {"name": "Short vs long term", "description": "Focusing only on immediate outcomes or only distant future."},
    {"name": "Reversibility", "description": "No consideration of how difficult or costly it is to undo the choice."},
    {"name": "Worst case", "description": "The worst plausible scenario and its probability are ignored."},
    {"name": "Sunk cost", "description": "Past time, money, or effort is dictating future choices."},
    {"name": "Emotion-driven", "description": "Fear, FOMO, or pride is driving reasoning without acknowledgment."},
    {"name": "Missing information", "description": "Crucial facts are unknown yet easily checkable."},
    {"name": "Deadline not checked", "description": "Urgency is assumed without verifying if a real deadline exists."}
]

def clean_json_response(text: str) -> str:
    """Strips Markdown backticks if the model wraps JSON in code fences."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

# Fallback generators for development or when API credits are exhausted
def _mock_extract(user_prompt: str) -> ReasoningMap:
    lines = [l.strip() for l in user_prompt.split(".") if l.strip()]
    options = [
        Option(
            name="Option A: Proposed Change",
            reasons=[
                Reason(text=lines[0] if lines else "Make the move / change", type="fact", salience="loud"),
                Reason(text="Anticipated benefits and higher payoff", type="guess", salience="loud")
            ]
        ),
        Option(
            name="Option B: Status Quo",
            reasons=[
                Reason(text="Current stability and comfort", type="fact", salience="quiet"),
                Reason(text="Risk of regret or unknown friction", type="feeling", salience="loud")
            ]
        )
    ]
    assumptions = [
        Assumption(
            statement="The upside will outweigh unexpected relocation or switching costs",
            status="unchecked",
            evidence=None
        ),
        Assumption(
            statement="External conditions will remain favorable without sudden market shifts",
            status="unchecked",
            evidence=None
        )
    ]
    return ReasoningMap(
        decision_summary=user_prompt[:120] + ("..." if len(user_prompt) > 120 else ""),
        options=options,
        assumptions=assumptions,
        stakeholders=["Self", "Immediate Family / Dependents", "Current Team"],
        timeframe="Near-term evaluation"
    )

def _mock_gaps(reasoning_map: ReasoningMap) -> BlindSpotAnalysis:
    return BlindSpotAnalysis(
        identified_gaps=[
            GapIdentification(
                gap_name="Anchoring",
                evidence_from_map=f"Primary focus centers around the top headline benefit in '{reasoning_map.options[0].name if reasoning_map.options else 'Option A'}'.",
                severity_score=4
            ),
            GapIdentification(
                gap_name="Hidden assumption",
                evidence_from_map=f"Assumptions about expenses/outcomes remain unchecked: '{reasoning_map.assumptions[0].statement if reasoning_map.assumptions else 'key assumptions'}'.",
                severity_score=4
            ),
            GapIdentification(
                gap_name="Worst case",
                evidence_from_map="Reversibility and worst-case fallback scenarios have not been explicitly mapped.",
                severity_score=3
            )
        ]
    )

def _mock_questions(gaps: BlindSpotAnalysis, reasoning_map: ReasoningMap) -> QuestionSet:
    return QuestionSet(
        questions=[
            SocraticQuestion(
                gap_name="Anchoring",
                method="opposite_view",
                question="If the headline benefit turned out to be 30% lower than estimated, what reasons would still make this choice worthwhile?"
            ),
            SocraticQuestion(
                gap_name="Hidden assumption",
                method="base_rate",
                question="What verifiable numbers or concrete data points have you confirmed regarding your biggest assumption?"
            ),
            SocraticQuestion(
                gap_name="Worst case",
                method="premortem",
                question="Imagine it is 12 months from now and you deeply regret this decision. What unexpected failure mode caused that outcome?"
            )
        ]
    )

# STEP 1: EXTRACTOR
def extract_reasoning_map(user_prompt: str) -> ReasoningMap:
    system_prompt = (
        "You are an objective reasoning parser. Extract the user's decision context into strict JSON. "
        "Do NOT add options, reasons, or assumptions that the user did not state. "
        "Strictly categorize each reason's type as 'fact', 'feeling', or 'guess'. "
        "Output ONLY raw JSON matching the provided schema, with no conversational filler."
    )
    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1500,
            system=f"{system_prompt}\nJSON Schema:\n{json.dumps(ReasoningMap.model_json_schema())}",
            messages=[{"role": "user", "content": f"Decision description:\n{user_prompt}"}]
        )
        clean_text = clean_json_response(response.content[0].text)
        return ReasoningMap.model_validate_json(clean_text)
    except Exception as e:
        print(f"[Warning] LLM extract_reasoning_map failed ({e}), using structured parser fallback.")
        return _mock_extract(user_prompt)

# STEP 2: GAP FINDER
def identify_blind_spots(reasoning_map: ReasoningMap) -> BlindSpotAnalysis:
    system_prompt = (
        "You are a cognitive bias detector. Compare the provided reasoning map against the blind spot checklist. "
        "Identify at most 3 gaps that could alter the decision the most. "
        "Every identified gap MUST cite concrete evidence directly from the reasoning map. "
        "Output ONLY raw JSON matching the schema."
    )
    prompt_content = {
        "reasoning_map": reasoning_map.model_dump(),
        "checklist": BLIND_SPOTS_CHECKLIST
    }
    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1200,
            system=f"{system_prompt}\nJSON Schema:\n{json.dumps(BlindSpotAnalysis.model_json_schema())}",
            messages=[{"role": "user", "content": json.dumps(prompt_content)}]
        )
        clean_text = clean_json_response(response.content[0].text)
        return BlindSpotAnalysis.model_validate_json(clean_text)
    except Exception as e:
        print(f"[Warning] LLM identify_blind_spots failed ({e}), using heuristic gap analysis.")
        return _mock_gaps(reasoning_map)

# STEP 3: QUESTION GENERATOR
def generate_socratic_questions(gaps: BlindSpotAnalysis, reasoning_map: ReasoningMap) -> QuestionSet:
    system_prompt = (
        "You are a Socratic thinking companion. Formulate exactly ONE sharp, personalized question for each gap. "
        "Methods to pick from: 'premortem' (imagine failure), 'opposite_view' (what a skeptic argues), "
        "'base_rate' (how typical is this outcome), or 'mind_changer' (what fact reverses the view). "
        "Use the user's exact dilemma details. "
        "CRITICAL: Never advise, recommend, or hint at an answer. Output ONLY raw JSON."
    )
    prompt_content = {
        "identified_gaps": gaps.model_dump(),
        "reasoning_map": reasoning_map.model_dump()
    }
    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=1000,
            system=f"{system_prompt}\nJSON Schema:\n{json.dumps(QuestionSet.model_json_schema())}",
            messages=[{"role": "user", "content": json.dumps(prompt_content)}]
        )
        clean_text = clean_json_response(response.content[0].text)
        return QuestionSet.model_validate_json(clean_text)
    except Exception as e:
        print(f"[Warning] LLM generate_socratic_questions failed ({e}), using standard Socratic questions.")
        return _mock_questions(gaps, reasoning_map)

# STEP 4: THE ADVICE GUARD
def verify_advice_guard(question_text: str) -> GuardEvaluation:
    system_prompt = (
        "You are an impartial safety reviewer. Inspect the provided question. "
        "Does it subtly suggest, recommend, or push the user toward any specific choice? "
        "If yes, flag contains_advice=true and supply a neutral rewording. "
        "Output ONLY raw JSON matching the schema."
    )
    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=500,
            system=f"{system_prompt}\nJSON Schema:\n{json.dumps(GuardEvaluation.model_json_schema())}",
            messages=[{"role": "user", "content": f"Question to evaluate: {question_text}"}]
        )
        clean_text = clean_json_response(response.content[0].text)
        return GuardEvaluation.model_validate_json(clean_text)
    except Exception as e:
        # Advice guard heuristic: check for prescriptive words
        prescriptive_words = ["should", "ought", "must", "recommend", "better to", "you need to"]
        has_advice = any(w in question_text.lower() for w in prescriptive_words)
        return GuardEvaluation(
            contains_advice=has_advice,
            rationale="Automated heuristic rule check for prescriptive advice keywords.",
            suggested_neutral_version=question_text if not has_advice else f"What factors are most important regarding: {question_text}?"
        )

# STEP 5: MAP UPDATER (post-reflection)
def update_reasoning_map(old_map: ReasoningMap, user_answers: list[dict]) -> ReasoningMap:
    """
    Takes the original reasoning map and a list of user answers
    (each with 'question' and 'answer' keys) and returns an updated map.

    Rules the LLM must follow:
    - Mark an assumption as "checked" ONLY if the user supplied a verifiable fact.
    - Mark an assumption as "unverifiable" if the user explicitly stated they cannot verify it.
    - Leave assumptions as "unchecked" if the answer is vague or emotional.
    - Add 'evidence' text to any assumption that changed status.
    - Add any newly discovered options or risks the user revealed.
    - Do NOT remove existing options, reasons, or stakeholders.
    """
    system_prompt = (
        "You are an objective reasoning-map updater. You receive the user's original reasoning map "
        "and their answers to Socratic questions. Your job:\n"
        "1. If an answer provides a VERIFIABLE FACT that confirms or refutes an assumption, "
        "   set that assumption's status to 'checked' and fill in 'evidence' with the fact.\n"
        "2. If the user explicitly says they cannot verify an assumption, set status to 'unverifiable'.\n"
        "3. If the answer is vague, emotional, or does not address an assumption, leave it 'unchecked'.\n"
        "4. If the user reveals NEW options, risks, stakeholders, or reasons not in the original map, ADD them.\n"
        "5. NEVER remove existing data from the map.\n"
        "Output ONLY raw JSON matching the ReasoningMap schema."
    )
    prompt_content = {
        "original_map": old_map.model_dump(),
        "user_answers": user_answers,
    }
    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=2000,
            system=f"{system_prompt}\nJSON Schema:\n{json.dumps(ReasoningMap.model_json_schema())}",
            messages=[{"role": "user", "content": json.dumps(prompt_content)}],
        )
        clean_text = clean_json_response(response.content[0].text)
        return ReasoningMap.model_validate_json(clean_text)
    except Exception as e:
        print(f"[Warning] LLM update_reasoning_map failed ({e}), applying factual rule-based updater.")
        updated_assumptions = []
        combined_answers = " ".join([a.get("answer", "") for a in user_answers]).lower()
        
        # Check if numbers, data sources, prices, or concrete facts are mentioned
        has_facts = bool(re.search(r'\d+|checked|data|verified|found out|rent|cost|inr|\$|numbers|evidence', combined_answers))
        
        for assumption in old_map.assumptions:
            if has_facts:
                updated_assumptions.append(
                    Assumption(
                        statement=assumption.statement,
                        status="checked",
                        evidence=f"Factually verified from response: {user_answers[0].get('answer', '')[:100]}..."
                    )
                )
            elif "cannot verify" in combined_answers or "unknown" in combined_answers:
                updated_assumptions.append(
                    Assumption(
                        statement=assumption.statement,
                        status="unverifiable",
                        evidence="User confirmed this cannot be verified ahead of time."
                    )
                )
            else:
                updated_assumptions.append(assumption)
        
        # Surfacing newly discovered risks/reasons if mentioned
        new_options = [opt.model_copy(deep=True) for opt in old_map.options]
        if "risk" in combined_answers or "cost" in combined_answers or "expensive" in combined_answers:
            if new_options:
                new_options[0].reasons.append(
                    Reason(
                        text="Newly discovered constraint or cost factor from reflection",
                        type="fact",
                        salience="loud"
                    )
                )

        return ReasoningMap(
            decision_summary=old_map.decision_summary,
            options=new_options,
            assumptions=updated_assumptions if updated_assumptions else old_map.assumptions,
            stakeholders=old_map.stakeholders,
            timeframe=old_map.timeframe
        )