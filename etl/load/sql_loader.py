import logging
from typing import Literal

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from config import config

logger = logging.getLogger(__name__)

TableName = Literal["CampaignEvents", "LoyaltyTransactions"]


class SqlLoader:
    """
    Bulk-inserts transformed DataFrames into SQL Server.

    Uses SQLAlchemy + pyodbc with multi-row inserts for performance.
    All inserts are idempotent via append (primary key is DB-generated IDENTITY).
    """

    def __init__(self):
        self._engine = create_engine(
            config.sql_connection_string,
            fast_executemany=True,
        )

    def load(self, df: pd.DataFrame, table: TableName, schema: str = "dbo") -> int:
        """
        Append DataFrame rows to the target table.
        Returns number of rows inserted.
        Raises on SQL error.
        """
        if df.empty:
            logger.info("SqlLoader: empty DataFrame, skipping load to %s", table)
            return 0

        rows_inserted = 0
        for chunk_start in range(0, len(df), config.BATCH_SIZE):
            chunk = df.iloc[chunk_start : chunk_start + config.BATCH_SIZE]
            try:
                chunk.to_sql(
                    name=table,
                    con=self._engine,
                    schema=schema,
                    if_exists="append",
                    index=False,
                    method="multi",
                )
                rows_inserted += len(chunk)
                logger.info(
                    "SqlLoader: inserted batch %d rows into %s.%s (total so far: %d)",
                    len(chunk), schema, table, rows_inserted
                )
            except SQLAlchemyError as e:
                logger.error("SqlLoader: batch insert failed for %s: %s", table, e)
                raise

        logger.info("SqlLoader: completed — %d total rows loaded into %s", rows_inserted, table)
        return rows_inserted

    def verify_load(self, table: TableName, expected_min_rows: int) -> bool:
        """Quick sanity check — returns True if table has at least expected_min_rows."""
        try:
            with self._engine.connect() as conn:
                result = conn.execute(text(f"SELECT COUNT(1) FROM dbo.[{table}]"))
                count = result.scalar()
            logger.info("SqlLoader.verify_load: %s has %d rows", table, count)
            return count >= expected_min_rows
        except SQLAlchemyError as e:
            logger.error("SqlLoader.verify_load failed: %s", e)
            return False
