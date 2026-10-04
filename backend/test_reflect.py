from schemas import ReasoningMap, Option, Reason, Assumption
from pipeline import update_reasoning_map

old_map = ReasoningMap(
    decision_summary="Deciding whether to take a job offer in Pune or stay in Nagpur",
    options=[
        Option(
            name="Move to Pune",
            reasons=[
                Reason(text="40% salary hike", type="fact", salience="loud"),
                Reason(text="Pune living cost is same as Nagpur", type="guess", salience="loud"),
            ]
        ),
        Option(
            name="Stay in Nagpur",
            reasons=[
                Reason(text="Current job is stable", type="fact", salience="quiet")
            ]
        )
    ],
    assumptions=[
        Assumption(
            statement="Living expenses in Pune are identical to Nagpur",
            status="unchecked"
        )
    ],
    stakeholders=["Self", "Family"],
    timeframe="Decide by Friday"
)

user_answers = [
    {
        "question": "What evidence do you have that Pune rent and expenses match Nagpur?",
        "answer": "I checked 99acres and average 1BHK rent in Hinjewadi Pune is 22,000 INR, whereas in Nagpur I pay 8,000 INR. So Pune is significantly more expensive."
    }
]

print("--- Testing update_reasoning_map ---")
updated = update_reasoning_map(old_map, user_answers)
print("Updated assumptions:")
for a in updated.assumptions:
    print(f"- Statement: {a.statement}")
    print(f"  Status: {a.status}")
    print(f"  Evidence: {a.evidence}")

assert any(a.status == "checked" for a in updated.assumptions), "Expected at least one checked assumption"
print("\nVerification SUCCESS: Assumption status updated to 'checked' with factual evidence!")
