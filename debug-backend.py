#!/usr/bin/env python3

import sys
import os
sys.path.append('../microcrowd-enhanced/backend')

# Test the backend components
def test_backend():
    print("🔍 Testing MicroCrowd Enhanced Backend Components...")
    
    try:
        # Test basic imports
        print("1. Testing imports...")
        from app.services.conversation_engine import ConversationEngine
        from app.models.persona import EnhancedPersona
        from config import settings
        print("✅ All imports successful")
        
        # Test configuration
        print("2. Testing configuration...")
        print(f"   OpenAI API Key: {'Set' if settings.OPENAI_API_KEY else 'NOT SET'}")
        print(f"   OpenAI Model: {settings.OPENAI_MODEL}")
        print(f"   Debug Mode: {settings.DEBUG}")
        
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
            print("❌ OpenAI API Key not properly configured!")
            return False
        
        # Test conversation engine initialization
        print("3. Testing conversation engine...")
        engine = ConversationEngine()
        print("✅ Conversation engine initialized")
        
        # Test persona creation
        print("4. Testing persona creation...")
        test_persona_data = {
            "id": "test-123",
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
        
        persona = EnhancedPersona(**test_persona_data)
        print("✅ Test persona created successfully")
        
        print("🎉 All backend components working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_backend()