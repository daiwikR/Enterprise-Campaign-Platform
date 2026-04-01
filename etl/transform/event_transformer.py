import logging
from datetime import datetime

import pandas as pd

logger = logging.getLogger(__name__)

# Expected source columns → target SQL columns
EVENT_COLUMN_MAP = {
    "campaign_id": "CampaignId",
    "event_type": "EventType",
    "source": "Source",
    "occurred_at": "OccurredAt",
    "metadata": "Metadata",
    "revenue": "Revenue",
}

VALID_EVENT_TYPES = {"Impression", "Click", "Conversion", "PageView", "FormSubmit"}


class EventTransformer:
    """
    Transforms raw campaign event DataFrames into the shape
    expected by the CampaignEvents SQL table.

    Rules (idempotent):
    - Rename columns per EVENT_COLUMN_MAP
    - Parse OccurredAt as UTC datetime; default to now() if missing
    - Coerce Revenue to float; set to None if non-numeric
    - Filter out rows with unknown EventType
    - Drop exact duplicates (same CampaignId + EventType + OccurredAt)
    """

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        df = df.copy()
        df.columns = [c.lower().strip() for c in df.columns]

        # Rename to target schema
        df = df.rename(columns={k: v for k, v in EVENT_COLUMN_MAP.items() if k in df.columns})

        # Ensure required columns exist
        for col in ("CampaignId", "EventType"):
            if col not in df.columns:
                raise ValueError(f"Required column missing after mapping: {col}")

        # Parse datetime
        if "OccurredAt" in df.columns:
            df["OccurredAt"] = pd.to_datetime(df["OccurredAt"], utc=True, errors="coerce")
            df["OccurredAt"] = df["OccurredAt"].fillna(pd.Timestamp.utcnow())
        else:
            df["OccurredAt"] = pd.Timestamp.utcnow()

        # Coerce Revenue
        if "Revenue" in df.columns:
            df["Revenue"] = pd.to_numeric(df["Revenue"], errors="coerce")
        else:
            df["Revenue"] = None

        # Default Metadata
        if "Metadata" not in df.columns:
            df["Metadata"] = None

        # Default Source
        if "Source" not in df.columns:
            df["Source"] = None

        # Filter invalid event types
        original_count = len(df)
        df = df[df["EventType"].isin(VALID_EVENT_TYPES)]
        dropped = original_count - len(df)
        if dropped > 0:
            logger.warning("Dropped %d rows with invalid EventType", dropped)

        # Drop duplicates
        df = df.drop_duplicates(subset=["CampaignId", "EventType", "OccurredAt"])

        # Final column selection (match SQL table)
        cols = ["CampaignId", "EventType", "Source", "OccurredAt", "Metadata", "Revenue"]
        df = df[[c for c in cols if c in df.columns]]

        logger.info("EventTransformer: %d rows ready for load", len(df))
        return df.reset_index(drop=True)
