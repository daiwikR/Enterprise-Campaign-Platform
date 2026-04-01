import pandas as pd
import pytest
from transform.event_transformer import EventTransformer


@pytest.fixture
def transformer():
    return EventTransformer()


def make_events_df(**overrides):
    data = {
        "campaign_id": [1, 2, 3],
        "event_type": ["Impression", "Click", "Conversion"],
        "source": ["email", "social", "organic"],
        "occurred_at": ["2024-01-15T10:00:00Z", "2024-01-15T11:00:00Z", "2024-01-15T12:00:00Z"],
        "revenue": [0.0, 0.0, 49.99],
    }
    data.update(overrides)
    return pd.DataFrame(data)


def test_transform_renames_columns(transformer):
    df = make_events_df()
    result = transformer.transform(df)
    assert "CampaignId" in result.columns
    assert "EventType" in result.columns
    assert "OccurredAt" in result.columns


def test_transform_filters_invalid_event_types(transformer):
    df = make_events_df(event_type=["Impression", "INVALID_TYPE", "Click"])
    result = transformer.transform(df)
    assert len(result) == 2
    assert "INVALID_TYPE" not in result["EventType"].values


def test_transform_coerces_revenue_to_numeric(transformer):
    df = make_events_df(revenue=[None, "bad_value", "19.99"])
    result = transformer.transform(df)
    assert result["Revenue"].dtype in [float, "float64"]


def test_transform_drops_duplicates(transformer):
    df = pd.DataFrame({
        "campaign_id": [1, 1],
        "event_type": ["Click", "Click"],
        "occurred_at": ["2024-01-15T10:00:00Z", "2024-01-15T10:00:00Z"],
    })
    result = transformer.transform(df)
    assert len(result) == 1


def test_transform_raises_on_missing_required_column(transformer):
    df = pd.DataFrame({"source": ["email"]})
    with pytest.raises(ValueError, match="CampaignId"):
        transformer.transform(df)


def test_transform_empty_dataframe(transformer):
    result = transformer.transform(pd.DataFrame())
    assert result.empty
