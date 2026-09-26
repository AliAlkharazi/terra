using UnityEngine;

/// <summary>
/// One placeholder building. The key is the town id Unity sends back
/// on a tap: dining, property, groceries, transport, bills, or vault.
/// </summary>
public class DistrictPlaceholder : MonoBehaviour
{
    public string districtKey;
    public string districtLabel;

    Transform body;
    TextMesh labelMesh;

    public void Bind(string key, string label, Transform bodyTransform, TextMesh text)
    {
        districtKey = key;
        districtLabel = label;
        body = bodyTransform;
        labelMesh = text;
        SnapLabelToCamera();
    }

    public void ApplyPayload(string label, float monthlyBudget, float available, float allocated)
    {
        districtLabel = label;
        if (labelMesh != null) labelMesh.text = label;

        if (body == null) return;
        float basis = Mathf.Max(monthlyBudget, 40f);
        float shown = available < 0f ? basis * 0.4f : Mathf.Max(available, basis * 0.35f);
        float height = TerraDistrictCatalog.HeightForBudget(shown);
        var scale = body.localScale;
        body.localScale = new Vector3(scale.x, height, scale.z);
        body.localPosition = new Vector3(0f, height * 0.5f, 0f);
        if (labelMesh != null)
            labelMesh.transform.localPosition = new Vector3(0f, height + 0.45f, 0f);

        var renderer = body.GetComponent<Renderer>();
        if (renderer != null)
        {
            var unhealthy = new Color(0.72f, 0.28f, 0.24f);
            var healthy = new Color(0.42f, 0.66f, 0.34f);
            float fullness = allocated > 0f ? available / allocated : (available >= 0f ? 1f : 0f);
            renderer.material.color = Color.Lerp(unhealthy, healthy, Mathf.Clamp01(fullness));
        }
    }

    void LateUpdate()
    {
        SnapLabelToCamera();
    }

    public void SnapLabelToCamera()
    {
        if (labelMesh == null) return;
        var cam = Camera.main;
        if (cam == null) return;
        labelMesh.transform.rotation = cam.transform.rotation * Quaternion.Euler(0f, 180f, 0f);
    }
}
