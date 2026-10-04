from schemas import ReasoningMap, Option, Reason, Assumption, SocraticQuestion, QuestionSet

# Test sample map validation
sample_map = ReasoningMap(
    decision_summary="Should I accept the job offer in Pune?",
    options=[
        Option(
            name="Accept Pune offer",
            reasons=[
                Reason(text="Salary is 30% higher", type="fact", salience="loud"),
                Reason(text="Pune has better tech community", type="guess", salience="quiet")
            ]
        ),
        Option(
            name="Stay at current job",
            reasons=[
                Reason(text="Comfortable work environment", type="feeling", salience="loud")
            ]
        )
    ],
    assumptions=[
        Assumption(statement="Living cost in Pune will not exceed 25k/month", status="unchecked")
    ],
    stakeholders=["Self", "Family"],
    timeframe="Decision needed within 1 week"
)

# Test sample question validation
sample_q = QuestionSet(
    questions=[
        SocraticQuestion(
            gap_name="Worst case",
            method="premortem",
            question="Imagine you quit this new job after 6 months. What was the exact reason?"
        )
    ]
)

print("Reasoning Map Validated Successfully!")
print(f"Summary: {sample_map.decision_summary}")
print(f"Options Count: {len(sample_map.options)}")
print(f"First Question: {sample_q.questions[0].question}")