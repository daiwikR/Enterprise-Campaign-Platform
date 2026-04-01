#!/usr/bin/env python3
"""
Campaign Analytics ETL Pipeline
================================
Entry point for the full ETL run:
  1. Upload raw files to Azure Blob (Bronze)
  2. Read blobs back
  3. Transform (validate, clean, conform)
  4. Load into SQL Server
"""

import argparse
import logging
import sys
from pathlib import Path

from ingestion.blob_uploader import BlobUploader
from ingestion.blob_reader import BlobReader
from transform.event_transformer import EventTransformer
from transform.loyalty_transformer import LoyaltyTransformer
from load.sql_loader import SqlLoader

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("pipeline")


def run_pipeline(
    source_dir: str,
    skip_upload: bool = False,
    dry_run: bool = False,
) -> dict:
    """
    Execute the full ETL pipeline.

    Args:
        source_dir: Local directory containing CSV/JSON source files.
        skip_upload: If True, skip the upload step and process existing blobs.
        dry_run: If True, transform but do not write to SQL Server.

    Returns:
        dict with keys: events_loaded, loyalty_loaded
    """
    stats = {"events_loaded": 0, "loyalty_loaded": 0}

    uploader = BlobUploader()
    reader = BlobReader()
    event_tx = EventTransformer()
    loyalty_tx = LoyaltyTransformer()
    loader = SqlLoader()

    # ── Step 1: Upload raw files ──────────────────────────────────────────────
    if not skip_upload:
        logger.info("Step 1: Uploading source files from %s", source_dir)
        uploaded = uploader.upload_directory(source_dir, blob_prefix="raw")
        logger.info("Uploaded %d files", len(uploaded))
    else:
        logger.info("Step 1: Skipping upload (skip_upload=True)")

    # ── Step 2 + 3: Read, transform, and load CampaignEvents ─────────────────
    logger.info("Step 2-3: Processing campaign event files")
    for blob_name, raw_df in reader.iter_dataframes(prefix="raw", format="csv"):
        if "event" not in blob_name.lower():
            continue
        logger.info("Processing events blob: %s (%d rows)", blob_name, len(raw_df))
        clean_df = event_tx.transform(raw_df)
        if not dry_run:
            n = loader.load(clean_df, table="CampaignEvents")
            stats["events_loaded"] += n

    # ── Step 4: Read, transform, and load LoyaltyTransactions ─────────────────
    logger.info("Step 4: Processing loyalty transaction files")
    for blob_name, raw_df in reader.iter_dataframes(prefix="raw", format="csv"):
        if "loyalty" not in blob_name.lower():
            continue
        logger.info("Processing loyalty blob: %s (%d rows)", blob_name, len(raw_df))
        clean_df = loyalty_tx.transform(raw_df)
        if not dry_run:
            n = loader.load(clean_df, table="LoyaltyTransactions")
            stats["loyalty_loaded"] += n

    logger.info("Pipeline complete. Stats: %s", stats)
    return stats


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Campaign Analytics ETL Pipeline")
    parser.add_argument("--source-dir", required=True, help="Directory with CSV/JSON source files")
    parser.add_argument("--skip-upload", action="store_true", help="Skip Azure Blob upload step")
    parser.add_argument("--dry-run", action="store_true", help="Transform only, do not load to SQL")
    args = parser.parse_args()

    result = run_pipeline(
        source_dir=args.source_dir,
        skip_upload=args.skip_upload,
        dry_run=args.dry_run,
    )
    sys.exit(0 if result else 1)
