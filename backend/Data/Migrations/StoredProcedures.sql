-- =============================================
-- Stored Procedure: GetCampaignSummaryReport
-- =============================================
IF OBJECT_ID('dbo.GetCampaignSummaryReport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.GetCampaignSummaryReport;
GO

CREATE PROCEDURE dbo.GetCampaignSummaryReport
    @CampaignId INT = NULL,
    @StartDate  DATETIME2 = NULL,
    @EndDate    DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.CampaignId,
        c.Name                                                          AS CampaignName,
        COUNT(CASE WHEN ce.EventType = 'Impression'  THEN 1 END)        AS TotalImpressions,
        COUNT(CASE WHEN ce.EventType = 'Click'       THEN 1 END)        AS TotalClicks,
        COUNT(CASE WHEN ce.EventType = 'Conversion'  THEN 1 END)        AS TotalConversions,
        ISNULL(SUM(ce.Revenue), 0)                                      AS TotalRevenue,
        c.SpentAmount,
        CASE WHEN c.SpentAmount = 0 THEN 0
             ELSE ROUND((ISNULL(SUM(ce.Revenue), 0) - c.SpentAmount) / c.SpentAmount * 100, 2)
        END                                                             AS ROI
    FROM   dbo.Campaigns      c
    LEFT JOIN dbo.CampaignEvents ce
           ON ce.CampaignId = c.CampaignId
          AND (@StartDate IS NULL OR ce.OccurredAt >= @StartDate)
          AND (@EndDate   IS NULL OR ce.OccurredAt <= @EndDate)
    WHERE  (@CampaignId IS NULL OR c.CampaignId = @CampaignId)
    GROUP BY c.CampaignId, c.Name, c.SpentAmount;
END
GO

-- =============================================
-- Stored Procedure: GetLoyaltyEngagementReport
-- =============================================
IF OBJECT_ID('dbo.GetLoyaltyEngagementReport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.GetLoyaltyEngagementReport;
GO

CREATE PROCEDURE dbo.GetLoyaltyEngagementReport
    @ProgramId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        lp.ProgramId,
        lp.Name                                         AS ProgramName,
        COUNT(DISTINCT lt.UserId)                       AS TotalMembers,
        ISNULL(SUM(lt.PointsEarned),    0)              AS TotalPointsEarned,
        ISNULL(SUM(lt.PointsRedeemed),  0)              AS TotalPointsRedeemed,
        CASE WHEN SUM(lt.PointsEarned) = 0 THEN 0
             ELSE ROUND(CAST(SUM(lt.PointsRedeemed) AS DECIMAL(18,4))
                      / CAST(SUM(lt.PointsEarned)   AS DECIMAL(18,4)) * 100, 2)
        END                                             AS RedemptionRate
    FROM  dbo.LoyaltyPrograms    lp
    LEFT JOIN dbo.LoyaltyTransactions lt
           ON lt.ProgramId = lp.ProgramId
    WHERE (@ProgramId IS NULL OR lp.ProgramId = @ProgramId)
    GROUP BY lp.ProgramId, lp.Name;
END
GO
