import asyncio
from datetime import datetime, timedelta
from app.db.database import AsyncSessionLocal
from app.db.models import (
    User, UserRole,
    Project, ProjectStatus,
    Bid, BidStatus,
    Document, DocumentType,
    Evaluation
)

async def create_test_data():
    async with AsyncSessionLocal() as session:
        # ----------------------------
        # Create Users
        # ----------------------------
        org_user = User(
            email="organization@example.com",
            hashed_password="hashedpassword",
            role=UserRole.ORGANIZATION,
            full_name="Test Organization",
            company_name="Test Org Ltd",
            phone="1234567890"
        )

        bidder_user = User(
            email="bidder@example.com",
            hashed_password="hashedpassword",
            role=UserRole.BIDDER,
            full_name="Test Bidder",
            phone="0987654321"
        )

        session.add_all([org_user, bidder_user])
        await session.commit()

        print("✅ Users created")

        # ----------------------------
        # Create Projects
        # ----------------------------
        project1 = Project(
            organization_id=org_user.id,
            title="New Office Building Construction",
            description="Construction of a new office building in downtown.",
            tender_reference="REF-001",
            deadline=datetime.utcnow() + timedelta(days=30),
            status=ProjectStatus.ACTIVE,
            evaluation_criteria={
                "technical_weight": 60,
                "financial_weight": 40,
                "minimum_experience_years": 5
            },
            budget_range_min=100000,
            budget_range_max=500000
        )

        session.add(project1)
        await session.commit()
        print("✅ Project created")

        # ----------------------------
        # Create Bids
        # ----------------------------
        bid1 = Bid(
            project_id=project1.id,
            bidder_id=bidder_user.id,
            status=BidStatus.SUBMITTED,
            bid_amount=450000,
            currency="USD",
            cover_letter="We are the best choice for this project.",
            submitted_at=datetime.utcnow()
        )

        session.add(bid1)
        await session.commit()
        print("✅ Bid created")

        # ----------------------------
        # Create Documents
        # ----------------------------
        doc1 = Document(
            bid_id=bid1.id,
            document_type=DocumentType.RFP,
            filename="rfp_document.pdf",
            file_path="documents/rfp_document.pdf",
            file_size=204800,
            mime_type="application/pdf",
            extracted_text="Sample extracted text",
            metadata={"pages": 10}
        )

        session.add(doc1)
        await session.commit()
        print("✅ Document created")

        # ----------------------------
        # Create Evaluation
        # ----------------------------
        evaluation1 = Evaluation(
            bid_id=bid1.id,
            technical_score=55.0,
            financial_score=38.0,
            compliance_score=5.0,
            overall_score=98.0,
            ai_analysis={
                "strengths": ["Good technical approach"],
                "weaknesses": ["Budget slightly high"],
                "compliance_status": "pass",
                "recommendations": "Proceed with caution"
            },
            is_qualified=1,
            is_shortlisted=1,
            rank=1,
            reviewer_notes="Reviewed by admin",
            reviewed_by=org_user.id,
            reviewed_at=datetime.utcnow()
        )

        session.add(evaluation1)
        await session.commit()
        print("✅ Evaluation created")

if __name__ == "__main__":
    asyncio.run(create_test_data())
    print("🎉 Test data creation complete")
