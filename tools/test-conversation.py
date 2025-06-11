#!/usr/bin/env python3

import requests
import json

def test_conversation_flow():
    print("🧪 Testing MicroCrowd Enhanced Conversation Flow...")
    
    base_url = "http://localhost:8000"
    
    # Test 1: Health check
    print("1. Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   ❌ Health check failed: {e}")
        return
    
    # Test 2: Start a conversation
    print("\n2. Testing conversation start...")
    conversation_data = {
        "topic": "Test Product Feedback",
        "research_goal": "Understand user preferences",
        "discussion_guide": "1. What do you think about this product?\n2. How would you improve it?",
        "participant_personas": [
            {
                "id": "test-persona-1",
                "name": "Test User",
                "age": 30,
                "gender": "Other",
                "location": "Test City",
                "occupation": {
                    "title": "Tester",
                    "industry": "Testing",
                    "experience": 5,
                    "income": "$50,000"
                },
                "personality": {
                    "openness": 4.0,
                    "conscientiousness": 3.5,
                    "extraversion": 3.0,
                    "agreeableness": 4.5,
                    "neuroticism": 2.0
                },
                "personality_descriptions": {
                    "openness": "High openness",
                    "conscientiousness": "Medium conscientiousness", 
                    "extraversion": "Medium extraversion",
                    "agreeableness": "High agreeableness",
                    "neuroticism": "Low neuroticism"
                },
                "preferences": {
                    "interests": ["testing", "debugging"],
                    "hobbies": ["coding"],
                    "values": ["quality"],
                    "lifestyle": "tech-focused"
                },
                "behaviors": {
                    "communication_style": "direct",
                    "decision_making": "analytical",
                    "technology_adoption": "early adopter",
                    "shopping_habits": ["research-focused"]
                },
                "goals": {
                    "short_term": ["fix bugs"],
                    "long_term": ["improve systems"],
                    "fears": ["system failures"],
                    "aspirations": ["perfect code"]
                },
                "background": {
                    "education": "Computer Science",
                    "family_status": "Single",
                    "life_stage": "Career focused",
                    "experiences": ["software testing"]
                },
                "applied_fragments": ["tech_enthusiast"],
                "fragment_confidence_scores": {"tech_enthusiast": 0.9},
                "communication_patterns": ["asks technical questions"],
                "participation_level": "high",
                "response_length_tendency": "moderate",
                "expertise_areas": ["testing"],
                "discussion_goals": ["understand technical details"],
                "decision_factors": ["reliability", "performance"],
                "pain_points": ["bugs", "poor documentation"],
                "emotional_triggers": ["system failures"],
                "generated_summary": "A tech-focused individual passionate about quality and testing.",
                "source_data": {},
                "created_at": "2025-01-21T10:00:00Z"
            }
        ],
        "moderator_type": "AI",
        "max_turns": 5
    }
    
    try:
        response = requests.post(f"{base_url}/api/conversations/start", json=conversation_data)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Conversation started successfully")
            print(f"   Conversation ID: {result['data']['conversation_id']}")
            conversation_id = result['data']['conversation_id']
            
            # Test 3: Get next AI response
            print(f"\n3. Testing AI response generation...")
            try:
                response = requests.get(f"{base_url}/api/conversations/{conversation_id}/next-response")
                print(f"   Status: {response.status_code}")
                if response.status_code == 200:
                    print(f"   ✅ AI response generated successfully")
                    print(f"   Response: {response.json()}")
                else:
                    print(f"   ❌ AI response failed")
                    print(f"   Error: {response.text}")
            except Exception as e:
                print(f"   ❌ AI response failed: {e}")
                
        else:
            print(f"   ❌ Conversation start failed")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Conversation start failed: {e}")

if __name__ == "__main__":
    test_conversation_flow()