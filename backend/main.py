from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

from schemas import ReasoningMap
from pipeline import (
    extract_reasoning_map,
    identify_blind_spots,
    generate_socratic_questions,
    verify_advice_guard,
    update_reasoning_map,
)
from auth import (
    UserRegister,
    UserLogin,
    AuthResponse,
    UserProfile,
    register_user,
    login_user,
    get_current_user_from_token
)

app = FastAPI(
    title="Decision Mirror API",
    description="A Socratic thinking companion that mirrors your reasoning back at you.",
    version="1.0.0",
)

# CORS — allow the React dev server and common localhost origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    user_text: str

class GuardedQuestion(BaseModel):
    gap_name: str
    method: str
    question: str
    guard_passed: bool
    neutral_version: str | None = None

class AnalyzeResponse(BaseModel):
    reasoning_map: dict
    blind_spots: dict
    questions: List[GuardedQuestion]

class AnswerItem(BaseModel):
    question: str
    answer: str

class ReflectRequest(BaseModel):
    reasoning_map: dict
    user_answers: List[AnswerItem]

class ReflectResponse(BaseModel):
    updated_map: dict


# ── Routes ───────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Decision Mirror API"}


# ── Authentication Routes ───────────────────────────────────────────

@app.post("/api/auth/register", response_model=AuthResponse)
def api_register(req: UserRegister):
    try:
        return register_user(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@app.post("/api/auth/login", response_model=AuthResponse)
def api_login(req: UserLogin):
    try:
        return login_user(req)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")


@app.get("/api/auth/me")
def api_me(token: str):
    user = get_current_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid token")
    return {"user": user}


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_decision(req: AnalyzeRequest):
    """
    Full pipeline: extract → blind-spot scan → question generation → advice guard.
    """
    if not req.user_text or len(req.user_text.strip()) < 10:
        raise HTTPException(status_code=422, detail="Please describe your decision in at least a few sentences.")

    try:
        # Step 1 — Extract reasoning map
        reasoning_map = extract_reasoning_map(req.user_text)

        # Step 2 — Identify blind spots
        blind_spots = identify_blind_spots(reasoning_map)

        # Step 3 — Generate Socratic questions
        question_set = generate_socratic_questions(blind_spots, reasoning_map)

        # Step 4 — Run each question through the advice guard
        guarded_questions: List[GuardedQuestion] = []
        for q in question_set.questions:
            guard = verify_advice_guard(q.question)
            guarded_questions.append(GuardedQuestion(
                gap_name=q.gap_name,
                method=q.method,
                question=guard.suggested_neutral_version if guard.contains_advice and guard.suggested_neutral_version else q.question,
                guard_passed=not guard.contains_advice,
                neutral_version=guard.suggested_neutral_version,
            ))

        return AnalyzeResponse(
            reasoning_map=reasoning_map.model_dump(),
            blind_spots=blind_spots.model_dump(),
            questions=guarded_questions,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@app.post("/api/reflect", response_model=ReflectResponse)
def reflect_on_answers(req: ReflectRequest):
    """
    Takes the original reasoning map and user answers, returns an updated map
    with assumptions marked as checked/unchecked/unverifiable.
    """
    try:
        old_map = ReasoningMap.model_validate(req.reasoning_map)
        answers = [{"question": a.question, "answer": a.answer} for a in req.user_answers]
        updated_map = update_reasoning_map(old_map, answers)

        return ReflectResponse(updated_map=updated_map.model_dump())

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reflection error: {str(e)}")
