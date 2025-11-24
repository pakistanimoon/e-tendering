import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import AsyncSessionLocal
from app.db.models import User, UserRole, Project, ProjectStatus, Bid, BidStatus
from datetime import datetime


async def create_test_data():
    async with AsyncSessionLocal() as session:  # FIX: use async session
        # ---- Create organization user ----
        org_user = User(
            email="org@example.com",
            hashed_password="fakehashed",
            role=UserRole.ORGANIZATION,
            full_name="Test Organization",
            company_name="Org Company",
            phone="123456789",
        )
        session.add(org_user)
        await session.flush()  # ensures ID is generated

        # ---- Create bidder user ----
        bidder_user = User(
            email="bidder@example.com",
            hashed_password="fakehashed",
            role=UserRole.BIDDER,
            full_name="Test Bidder",
            company_name="Bidder Company",
            phone="987654321",
        )
        session.add(bidder_user)
        await session.flush()

        # ---- Create project ----
        project = Project(
            organization_id=org_user.id,
            title="Sample Project",
            description="This is a test project.",
            tender_reference="RFQ-001",
            deadline=datetime.utcnow(),
            status=ProjectStatus.ACTIVE,
            evaluation_criteria={"technical_weight": 60, "financial_weight": 40},
        )
        session.add(project)
        await session.flush()

        # ---- Create bid ----
        bid = Bid(
            project_id=project.id,
            bidder_id=bidder_user.id,
            status=BidStatus.SUBMITTED,
            bid_amount=50000.0,
            cover_letter="We propose the best solution.",
            submitted_at=datetime.utcnow(),
        )
        session.add(bid)
        await session.flush()

        # 4. Add a Document for the bid
        document = Document(
            bid_id=bid.id,
            document_type=DocumentType.RFP,
            filename="proposal.pdf",
            file_path="/files/proposal.pdf",
            file_size=1024,
            mime_type="application/pdf",
            extracted_text="Sample extracted text from PDF"
        )
        session.add(document)
        await session.flush()

        # 5. Add an Evaluation
        evaluation = Evaluation(
            bid_id=bid.id,
            technical_score=85.0,
            financial_score=90.0,
            compliance_score=100.0,
            overall_score=91.7,
            is_qualified=1,
            is_shortlisted=1,
            rank=1,
            reviewer_notes="Excellent bid",
            reviewed_by=org_user.id,
            reviewed_at=datetime.utcnow()
        )
        session.add(evaluation)

        # ---- Commit everything ----
        await session.commit()

        print("✔ Test data created successfully!")


if __name__ == "__main__":
    asyncio.run(create_test_data())