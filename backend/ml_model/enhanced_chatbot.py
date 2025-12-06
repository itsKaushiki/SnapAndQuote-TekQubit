#!/usr/bin/env python3
"""
Enhanced AutoFix AI Chatbot with Langchain + Gemini Integration
Provides contextual responses about vehicle damage reports and repair recommendations
"""

import json
import sys
import os
from typing import Dict, List, Any

try:
    from langchain_google_genai import GoogleGenerativeAI
    from langchain.chains import ConversationChain
    from langchain.memory import ConversationBufferMemory
    from langchain.schema import BaseMessage, HumanMessage, AIMessage
except ImportError as e:
    print(f"Error: Required packages not installed. Run: pip install langchain langchain-google-genai")
    sys.exit(1)

# -----------------------------
# CONFIGURATION
# -----------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyBAl1Bf7254iBQeZzdrZ3jSeEkpwd800sI")
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")

def init_chatbot():
    """Initialize the Gemini-powered chatbot with memory."""
    try:
        llm = GoogleGenerativeAI(
            model=MODEL_NAME,
            google_api_key=GEMINI_API_KEY,
            temperature=0.4,
            max_output_tokens=800
        )
        
        memory = ConversationBufferMemory(return_messages=True)
        chat_chain = ConversationChain(
            llm=llm, 
            memory=memory, 
            verbose=False
        )
        
        return chat_chain
        
    except Exception as e:
        print(f"Error initializing chatbot: {e}")
        return None

def format_damage_report(report_data: Dict) -> str:
    """Format the damage report context for the LLM."""
    try:
        # Handle different possible report formats
        car_info = report_data.get('carInfo', {})
        if not car_info and 'car_model' in report_data:
            # Handle your provided format
            vehicle = report_data.get('car_model', 'Unknown Vehicle')
            state = report_data.get('state', 'Unknown State')
        else:
            # Handle AutoFix AI format
            vehicle = f"{car_info.get('year', '')} {car_info.get('name', '')} {car_info.get('model', '')}".strip()
            state = report_data.get('state', 'Unknown State')
        
        # Format damaged parts
        damaged_parts = report_data.get('damaged_parts', report_data.get('detectedParts', []))
        repair_analysis = report_data.get('repairAnalysis', [])
        
        parts_text = []
        if repair_analysis:
            # Enhanced format with repair analysis
            for analysis in repair_analysis:
                part_info = (
                    f"- {analysis['part'].capitalize()}: "
                    f"{analysis['severityPercentage']}% damage ({analysis['severity']}), "
                    f"Recommendation: {analysis['recommendation']}, "
                    f"Estimated time: {analysis['estimatedTime']}, "
                    f"Complexity: {analysis['complexity']}"
                )
                parts_text.append(part_info)
        elif isinstance(damaged_parts[0] if damaged_parts else None, dict):
            # Your provided format
            for part in damaged_parts:
                part_info = (
                    f"- {part['part'].capitalize()}: "
                    f"{part.get('damage_percent', 0)}% damage, "
                    f"{part.get('severity', 'Unknown')} severity, "
                    f"estimated cost ₹{part.get('cost', 0):,}"
                )
                parts_text.append(part_info)
        else:
            # Simple list format
            parts_text = [f"- {part.capitalize()}" for part in damaged_parts if part]
        
        # Format cost information
        total_cost = report_data.get('total_cost', report_data.get('totalCost', 0))
        oem_cost = report_data.get('totalOEMCost', 0)
        aftermarket_cost = report_data.get('totalAftermarketCost', 0)
        
        cost_info = f"Total estimated cost: ₹{total_cost:,}" if total_cost else "Cost estimation pending"
        if oem_cost and aftermarket_cost:
            savings = oem_cost - aftermarket_cost
            savings_percent = (savings / oem_cost) * 100 if oem_cost > 0 else 0
            cost_info = (
                f"OEM Parts Cost: ₹{oem_cost:,}\n"
                f"Aftermarket Cost: ₹{aftermarket_cost:,}\n"
                f"Potential Savings: ₹{savings:,} ({savings_percent:.1f}%)"
            )
        
        # Format service centers
        service_centers = report_data.get('nearestServiceCenters', [])
        service_info = ""
        if service_centers:
            local_mechanics = [sc for sc in service_centers if sc.get('type') == 'Local Mechanic']
            global_companies = [sc for sc in service_centers if 'Global Company' in sc.get('type', '')]
            
            service_info = f"\nAvailable Service Centers:\n"
            if local_mechanics:
                service_info += f"- {len(local_mechanics)} Local Mechanics (budget-friendly, quick service)\n"
            if global_companies:
                service_info += f"- {len(global_companies)} Authorized Centers (warranty service, premium)\n"
        
        formatted_report = (
            f"Vehicle: {vehicle} (State: {state})\n"
            f"Damaged Parts:\n" + "\n".join(parts_text) + "\n"
            f"{cost_info}"
            f"{service_info}"
        )
        
        return formatted_report
        
    except Exception as e:
        return f"Error formatting report: {str(e)}"

def process_user_query(user_input: str, context_data: Dict, chat_chain) -> str:
    """Process user query with damage report context using Gemini."""
    try:
        # Format the damage report for context
        report_context = format_damage_report(context_data)
        
        # Create an enhanced prompt for the automotive expert
        system_prompt = (
            "You are an expert automotive repair assistant with deep knowledge of:\n"
            "- Vehicle damage assessment and repair processes\n"
            "- Cost estimation for OEM vs aftermarket parts\n"
            "- Repair vs replacement recommendations\n"
            "- Service center selection (local mechanics vs authorized dealers)\n"
            "- Insurance claims and coverage\n"
            "- Repair timelines and complexity\n\n"
            "Guidelines for responses:\n"
            "1. Be concise but comprehensive\n"
            "2. Use the provided damage report data when relevant\n"
            "3. Offer practical advice and alternatives\n"
            "4. Explain technical concepts in simple terms\n"
            "5. Consider cost-effectiveness and safety\n"
            "6. Suggest both budget and premium options when appropriate\n\n"
        )
        
        # Build the conversation prompt
        conversation_prompt = (
            f"{system_prompt}"
            f"Current Vehicle Damage Report:\n{report_context}\n\n"
            f"User Question: {user_input}\n\n"
            f"Please provide a helpful, accurate response based on the damage report data and your automotive expertise."
        )
        
        # Get response from the chain
        response = chat_chain.run(input=conversation_prompt)
        
        # Clean up the response
        if response.startswith("AI: ") or response.startswith("Assistant: "):
            response = response.split(": ", 1)[1]
            
        return response.strip()
        
    except Exception as e:
        return f"I apologize, but I encountered an error processing your question: {str(e)}. Please try rephrasing your question."

def main():
    """Main function for command line usage."""
    if len(sys.argv) < 3:
        print("Usage: python enhanced_chatbot.py '<user_question>' '<json_context>'")
        sys.exit(1)
    
    try:
        user_question = sys.argv[1]
        json_context = sys.argv[2]
        
        # Parse the JSON context
        try:
            context_data = json.loads(json_context)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON context: {e}")
            sys.exit(1)
        
        # Initialize chatbot
        chat_chain = init_chatbot()
        if not chat_chain:
            print("Error: Failed to initialize chatbot")
            sys.exit(1)
        
        # Process the query
        response = process_user_query(user_question, context_data, chat_chain)
        
        # Return the response
        print(json.dumps({
            "success": True,
            "response": response,
            "model": MODEL_NAME
        }))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "model": MODEL_NAME
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()