from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_endpoints():
    # 1. Health check
    res = client.get("/")
    assert res.status_code == 200
    print("Health check response:", res.json())

    # 2. Analyze
    analyze_payload = {
        "user_text": "I got an offer from a startup in Bangalore offering 45 LPA, but my current job in Hyderabad is very stable with great work life balance. My family wants to stay in Hyderabad."
    }
    res = client.post("/api/analyze", json=analyze_payload)
    assert res.status_code == 200, f"Analyze failed: {res.text}"
    analyze_data = res.json()
    print("\nAnalyze succeeded!")
    print("Reasoning Map summary:", analyze_data["reasoning_map"]["decision_summary"])
    print("Identified gaps:", len(analyze_data["blind_spots"]["identified_gaps"]))
    print("Guarded Questions:", len(analyze_data["questions"]))

    # 3. Reflect
    reflect_payload = {
        "reasoning_map": analyze_data["reasoning_map"],
        "user_answers": [
            {
                "question": analyze_data["questions"][0]["question"],
                "answer": "I checked Bangalore traffic and rent near the startup office is 35k/month and work hours are 12 hours/day on average."
            }
        ]
    }
    res = client.post("/api/reflect", json=reflect_payload)
    assert res.status_code == 200, f"Reflect failed: {res.text}"
    reflect_data = res.json()
    print("\nReflect succeeded!")
    print("Updated Map assumptions:", reflect_data["updated_map"]["assumptions"])
    print("\nStep 2 Verification SUCCESS!")

if __name__ == "__main__":
    test_endpoints()
