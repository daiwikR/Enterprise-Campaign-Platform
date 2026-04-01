import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Azure Blob Storage
    AZURE_CONNECTION_STRING: str = os.getenv("AZURE_CONNECTION_STRING", "")
    AZURE_BLOB_CONTAINER_RAW: str = os.getenv("AZURE_BLOB_CONTAINER_RAW", "campaign-raw")
    AZURE_BLOB_CONTAINER_PROCESSED: str = os.getenv("AZURE_BLOB_CONTAINER_PROCESSED", "campaign-processed")

    # SQL Server
    SQL_SERVER: str = os.getenv("SQL_SERVER", "localhost")
    SQL_DATABASE: str = os.getenv("SQL_DATABASE", "CampaignAnalyticsDb")
    SQL_USERNAME: str = os.getenv("SQL_USERNAME", "")
    SQL_PASSWORD: str = os.getenv("SQL_PASSWORD", "")
    SQL_DRIVER: str = os.getenv("SQL_DRIVER", "ODBC Driver 18 for SQL Server")

    # ETL
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "1000"))
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))

    @property
    def sql_connection_string(self) -> str:
        if self.SQL_USERNAME and self.SQL_PASSWORD:
            return (
                f"mssql+pyodbc://{self.SQL_USERNAME}:{self.SQL_PASSWORD}"
                f"@{self.SQL_SERVER}/{self.SQL_DATABASE}"
                f"?driver={self.SQL_DRIVER.replace(' ', '+')}&TrustServerCertificate=yes"
            )
        return (
            f"mssql+pyodbc://{self.SQL_SERVER}/{self.SQL_DATABASE}"
            f"?driver={self.SQL_DRIVER.replace(' ', '+')}"
            f"&Trusted_Connection=yes&TrustServerCertificate=yes"
        )


config = Config()
