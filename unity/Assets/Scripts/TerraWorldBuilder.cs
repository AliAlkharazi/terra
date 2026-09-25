using UnityEngine;

/// <summary>
/// Builds the placeholder town: ground, light, isometric camera,
/// one block per default district. Used by the editor scene builder
/// and by play mode if the scene has not been saved yet.
/// </summary>
public static class TerraWorldBuilder
{
    public const string RootName = "TerraWorld";

    public static GameObject Build()
    {
        var root = new GameObject(RootName);
        root.AddComponent<TerraBridge>();

        CreateLight(root.transform);
        CreateGround(root.transform);
        CreateCamera(root.transform);

        foreach (var seed in TerraDistrictCatalog.Seeds)
            CreateDistrict(root.transform, seed);

        return root;
    }

    static void CreateLight(Transform parent)
    {
        var go = new GameObject("Sun");
        go.transform.SetParent(parent, false);
        go.transform.rotation = Quaternion.Euler(48f, -35f, 0f);
        var light = go.AddComponent<Light>();
        light.type = LightType.Directional;
        light.intensity = 1.15f;
        light.color = new Color(1f, 0.96f, 0.88f);
        light.shadows = LightShadows.Soft;
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
        RenderSettings.ambientLight = new Color(0.55f, 0.58f, 0.52f);
    }

    static void CreateGround(Transform parent)
    {
        var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Ground";
        ground.transform.SetParent(parent, false);
        ground.transform.localScale = new Vector3(4.5f, 1f, 4.5f);
        ground.GetComponent<Renderer>().material.color = new Color(0.24f, 0.40f, 0.22f);
    }

    static void CreateCamera(Transform parent)
    {
        var go = new GameObject("World Camera");
        go.tag = "MainCamera";
        go.transform.SetParent(parent, false);
        var cam = go.AddComponent<Camera>();
        cam.orthographic = true;
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.55f, 0.72f, 0.86f);
        cam.nearClipPlane = 0.3f;
        cam.farClipPlane = 200f;
        go.AddComponent<AudioListener>();
        var orbit = go.AddComponent<TerraOrbitCamera>();
        orbit.Snap();
    }

    static void CreateDistrict(Transform parent, TerraDistrictCatalog.Seed seed)
    {
        var go = new GameObject("District_" + seed.Key);
        go.transform.SetParent(parent, false);
        go.transform.position = seed.Position;

        var placeholder = go.AddComponent<DistrictPlaceholder>();

        var body = GameObject.CreatePrimitive(PrimitiveType.Cube);
        body.name = "Body";
        body.transform.SetParent(go.transform, false);
        float height = TerraDistrictCatalog.HeightForBudget(seed.MonthlyBudget);
        body.transform.localScale = new Vector3(1.7f, height, 1.7f);
        body.transform.localPosition = new Vector3(0f, height * 0.5f, 0f);
        body.GetComponent<Renderer>().material.color = seed.Color;

        var labelGo = new GameObject("Label");
        labelGo.transform.SetParent(go.transform, false);
        labelGo.transform.localPosition = new Vector3(0f, height + 0.45f, 0f);
        var text = labelGo.AddComponent<TextMesh>();
        text.text = seed.Label;
        text.anchor = TextAnchor.LowerCenter;
        text.alignment = TextAlignment.Center;
        text.characterSize = 0.11f;
        text.fontSize = 64;
        text.color = new Color(0.96f, 0.94f, 0.86f);
        var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        if (font == null) font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        if (font != null) text.font = font;

        placeholder.Bind(seed.Key, seed.Label, body.transform, text);
    }
}
