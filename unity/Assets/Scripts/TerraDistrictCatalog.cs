using UnityEngine;

/// <summary>
/// Default Terra districts. Keys and budgets match DEFAULT_DISTRICTS
/// in mobile/src/store/budgetStore.ts. Positions are placeholder pads.
/// </summary>
public static class TerraDistrictCatalog
{
    public struct Seed
    {
        public string Key;
        public string Label;
        public float MonthlyBudget;
        public Vector3 Position;
        public Color Color;
    }

    public static readonly Seed[] Seeds =
    {
        new Seed { Key = "dining", Label = "Dining", MonthlyBudget = 250f, Position = new Vector3(-6f, 0f, 3f), Color = new Color(0.86f, 0.42f, 0.28f) },
        new Seed { Key = "groceries", Label = "Groceries", MonthlyBudget = 350f, Position = new Vector3(-2.2f, 0f, 6f), Color = new Color(0.35f, 0.62f, 0.32f) },
        new Seed { Key = "transport", Label = "Transport", MonthlyBudget = 120f, Position = new Vector3(3.2f, 0f, 5.2f), Color = new Color(0.28f, 0.48f, 0.72f) },
        new Seed { Key = "entertainment", Label = "Entertainment", MonthlyBudget = 100f, Position = new Vector3(6.2f, 0f, 0.5f), Color = new Color(0.55f, 0.36f, 0.68f) },
        new Seed { Key = "shopping", Label = "Shopping", MonthlyBudget = 150f, Position = new Vector3(3.4f, 0f, -4.2f), Color = new Color(0.83f, 0.66f, 0.28f) },
        new Seed { Key = "subscriptions", Label = "Subscriptions", MonthlyBudget = 60f, Position = new Vector3(-1.2f, 0f, -5.4f), Color = new Color(0.25f, 0.58f, 0.58f) },
        new Seed { Key = "other", Label = "Other", MonthlyBudget = 100f, Position = new Vector3(-5.4f, 0f, -2.2f), Color = new Color(0.55f, 0.42f, 0.28f) },
    };

    public static float HeightForBudget(float monthlyBudget)
    {
        float t = Mathf.InverseLerp(60f, 350f, monthlyBudget);
        return Mathf.Lerp(1.15f, 3.1f, Mathf.Clamp01(t));
    }
}
