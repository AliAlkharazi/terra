using UnityEngine;

/// <summary>
/// One plot. Districts log their category key on tap (dining, groceries, …).
/// Budget Hall is focusable and has no category key.
/// </summary>
public class DistrictPlaceholder : MonoBehaviour
{
    public string districtKey;
    public string districtLabel;
    public bool LogsCategory => !isBudgetHall && !string.IsNullOrEmpty(districtKey);

    [SerializeField] bool isBudgetHall;
    [SerializeField] Transform body;
    [SerializeField] TextMesh labelMesh;
    [SerializeField] float padTop;

    public bool IsBudgetHall => isBudgetHall;
    public Vector3 FocusPoint => transform.position;

    void Awake()
    {
        if (body == null)
        {
            var found = transform.Find("Body");
            if (found != null) body = found;
        }

        if (labelMesh == null)
        {
            var found = transform.Find("Label");
            if (found != null) labelMesh = found.GetComponent<TextMesh>();
        }

        if (!isBudgetHall && string.IsNullOrEmpty(districtKey) && gameObject.name == "BudgetHall")
            isBudgetHall = true;

        if (padTop <= 0f)
            padTop = isBudgetHall ? TerraDistrictCatalog.HallPadThickness : TerraDistrictCatalog.DistrictPadThickness;
    }

    public void Bind(string key, string label, Transform bodyTransform, TextMesh text, bool budgetHall, float padThickness)
    {
        districtKey = key;
        districtLabel = label;
        isBudgetHall = budgetHall;
        body = bodyTransform;
        labelMesh = text;
        padTop = padThickness;
        SnapLabelToCamera();
    }

    public void ApplyPayload(string label, float monthlyBudget, float healthPct)
    {
        if (isBudgetHall) return;
        districtLabel = label;
        if (labelMesh != null) labelMesh.text = label;
        if (body == null) return;

        float height = TerraDistrictCatalog.HeightForBudget(monthlyBudget);
        var scale = body.localScale;
        body.localScale = new Vector3(scale.x, height, scale.z);
        body.localPosition = new Vector3(0f, padTop + height * 0.5f, 0f);
        if (labelMesh != null)
            labelMesh.transform.localPosition = new Vector3(0f, padTop + height + 0.4f, 0f);

        var renderer = body.GetComponent<Renderer>();
        if (renderer == null) return;
        var unhealthy = new Color(0.72f, 0.28f, 0.24f);
        var healthy = new Color(0.42f, 0.66f, 0.34f);
        renderer.material.color = Color.Lerp(unhealthy, healthy, Mathf.Clamp01(healthPct / 100f));
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
