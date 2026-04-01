import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from azure.storage.blob import BlobServiceClient, BlobClient
from azure.core.exceptions import AzureError

from config import config

logger = logging.getLogger(__name__)


class BlobUploader:
    """Uploads raw CSV/JSON files to Azure Blob Storage (Bronze layer)."""

    def __init__(self):
        self._client = BlobServiceClient.from_connection_string(
            config.AZURE_CONNECTION_STRING
        )
        self._container = config.AZURE_BLOB_CONTAINER_RAW

    def upload_file(
        self,
        local_path: str,
        blob_prefix: str = "",
        overwrite: bool = False,
    ) -> str:
        """
        Upload a single file to Azure Blob Storage.

        Returns the blob name on success.
        Raises AzureError on failure.
        """
        path = Path(local_path)
        if not path.exists():
            raise FileNotFoundError(f"Source file not found: {local_path}")

        timestamp = datetime.utcnow().strftime("%Y/%m/%d")
        blob_name = f"{blob_prefix}/{timestamp}/{path.name}" if blob_prefix else f"{timestamp}/{path.name}"

        blob_client: BlobClient = self._client.get_blob_client(
            container=self._container, blob=blob_name
        )

        try:
            with open(local_path, "rb") as data:
                blob_client.upload_blob(data, overwrite=overwrite)
            logger.info("Uploaded %s → blob://%s/%s", local_path, self._container, blob_name)
            return blob_name
        except AzureError as e:
            logger.error("Failed to upload %s: %s", local_path, e)
            raise

    def upload_directory(
        self,
        local_dir: str,
        blob_prefix: str = "",
        extensions: Optional[list[str]] = None,
    ) -> list[str]:
        """
        Upload all files in a directory matching given extensions.
        Returns list of uploaded blob names.
        """
        extensions = extensions or [".csv", ".json"]
        uploaded: list[str] = []

        for root, _, files in os.walk(local_dir):
            for filename in files:
                if any(filename.endswith(ext) for ext in extensions):
                    full_path = os.path.join(root, filename)
                    blob_name = self.upload_file(full_path, blob_prefix, overwrite=True)
                    uploaded.append(blob_name)

        logger.info("Uploaded %d files from %s", len(uploaded), local_dir)
        return uploaded
