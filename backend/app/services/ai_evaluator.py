import json
import logging
from typing import Dict, List, Any
import google.generativeai as genai
from app.core.config import settings

logger = logging.getLogger(__name__)

class AIEvaluator:
    """AI-powered bid evaluation service using Google Gemini"""
    
    def __init__(self):
        # Configure Gemini API
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        
        # Initialize model
        self.model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config={
                "temperature": 0.3,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
            }
        )
        
        logger.info(f"AI Evaluator initialized with model: {settings.GEMINI_MODEL}")
    
    async def evaluate_bid(
        self,
        bid_data: Dict[str, Any],
        project_criteria: Dict[str, Any],
        documents: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluate a bid against project criteria
        
        Args:
            bid_data: Basic bid information (amount, bidder details)
            project_criteria: Evaluation criteria from the project
            documents: List of extracted document contents
        
        Returns:
            Evaluation results with scores and analysis
        """
        try:
            # Prepare document summaries
            doc_summaries = self._prepare_documents(documents)
            
            # Create evaluation prompt
            prompt = self._create_evaluation_prompt(
                bid_data, 
                project_criteria, 
                doc_summaries
            )
            
            # Call Gemini API
            logger.info("Sending evaluation request to Gemini...")
            response = self.model.generate_content(prompt)
            
            # Parse response
            evaluation_text = response.text
            evaluation_result = self._parse_evaluation(evaluation_text)
            
            logger.info(f"Bid evaluation completed successfully")
            return evaluation_result
            
        except Exception as e:
            logger.error(f"Error in AI evaluation: {str(e)}")
            raise
    
    def _prepare_documents(self, documents: List[Dict[str, Any]]) -> Dict[str, str]:
        """Prepare document summaries for evaluation"""
        doc_summaries = {}
        
        for doc in documents:
            doc_type = doc.get("document_type", "unknown")
            content = doc.get("extracted_text", "")[:5000]  # Limit to 5000 chars
            
            if doc_type not in doc_summaries:
                doc_summaries[doc_type] = []
            
            doc_summaries[doc_type].append({
                "filename": doc.get("filename"),
                "content": content,
                "metadata": doc.get("metadata", {})
            })
        
        return doc_summaries
    
    def _create_evaluation_prompt(
        self,
        bid_data: Dict[str, Any],
        criteria: Dict[str, Any],
        documents: Dict[str, str]
    ) -> str:
        """Create detailed evaluation prompt for Gemini"""
        
        prompt = f"""You are an expert procurement evaluator analyzing a bid submission for a tender/project. Your task is to thoroughly evaluate the bid against the specified criteria and provide detailed scoring.

## PROJECT CRITERIA
{json.dumps(criteria, indent=2)}

## BID INFORMATION
- Bidder: {bid_data.get('company_name', 'N/A')}
- Bid Amount: {bid_data.get('bid_amount', 'N/A')} {bid_data.get('currency', 'USD')}
- Submission Date: {bid_data.get('submitted_at', 'N/A')}

## SUBMITTED DOCUMENTS
{self._format_documents(documents)}

## EVALUATION TASK

Please evaluate this bid comprehensively and provide your analysis in the following JSON format:

{{
  "technical_evaluation": {{
    "score": <0-100>,
    "strengths": [<list of technical strengths>],
    "weaknesses": [<list of technical weaknesses>],
    "key_findings": "<detailed technical assessment>"
  }},
  "financial_evaluation": {{
    "score": <0-100>,
    "competitiveness": "<assessment of pricing>",
    "financial_stability": "<assessment from financial docs>",
    "key_findings": "<detailed financial assessment>"
  }},
  "compliance_evaluation": {{
    "score": <0-100>,
    "status": "pass" or "fail",
    "missing_requirements": [<list any missing required items>],
    "compliance_issues": [<list any compliance concerns>]
  }},
  "overall_assessment": {{
    "overall_score": <weighted average based on criteria weights>,
    "recommendation": "award" or "shortlist" or "reject",
    "ranking_justification": "<why this bid should be ranked as it is>",
    "risk_factors": [<list any risk factors>],
    "summary": "<executive summary of the bid evaluation>"
  }}
}}

IMPORTANT GUIDELINES:
- Be objective and thorough
- Base scores on evidence from documents
- Consider the project criteria weights: Technical ({criteria.get('technical_weight', 60)}%), Financial ({criteria.get('financial_weight', 40)}%)
- Flag any red flags or concerns
- Provide actionable insights
- Ensure scores are realistic and justified

Return ONLY the JSON object, no additional text or markdown formatting."""

        return prompt
    
    def _format_documents(self, documents: Dict[str, List]) -> str:
        """Format documents for the prompt"""
        formatted = ""
        for doc_type, docs in documents.items():
            formatted += f"\n### {doc_type.upper()} DOCUMENTS\n"
            for doc in docs:
                formatted += f"\n**File: {doc['filename']}**\n"
                formatted += f"{doc['content'][:2000]}...\n"  # Limit per doc
        return formatted
    
    def _parse_evaluation(self, evaluation_text: str) -> Dict[str, Any]:
        """Parse Gemini's evaluation response"""
        try:
            # Try to extract JSON from response
            # Remove markdown code blocks if present
            cleaned = evaluation_text.strip()
            
            # Remove markdown formatting
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            # Try to find JSON in the text
            import re
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                cleaned = json_match.group(0)
            
            evaluation_data = json.loads(cleaned.strip())
            
            # Calculate overall score if not provided
            if "overall_assessment" in evaluation_data:
                if "overall_score" not in evaluation_data["overall_assessment"]:
                    tech_score = evaluation_data.get("technical_evaluation", {}).get("score", 0)
                    fin_score = evaluation_data.get("financial_evaluation", {}).get("score", 0)
                    comp_score = evaluation_data.get("compliance_evaluation", {}).get("score", 0)
                    
                    # Weighted average (adjust weights as needed)
                    overall = (tech_score * 0.5) + (fin_score * 0.3) + (comp_score * 0.2)
                    evaluation_data["overall_assessment"]["overall_score"] = round(overall, 2)
            
            return evaluation_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse evaluation JSON: {str(e)}")
            logger.error(f"Raw response: {evaluation_text}")
            
            # Return a default structure if parsing fails
            return {
                "technical_evaluation": {"score": 0, "key_findings": "Evaluation parsing failed"},
                "financial_evaluation": {"score": 0, "key_findings": "Evaluation parsing failed"},
                "compliance_evaluation": {"score": 0, "status": "fail"},
                "overall_assessment": {
                    "overall_score": 0,
                    "recommendation": "reject",
                    "summary": f"Error parsing evaluation: {str(e)}"
                },
                "raw_response": evaluation_text
            }
    
    async def compare_bids(
        self,
        evaluations: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Compare multiple bids and provide ranking recommendations"""
        
        prompt = f"""You are comparing multiple bids for a tender project. Analyze the evaluations and provide a comprehensive comparison and ranking.

## BID EVALUATIONS
{json.dumps(evaluations, indent=2)}

Provide a comparison analysis in JSON format:

{{
  "ranking": [
    {{
      "bid_id": <id>,
      "rank": <1, 2, 3...>,
      "score": <overall_score>,
      "justification": "<why this ranking>"
    }}
  ],
  "key_insights": [<list of insights from comparison>],
  "recommendation": "<final recommendation for contract award>",
  "value_for_money_analysis": "<which bid offers best value>"
}}

Return ONLY the JSON object, no additional text."""

        try:
            response = self.model.generate_content(prompt)
            comparison_text = response.text
            return self._parse_evaluation(comparison_text)
            
        except Exception as e:
            logger.error(f"Error in bid comparison: {str(e)}")
            raise
    
    async def extract_key_information(
        self,
        document_text: str,
        document_type: str
    ) -> Dict[str, Any]:
        """
        Extract key information from a document using Gemini
        
        Args:
            document_text: Extracted text from document
            document_type: Type of document (financial, technical, etc.)
        
        Returns:
            Dictionary with extracted key information
        """
        
        prompt = f"""Extract key information from this {document_type} document.

DOCUMENT TEXT:
{document_text[:4000]}

Please extract and structure the following information as JSON:

For FINANCIAL documents:
{{
  "revenue": "<amount and currency>",
  "profit": "<amount and currency>",
  "assets": "<amount and currency>",
  "key_metrics": [<list of important financial metrics>],
  "financial_health": "<brief assessment>"
}}

For TECHNICAL documents:
{{
  "technologies": [<list of technologies mentioned>],
  "experience_years": "<years of experience>",
  "team_size": "<number of team members>",
  "certifications": [<list of certifications>],
  "key_capabilities": [<list of capabilities>]
}}

For OTHER document types:
{{
  "key_points": [<list of important points>],
  "summary": "<brief summary>"
}}

Return ONLY the JSON object."""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text
            
            # Parse JSON response
            cleaned = result_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            
            import re
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                cleaned = json_match.group(0)
            
            return json.loads(cleaned.strip())
            
        except Exception as e:
            logger.error(f"Error extracting information: {str(e)}")
            return {
                "error": str(e),
                "summary": "Could not extract structured information"
            }