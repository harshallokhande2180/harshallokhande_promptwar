from typing import List, Literal, Optional
from pydantic import BaseModel, Field

# 1. Structure of individual reasons
class Reason(BaseModel):
    text: str
    type: Literal["fact", "feeling", "guess"]
    salience: Literal["loud", "quiet"]

# 2. Structure of options (e.g., "Take Pune Job", "Stay")
class Option(BaseModel):
    name: str
    reasons: List[Reason]

# 3. Structure of assumptions
class Assumption(BaseModel):
    statement: str
    status: Literal["unchecked", "checked", "unverifiable"] = "unchecked"
    evidence: Optional[str] = None

# 4. The complete Reasoning Map
class ReasoningMap(BaseModel):
    decision_summary: str
    options: List[Option]
    assumptions: List[Assumption]
    stakeholders: List[str]
    timeframe: Optional[str] = None

# 5. Blind spot gap detection
class GapIdentification(BaseModel):
    gap_name: str
    evidence_from_map: str
    severity_score: int = Field(ge=1, le=5)

class BlindSpotAnalysis(BaseModel):
    identified_gaps: List[GapIdentification]

# 6. Socratic Question format
class SocraticQuestion(BaseModel):
    gap_name: str
    method: Literal["premortem", "opposite_view", "base_rate", "mind_changer"]
    question: str

class QuestionSet(BaseModel):
    questions: List[SocraticQuestion]

# 7. Advice Guard verification
class GuardEvaluation(BaseModel):
    contains_advice: bool
    rationale: str
    suggested_neutral_version: Optional[str] = None