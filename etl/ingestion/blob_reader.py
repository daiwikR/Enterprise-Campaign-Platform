import io
import logging
from typing import Iterator

import pandas as pd
from azure.storage.blob import BlobServiceClient, ContainerClient
from azure.core.exceptions import AzureError

from config import config

logger = logging.getLogger(__name__)


class BlobReader:
    """Reads CSV/JSON blobs from Azure Blob Storage for processing."""

    def __init__(self, container: str = config.AZURE_BLOB_CONTAINER_RAW):
        self._client = BlobServiceClient.from_connection_string(
            config.AZURE_CONNECTION_STRING
        )
        self._container: ContainerClient = self._client.get_container_client(container)

    def list_blobs(self, prefix: str = "") -> list[str]:
        """Return a sorted list of blob names matching the given prefix."""
        blobs = [b.name for b in self._container.list_blobs(name_starts_with=prefix)]
        return sorted(blobs)

    def read_csv(self, blob_name: str, **kwargs) -> pd.DataFrame:
        """Download a CSV blob and return as a DataFrame."""
        return self._read_blob(blob_name, format="csv", **kwargs)

    def read_json(self, blob_name: str, **kwargs) -> pd.DataFrame:
        """Download a JSON blob and return as a DataFrame."""
        return self._read_blob(blob_name, format="json", **kwargs)

    def _read_blob(self, blob_name: str, format: str, **kwargs) -> pd.DataFrame:
        try:
            blob_client = self._container.get_blob_client(blob_name)
            data = blob_client.download_blob().readall()
            buf = io.BytesIO(data)
            if format == "csv":
                return pd.read_csv(buf, **kwargs)
            elif format == "json":
                return pd.read_json(buf, **kwargs)
            else:
                raise ValueError(f"Unsupported format: {format}")
        except AzureError as e:
            logger.error("Failed to read blob %s: %s", blob_name, e)
            raise

    def iter_dataframes(
        self, prefix: str = "", format: str = "csv", **kwargs
    ) -> Iterator[tuple[str, pd.DataFrame]]:
        """Yield (blob_name, DataFrame) tuples for all matching blobs."""
        for blob_name in self.list_blobs(prefix=prefix):
            if blob_name.endswith(f".{format}"):
                df = self._read_blob(blob_name, format=format, **kwargs)
                yield blob_name, df
