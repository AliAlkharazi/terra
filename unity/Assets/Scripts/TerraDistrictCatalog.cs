using UnityEngine;

/// <summary>
/// Pads for the village town. Keys and budgets match DEFAULT_DISTRICTS
/// in mobile/src/store/budgetStore.ts. Vault is the center pocket, not a district row.
/// Layout matches the town: Diner and Home behind, Food / Travel / Bills in front.
/// </summary>
public static class TerraDistrictCatalog
{
    public struct Seed
    {
        public string Key;
        public string Label;
        public float MonthlyBudget;
        public float Footprint;
        public Vector3 Position;
        public Color Color;
    }

    public static readonly Seed[] Seeds =
    {
        new Seed { Key = "dining", Label = "Diner", MonthlyBudget = 250f, Footprint = 1.7f, Position = new Vector3(-5.4f, 0f, 3.2f), Color = new Color(0.86f, 0.42f, 0.28f) },
        new Seed { Key = "property", Label = "Home", MonthlyBudget = 200f, Footprint = 1.7f, Position = new Vector3(5.4f, 0f, 3.2f), Color = new Color(0.75f, 0.78f, 0.84f) },
        new Seed { Key = "vault", Label = "Main Vault", MonthlyBudget = 800f, Footprint = 2.3f, Position = Vector3.zero, Color = new Color(0.83f, 0.66f, 0.28f) },
        new Seed { Key = "groceries", Label = "Food", MonthlyBudget = 350f, Footprint = 1.7f, Position = new Vector3(-5.2f, 0f, -3.6f), Color = new Color(0.35f, 0.62f, 0.32f) },
        new Seed { Key = "transport", Label = "Travel", MonthlyBudget = 120f, Footprint = 1.7f, Position = new Vector3(0f, 0f, -5.8f), Color = new Color(0.28f, 0.48f, 0.72f) },
        new Seed { Key = "bills", Label = "Bills", MonthlyBudget = 80f, Footprint = 1.7f, Position = new Vector3(5.2f, 0f, -3.6f), Color = new Color(0.55f, 0.36f, 0.68f) },
    };

    public static float HeightForBudget(float amount)
    {
        float t = Mathf.InverseLerp(60f, 800f, amount);
        return Mathf.Lerp(1.15f, 3.4f, Mathf.Clamp01(t));
    }
}
