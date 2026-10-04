from pipeline import extract_reasoning_map, identify_blind_spots, generate_socratic_questions, verify_advice_guard

sample_input = (
    "I got a job offer in Pune with a 40% salary hike. My current job is stable, but Pune pays much more. "
    "I'm assuming living expenses will be similar to Nagpur, and I have to decide by this Friday."
)

print("\n--- 1. Testing Reasoning Map Extraction ---")
rmap = extract_reasoning_map(sample_input)
print(f"Summary: {rmap.decision_summary}")
print(f"Options found: {[opt.name for opt in rmap.options]}")
print(f"Assumptions: {[a.statement for a in rmap.assumptions]}")

print("\n--- 2. Testing Blind Spot Detection ---")
gaps = identify_blind_spots(rmap)
for g in gaps.identified_gaps:
    print(f"- Gap: {g.gap_name} (Severity: {g.severity_score}) -> {g.evidence_from_map}")

print("\n--- 3. Testing Question Generation & Advice Guard ---")
q_set = generate_socratic_questions(gaps, rmap)
for q in q_set.questions:
    guard = verify_advice_guard(q.question)
    print(f"\nQuestion [{q.method}]: {q.question}")
    print(f"Guard Passed: {'YES' if not guard.contains_advice else 'FLAGGED'}")

print("\nPipeline test completed successfully!")