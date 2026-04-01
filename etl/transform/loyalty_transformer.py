import logging

import pandas as pd

logger = logging.getLogger(__name__)

LOYALTY_COLUMN_MAP = {
    "program_id": "ProgramId",
    "campaign_id": "CampaignId",
    "user_id": "UserId",
    "points_earned": "PointsEarned",
    "points_redeemed": "PointsRedeemed",
    "transaction_type": "TransactionType",
    "transaction_date": "TransactionDate",
    "notes": "Notes",
}

VALID_TRANSACTION_TYPES = {"Earn", "Redeem", "Expire"}


class LoyaltyTransformer:
    """
    Transforms raw loyalty transaction DataFrames into the shape
    expected by the LoyaltyTransactions SQL table.
    """

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        df = df.copy()
        df.columns = [c.lower().strip() for c in df.columns]
        df = df.rename(columns={k: v for k, v in LOYALTY_COLUMN_MAP.items() if k in df.columns})

        for col in ("ProgramId", "CampaignId", "UserId", "TransactionType"):
            if col not in df.columns:
                raise ValueError(f"Required column missing after mapping: {col}")

        # Parse dates
        if "TransactionDate" in df.columns:
            df["TransactionDate"] = pd.to_datetime(df["TransactionDate"], utc=True, errors="coerce")
            df["TransactionDate"] = df["TransactionDate"].fillna(pd.Timestamp.utcnow())
        else:
            df["TransactionDate"] = pd.Timestamp.utcnow()

        # Coerce points to int
        for col in ("PointsEarned", "PointsRedeemed"):
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)
            else:
                df[col] = 0

        # Validate non-negative points
        df = df[(df["PointsEarned"] >= 0) & (df["PointsRedeemed"] >= 0)]

        # Filter invalid transaction types
        original_count = len(df)
        df = df[df["TransactionType"].isin(VALID_TRANSACTION_TYPES)]
        if len(df) < original_count:
            logger.warning("Dropped %d rows with invalid TransactionType", original_count - len(df))

        # Drop duplicates
        df = df.drop_duplicates(subset=["ProgramId", "CampaignId", "UserId", "TransactionDate", "TransactionType"])

        if "Notes" not in df.columns:
            df["Notes"] = None

        cols = ["ProgramId", "CampaignId", "UserId", "PointsEarned", "PointsRedeemed",
                "TransactionType", "TransactionDate", "Notes"]
        df = df[[c for c in cols if c in df.columns]]

        logger.info("LoyaltyTransformer: %d rows ready for load", len(df))
        return df.reset_index(drop=True)
