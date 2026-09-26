using UnityEngine;
using UnityEngine.Rendering;

/// <summary>
/// Builds the Spike A + B town: ground, light, fixed ortho camera,
/// Budget Hall, seven district plots, and a path to each plot.
/// Used by the editor scene builder and by play mode if the scene
/// has not been saved yet.
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
        CreatePaths(root.transform);
        CreatePlot(root.transform, TerraDistrictCatalog.BudgetHall, TerraDistrictCatalog.HallHeight,
            TerraDistrictCatalog.HallFootprint, TerraDistrictCatalog.HallPad, TerraDistrictCatalog.HallPadThickness);

        foreach (var seed in TerraDistrictCatalog.Seeds)
        {
            CreatePlot(root.transform, seed, TerraDistrictCatalog.HeightForBudget(seed.MonthlyBudget),
                TerraDistrictCatalog.DistrictFootprint, TerraDistrictCatalog.DistrictPad, TerraDistrictCatalog.DistrictPadThickness);
        }

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
        RenderSettings.ambientMode = AmbientMode.Flat;
        RenderSettings.ambientLight = new Color(0.62f, 0.66f, 0.60f);
    }

    static void CreateGround(Transform parent)
    {
        var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.name = "Ground";
        ground.transform.SetParent(parent, false);
        ground.transform.localScale = new Vector3(14f, 1f, 14f);
        Paint(ground.GetComponent<Renderer>(), TerraDistrictCatalog.GrassColor);
    }

    static void CreateCamera(Transform parent)
    {
        var go = new GameObject("Camera");
        go.tag = "MainCamera";
        go.transform.SetParent(parent, false);
        var cam = go.AddComponent<Camera>();
        cam.orthographic = true;
        cam.clearFlags = CameraClearFlags.SolidColor;
        cam.backgroundColor = new Color(0.62f, 0.76f, 0.86f);
        cam.nearClipPlane = 0.3f;
        cam.farClipPlane = 250f;
        cam.depth = 10f;
        go.AddComponent<AudioListener>();
        var orbit = go.AddComponent<TerraOrbitCamera>();
        orbit.orthoSize = TerraOrbitCamera.DefaultOrtho;
        orbit.Snap();
        SilenceOtherCameras(cam);
    }

    static void SilenceOtherCameras(Camera keep)
    {
        var cameras = Object.FindObjectsByType<Camera>(FindObjectsInactive.Exclude, FindObjectsSortMode.None);
        foreach (var cam in cameras)
        {
            if (cam == keep) continue;
            if ((cam.gameObject.hideFlags & HideFlags.HideInHierarchy) != 0) continue;
            cam.gameObject.SetActive(false);
        }
    }

    static void CreatePaths(Transform parent)
    {
        var paths = new GameObject("Paths");
        paths.transform.SetParent(parent, false);
        float hallClear = TerraDistrictCatalog.HallPad * 0.5f + 0.25f;
        float plotClear = TerraDistrictCatalog.DistrictPad * 0.5f + 0.2f;
        var lineShader = FindPathShader();
        if (lineShader == null)
            Debug.LogWarning("[Terra] No unlit path shader. Paths are ground strips.");
        foreach (var seed in TerraDistrictCatalog.Seeds)
            CreatePath(paths.transform, TerraDistrictCatalog.BudgetHall.Position, seed.Position, hallClear, plotClear, seed.Key, lineShader);
    }

    static void CreatePath(Transform parent, Vector3 from, Vector3 to, float fromClear, float toClear, string key, Shader lineShader)
    {
        Vector3 delta = to - from;
        delta.y = 0f;
        float length = delta.magnitude;
        if (length <= fromClear + toClear + 0.3f) return;
        Vector3 dir = delta / length;
        Vector3 a = from + dir * fromClear;
        Vector3 b = to - dir * toClear;
        CreatePathDecal(parent, a, b, key);
        if (lineShader != null)
            CreatePathLine(parent, a, b, key, lineShader);
    }

    static void CreatePathLine(Transform parent, Vector3 a, Vector3 b, string key, Shader shader)
    {
        a.y = 0.16f;
        b.y = 0.16f;
        var go = new GameObject("PathLine_" + key);
        go.transform.SetParent(parent, false);
        go.transform.rotation = Quaternion.LookRotation(Vector3.up, Vector3.forward);
        var line = go.AddComponent<LineRenderer>();
        line.useWorldSpace = true;
        line.positionCount = 2;
        line.SetPosition(0, a);
        line.SetPosition(1, b);
        line.startWidth = 0.72f;
        line.endWidth = 0.72f;
        line.numCapVertices = 4;
        line.alignment = LineAlignment.Local;
        line.shadowCastingMode = ShadowCastingMode.Off;
        line.receiveShadows = false;
        line.textureMode = LineTextureMode.Stretch;

        var color = TerraDistrictCatalog.PathColor;
        line.startColor = color;
        line.endColor = color;
        if (shader == null) return;
        var mat = new Material(shader);
        if (mat.HasProperty("_Color")) mat.color = color;
        if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", color);
        if (mat.HasProperty("_MainTex") && mat.mainTexture == null)
            mat.mainTexture = Texture2D.whiteTexture;
        line.sharedMaterial = mat;
    }

    static void CreatePathDecal(Transform parent, Vector3 a, Vector3 b, string key)
    {
        Vector3 delta = b - a;
        float length = delta.magnitude;
        if (length < 0.05f) return;
        a.y = 0.05f;
        b.y = 0.05f;
        var go = GameObject.CreatePrimitive(PrimitiveType.Cube);
        go.name = "Path_" + key;
        go.transform.SetParent(parent, false);
        go.transform.localPosition = (a + b) * 0.5f;
        go.transform.localRotation = Quaternion.LookRotation(delta.normalized, Vector3.up);
        go.transform.localScale = new Vector3(1.15f, 0.08f, length);
        Paint(go.GetComponent<Renderer>(), TerraDistrictCatalog.PathColor);
        var collider = go.GetComponent<Collider>();
        if (collider == null) return;
        if (Application.isPlaying) Object.Destroy(collider);
        else Object.DestroyImmediate(collider);
    }

    static Shader FindPathShader()
    {
        string[] names =
        {
            "Unlit/Color",
            "Universal Render Pipeline/Unlit",
            "Sprites/Default",
            "UI/Default",
            "Hidden/Internal-Colored",
        };
        foreach (var name in names)
        {
            var shader = Shader.Find(name);
            if (shader != null) return shader;
        }
        return null;
    }

    static void CreatePlot(Transform parent, TerraDistrictCatalog.Seed seed, float height, float footprint, float padSize, float padThickness)
    {
        var go = new GameObject(seed.Label);
        go.transform.SetParent(parent, false);
        go.transform.position = seed.Position;

        var placeholder = go.AddComponent<DistrictPlaceholder>();
        var accent = seed.Accent;

        var pad = GameObject.CreatePrimitive(PrimitiveType.Cube);
        pad.name = "Pad";
        pad.transform.SetParent(go.transform, false);
        pad.transform.localScale = new Vector3(padSize, padThickness, padSize);
        pad.transform.localPosition = new Vector3(0f, padThickness * 0.5f, 0f);
        Paint(pad.GetComponent<Renderer>(), Darken(accent, 0.78f));

        var body = GameObject.CreatePrimitive(PrimitiveType.Cube);
        body.name = "Body";
        body.transform.SetParent(go.transform, false);
        body.transform.localScale = new Vector3(footprint, height, footprint);
        body.transform.localPosition = new Vector3(0f, padThickness + height * 0.5f, 0f);
        Paint(body.GetComponent<Renderer>(), accent);

        float labelY = padThickness + height + 0.45f;
        if (seed.IsBudgetHall)
            labelY = AddCupola(go.transform, footprint, padThickness, height) + 0.4f;

        var labelGo = new GameObject("Label");
        labelGo.transform.SetParent(go.transform, false);
        labelGo.transform.localPosition = new Vector3(0f, labelY, 0f);
        var text = labelGo.AddComponent<TextMesh>();
        text.text = seed.Label;
        text.anchor = TextAnchor.LowerCenter;
        text.alignment = TextAlignment.Center;
        text.characterSize = 0.42f;
        text.fontSize = 64;
        text.color = new Color(0.97f, 0.96f, 0.93f);
        var font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        if (font == null) font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        if (font != null) text.font = font;

        placeholder.Bind(seed.Key, seed.Label, body.transform, text, seed.IsBudgetHall, padThickness);
    }

    static float AddCupola(Transform parent, float footprint, float padThickness, float height)
    {
        const float roofHeight = 0.85f;
        var roof = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        roof.name = "Cupola";
        roof.transform.SetParent(parent, false);
        roof.transform.localScale = new Vector3(footprint * 0.82f, roofHeight * 0.5f, footprint * 0.82f);
        roof.transform.localPosition = new Vector3(0f, padThickness + height + roofHeight * 0.5f, 0f);
        Paint(roof.GetComponent<Renderer>(), TerraDistrictCatalog.Srgb(0xF6E2B8));
        return padThickness + height + roofHeight;
    }

    static void Paint(Renderer renderer, Color color)
    {
        if (renderer == null) return;
        var source = renderer.sharedMaterial;
        var shader = source != null ? source.shader : Shader.Find("Standard");
        if (shader == null) return;
        var mat = new Material(shader);
        if (mat.HasProperty("_Color")) mat.color = color;
        if (mat.HasProperty("_BaseColor")) mat.SetColor("_BaseColor", color);
        renderer.sharedMaterial = mat;
    }

    static Color Darken(Color color, float factor)
    {
        return new Color(color.r * factor, color.g * factor, color.b * factor, 1f);
    }
}
