using UnityEngine;

/// <summary>
/// Default Terra districts. Keys match District.key / DistrictId
/// (dining, groceries, …), not the Prisma District.id UUID.
/// Positions follow wireframe A: Budget Hall at the origin, Other to the north.
/// SVG center is (600, 470); world X = (svgX - 600) / 40, world Z = (470 - svgY) / 40.
/// Accent hex values are the sRGB colors in the visual plan §3.1.
/// </summary>
public static class TerraDistrictCatalog
{
    public struct Seed
    {
        public string Key;
        public string Label;
        public float MonthlyBudget;
        public Vector3 Position;
        public uint AccentHex;
        public bool IsBudgetHall;

        public Color Accent => Srgb(AccentHex);
    }

    public const float DistrictFootprint = 1.65f;
    public const float DistrictPad = 3.05f;
    public const float DistrictPadThickness = 0.16f;
    public const float HallFootprint = 2.45f;
    public const float HallPad = 4.7f;
    public const float HallPadThickness = 0.18f;
    public const float HallHeight = 3.15f;

    public static readonly Seed BudgetHall = new Seed
    {
        Key = "",
        Label = "Budget Hall",
        MonthlyBudget = 0f,
        Position = Vector3.zero,
        AccentHex = 0xEE6C4D,
        IsBudgetHall = true,
    };

    public static readonly Seed[] Seeds =
    {
        new Seed { Key = "dining", Label = "Dining", MonthlyBudget = 250f, Position = new Vector3(-7f, 0f, 5.5f), AccentHex = 0xE76F51 },
        new Seed { Key = "groceries", Label = "Groceries", MonthlyBudget = 350f, Position = new Vector3(7f, 0f, 5.5f), AccentHex = 0x2A9D8F },
        new Seed { Key = "transport", Label = "Transport", MonthlyBudget = 120f, Position = new Vector3(-8.5f, 0f, -1f), AccentHex = 0x457B9D },
        new Seed { Key = "entertainment", Label = "Entertainment", MonthlyBudget = 100f, Position = new Vector3(8.5f, 0f, -1f), AccentHex = 0x9B5DE5 },
        new Seed { Key = "shopping", Label = "Shopping", MonthlyBudget = 150f, Position = new Vector3(-5f, 0f, -6.5f), AccentHex = 0xF4A261 },
        new Seed { Key = "subscriptions", Label = "Subscriptions", MonthlyBudget = 60f, Position = new Vector3(5f, 0f, -6.5f), AccentHex = 0x00BBF9 },
        new Seed { Key = "other", Label = "Other", MonthlyBudget = 100f, Position = new Vector3(0f, 0f, 7.5f), AccentHex = 0x8D99AE },
    };

    public static Color PathColor => Srgb(0xC2B280);
    public static Color GrassColor => Srgb(0x3A7D44);

    public static Color Srgb(uint rgb)
    {
        return new Color(
            ((rgb >> 16) & 255) / 255f,
            ((rgb >> 8) & 255) / 255f,
            (rgb & 255) / 255f,
            1f);
    }

    public static float HeightForBudget(float monthlyBudget)
    {
        float t = Mathf.InverseLerp(60f, 350f, monthlyBudget);
        return Mathf.Lerp(1.2f, 2.85f, Mathf.Clamp01(t));
    }
}
