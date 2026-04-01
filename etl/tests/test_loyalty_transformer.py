import pandas as pd
import pytest
from transform.loyalty_transformer import LoyaltyTransformer


@pytest.fixture
def transformer():
    return LoyaltyTransformer()


def make_loyalty_df(**overrides):
    data = {
        "program_id": [1, 1, 2],
        "campaign_id": [10, 11, 10],
        "user_id": ["u1", "u2", "u3"],
        "points_earned": [100, 200, 150],
        "points_redeemed": [0, 50, 0],
        "transaction_type": ["Earn", "Redeem", "Earn"],
        "transaction_date": ["2024-01-15", "2024-01-16", "2024-01-17"],
    }
    data.update(overrides)
    return pd.DataFrame(data)


def test_transform_renames_columns(transformer):
    df = make_loyalty_df()
    result = transformer.transform(df)
    assert "ProgramId" in result.columns
    assert "UserId" in result.columns
    assert "PointsEarned" in result.columns


def test_transform_filters_invalid_transaction_types(transformer):
    df = make_loyalty_df(transaction_type=["Earn", "BOGUS", "Redeem"])
    result = transformer.transform(df)
    assert len(result) == 2


def test_transform_coerces_points_to_int(transformer):
    df = make_loyalty_df(points_earned=["100", "bad", "200"])
    result = transformer.transform(df)
    assert result["PointsEarned"].dtype == int


def test_transform_drops_negative_points(transformer):
    df = make_loyalty_df(points_earned=[-10, 100, 50])
    result = transformer.transform(df)
    assert all(result["PointsEarned"] >= 0)


def test_transform_empty_dataframe(transformer):
    result = transformer.transform(pd.DataFrame())
    assert result.empty
