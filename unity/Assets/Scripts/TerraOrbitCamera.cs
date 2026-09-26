using System.Globalization;
using UnityEngine;

/// <summary>
/// Orthographic town camera for Spike A.
/// Pitch is 47.5° down from horizontal and yaw is fixed.
/// Drag pans, scroll or pinch zooms inside the neighborhood-to-overview clamp,
/// and a double-tap eases in on a plot (closer than the pinch floor).
/// </summary>
public class TerraOrbitCamera : MonoBehaviour
{
    public const float PitchDegrees = 47.5f;
    public const float YawDegrees = 45f;
    public const float FocusOrtho = 3.4f;
    public const float NeighborhoodOrtho = 6f;
    public const float OverviewOrtho = 21f;
    public const float DefaultOrtho = 21f;

    public float distance = 42f;
    public float orthoSize = DefaultOrtho;
    public Vector3 target = Vector3.zero;

    const float DragThreshold = 8f;
    const float DoubleTapSeconds = 0.4f;
    const float DoubleTapSlop = 48f;
    const float FocusSeconds = 0.7f;
    const float PanLimitFocused = 12f;
    const float PanLimitOverview = 6f;

    TerraBridge bridge;
    float dragPixels;
    bool pointerDown;
    Vector3 lastPointer;
    Vector2 lastTapScreen;
    float lastTapTime = -1f;
    float suppressTapUntil;

    bool focusing;
    float focusElapsed;
    Vector3 focusFromTarget;
    Vector3 focusToTarget;
    float focusFromSize;

    void Awake()
    {
        bridge = GetComponentInParent<TerraBridge>();
        if (bridge == null) bridge = FindFirstObjectByType<TerraBridge>();
        orthoSize = Mathf.Clamp(orthoSize, NeighborhoodOrtho, OverviewOrtho);
        if (distance < 24f) distance = 42f;
        Snap();
    }

    void Start()
    {
        Snap();
        LogPose();
    }

    void Update()
    {
        if (Input.GetKeyDown(KeyCode.F))
            FocusUnderCursor();

        if (Input.touchCount >= 2)
        {
            PinchZoom();
            suppressTapUntil = Time.unscaledTime + 0.25f;
            return;
        }

        if (Input.touchCount == 0)
            HandleScroll();

        if (Input.touchCount == 1)
            HandleTouch(Input.GetTouch(0));
        else if (Input.touchCount == 0)
            HandleMouse();
    }

    void LateUpdate()
    {
        if (focusing)
        {
            focusElapsed += Time.unscaledDeltaTime;
            float t = Mathf.Clamp01(focusElapsed / FocusSeconds);
            float s = t * t * (3f - 2f * t);
            target = Vector3.Lerp(focusFromTarget, focusToTarget, s);
            orthoSize = Mathf.Lerp(focusFromSize, FocusOrtho, s);
            if (t >= 1f) focusing = false;
        }

        ClampTarget();
        Snap();
    }

    public void Snap()
    {
        var rot = Quaternion.Euler(PitchDegrees, YawDegrees, 0f);
        transform.rotation = rot;
        transform.position = target - rot * Vector3.forward * distance;

        var cam = GetComponent<Camera>();
        if (cam == null) return;
        cam.orthographic = true;
        cam.orthographicSize = orthoSize;
    }

    public void LogPose()
    {
        Vector3 fwd = transform.forward;
        float horizontal = Mathf.Sqrt(fwd.x * fwd.x + fwd.z * fwd.z);
        float depression = Mathf.Atan2(-fwd.y, horizontal) * Mathf.Rad2Deg;
        float yaw = Mathf.Atan2(fwd.x, fwd.z) * Mathf.Rad2Deg;
        string pitchText = depression.ToString("0.0", CultureInfo.InvariantCulture);
        string yawText = yaw.ToString("0.0", CultureInfo.InvariantCulture);
        string message = "[Terra] Camera pitch " + pitchText + "° (target 47.5), yaw " + yawText
            + "° fixed. Scroll or pinch clamps between neighborhood "
            + NeighborhoodOrtho.ToString("0.0", CultureInfo.InvariantCulture)
            + " and overview "
            + OverviewOrtho.ToString("0.0", CultureInfo.InvariantCulture)
            + ". Double-tap or F focuses the plot under the cursor. Tap a district to log its category key. Tap Budget Hall to log budget_hall.";
        if (Mathf.Abs(depression - PitchDegrees) > 2f)
            Debug.LogWarning(message);
        else
            Debug.Log(message);
    }

    void HandleScroll()
    {
        float scroll = Input.mouseScrollDelta.y;
        if (Mathf.Abs(scroll) > 0.01f)
            NudgeZoom(scroll * 0.9f);
    }

    void HandleMouse()
    {
        if (Input.GetMouseButtonDown(0))
        {
            pointerDown = true;
            dragPixels = 0f;
            lastPointer = Input.mousePosition;
        }

        if (pointerDown && Input.GetMouseButton(0))
        {
            Vector3 delta = Input.mousePosition - lastPointer;
            lastPointer = Input.mousePosition;
            dragPixels += delta.magnitude;
            if (dragPixels > DragThreshold) Pan(delta.x, delta.y);
        }

        if (Input.GetMouseButtonUp(0))
        {
            if (pointerDown && dragPixels <= DragThreshold)
                OnPointerUp(Input.mousePosition);
            pointerDown = false;
        }
    }

    void HandleTouch(Touch touch)
    {
        if (touch.phase == TouchPhase.Began)
        {
            dragPixels = 0f;
            pointerDown = true;
        }

        if (touch.phase == TouchPhase.Moved)
        {
            dragPixels += touch.deltaPosition.magnitude;
            if (dragPixels > DragThreshold)
                Pan(touch.deltaPosition.x, touch.deltaPosition.y);
        }

        if (touch.phase == TouchPhase.Ended || touch.phase == TouchPhase.Canceled)
        {
            if (pointerDown && touch.phase == TouchPhase.Ended && dragPixels <= DragThreshold)
                OnPointerUp(touch.position);
            pointerDown = false;
        }
    }

    void PinchZoom()
    {
        var a = Input.GetTouch(0);
        var b = Input.GetTouch(1);
        Vector2 prevA = a.position - a.deltaPosition;
        Vector2 prevB = b.position - b.deltaPosition;
        float prev = (prevA - prevB).magnitude;
        float curr = (a.position - b.position).magnitude;
        NudgeZoom((curr - prev) * 0.02f);
    }

    void NudgeZoom(float zoomIn)
    {
        if (Mathf.Abs(zoomIn) < 0.0001f) return;
        CancelFocus();
        float next = orthoSize - zoomIn;
        if (zoomIn > 0f)
        {
            float floor = orthoSize < NeighborhoodOrtho - 0.05f ? orthoSize : NeighborhoodOrtho;
            if (next < floor) next = floor;
        }

        orthoSize = Mathf.Clamp(next, FocusOrtho, OverviewOrtho);
    }

    void Pan(float dx, float dy)
    {
        CancelFocus();
        float worldPerPixel = (orthoSize * 2f) / Mathf.Max(1, Screen.height);
        Vector3 right = transform.right;
        right.y = 0f;
        if (right.sqrMagnitude > 0.0001f) right.Normalize();
        Vector3 forward = transform.forward;
        forward.y = 0f;
        if (forward.sqrMagnitude > 0.0001f) forward.Normalize();

        target -= right * dx * worldPerPixel;
        target -= forward * dy * worldPerPixel;
        target.y = 0f;
    }

    void OnPointerUp(Vector2 screen)
    {
        if (Time.unscaledTime < suppressTapUntil) return;

        bool isDouble = Time.unscaledTime - lastTapTime <= DoubleTapSeconds
            && (screen - lastTapScreen).sqrMagnitude <= DoubleTapSlop * DoubleTapSlop;
        lastTapTime = Time.unscaledTime;
        lastTapScreen = screen;

        if (!TryPick(screen, out DistrictPlaceholder plot)) return;

        if (isDouble)
        {
            BeginFocus(plot.FocusPoint);
            return;
        }

        if (plot.IsBudgetHall)
        {
            Debug.Log("[TerraBridge] budget_hall");
            return;
        }

        if (plot.LogsCategory && bridge != null)
            bridge.NotifyDistrictPressed(plot.districtKey);
    }

    void FocusUnderCursor()
    {
        if (!TryPick(Input.mousePosition, out DistrictPlaceholder plot)) return;
        BeginFocus(plot.FocusPoint);
    }

    void BeginFocus(Vector3 worldPoint)
    {
        focusFromTarget = target;
        focusToTarget = new Vector3(worldPoint.x, 0f, worldPoint.z);
        focusFromSize = orthoSize;
        focusElapsed = 0f;
        focusing = true;
    }

    void CancelFocus()
    {
        focusing = false;
    }

    void ClampTarget()
    {
        float size = focusing ? FocusOrtho : orthoSize;
        float t = Mathf.InverseLerp(FocusOrtho, OverviewOrtho, size);
        float limit = Mathf.Lerp(PanLimitFocused, PanLimitOverview, t);
        target.x = Mathf.Clamp(target.x, -limit, limit);
        target.z = Mathf.Clamp(target.z, -limit, limit);
        target.y = 0f;
    }

    bool TryPick(Vector2 screen, out DistrictPlaceholder plot)
    {
        plot = null;
        var cam = GetComponent<Camera>();
        if (cam == null) return false;
        Ray ray = cam.ScreenPointToRay(screen);
        if (!Physics.Raycast(ray, out RaycastHit hit, 400f)) return false;
        plot = hit.collider.GetComponentInParent<DistrictPlaceholder>();
        return plot != null;
    }
}
