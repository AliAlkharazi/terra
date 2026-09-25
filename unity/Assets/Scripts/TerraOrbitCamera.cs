using UnityEngine;

/// <summary>
/// Isometric camera. Left-drag or one finger pans, scroll or pinch zooms,
/// right-drag yaws. A click with almost no drag selects a district block.
/// </summary>
public class TerraOrbitCamera : MonoBehaviour
{
    public float yaw = 45f;
    public float pitch = 52f;
    public float distance = 28f;
    public float orthoSize = 9.5f;
    public Vector3 target = Vector3.zero;

    const float MinOrtho = 4f;
    const float MaxOrtho = 18f;
    const float DragThreshold = 8f;

    TerraBridge bridge;
    float dragPixels;
    bool mouseDown;
    Vector3 lastMouse;

    void Awake()
    {
        bridge = GetComponentInParent<TerraBridge>();
        if (bridge == null) bridge = FindFirstObjectByType<TerraBridge>();
    }

    void Update()
    {
        if (Input.touchCount >= 2)
        {
            PinchZoom();
            return;
        }

        if (Input.touchCount == 1)
        {
            HandleTouch(Input.GetTouch(0));
            return;
        }

        float scroll = Input.GetAxis("Mouse ScrollWheel");
        if (Mathf.Abs(scroll) > 0.001f)
            orthoSize = Mathf.Clamp(orthoSize - scroll * 12f, MinOrtho, MaxOrtho);

        if (Input.GetMouseButton(1))
            yaw += Input.GetAxis("Mouse X") * 4f;

        if (Input.GetMouseButtonDown(0))
        {
            mouseDown = true;
            dragPixels = 0f;
            lastMouse = Input.mousePosition;
        }

        if (mouseDown && Input.GetMouseButton(0))
        {
            Vector3 delta = Input.mousePosition - lastMouse;
            lastMouse = Input.mousePosition;
            dragPixels += delta.magnitude;
            if (dragPixels > DragThreshold) Pan(delta.x, delta.y);
        }

        if (Input.GetMouseButtonUp(0))
        {
            if (mouseDown && dragPixels <= DragThreshold)
                TrySelect(Input.mousePosition);
            mouseDown = false;
        }
    }

    void LateUpdate()
    {
        Snap();
    }

    public void Snap()
    {
        var rot = Quaternion.Euler(pitch, yaw, 0f);
        transform.position = target - rot * Vector3.forward * distance;
        transform.LookAt(target);

        var cam = GetComponent<Camera>();
        if (cam == null) return;
        cam.orthographic = true;
        cam.orthographicSize = orthoSize;
    }

    void HandleTouch(Touch touch)
    {
        if (touch.phase == TouchPhase.Began)
            dragPixels = 0f;

        if (touch.phase == TouchPhase.Moved)
        {
            dragPixels += touch.deltaPosition.magnitude;
            if (dragPixels > DragThreshold)
                Pan(touch.deltaPosition.x, touch.deltaPosition.y);
        }

        if (touch.phase == TouchPhase.Ended && dragPixels <= DragThreshold)
            TrySelect(touch.position);
    }

    void PinchZoom()
    {
        var a = Input.GetTouch(0);
        var b = Input.GetTouch(1);
        Vector2 prevA = a.position - a.deltaPosition;
        Vector2 prevB = b.position - b.deltaPosition;
        float prev = (prevA - prevB).magnitude;
        float curr = (a.position - b.position).magnitude;
        orthoSize = Mathf.Clamp(orthoSize - (curr - prev) * 0.02f, MinOrtho, MaxOrtho);
    }

    void Pan(float dx, float dy)
    {
        float worldPerPixel = (orthoSize * 2f) / Mathf.Max(1, Screen.height);
        Vector3 right = transform.right;
        right.y = 0f;
        if (right.sqrMagnitude > 0.0001f) right.Normalize();
        Vector3 forward = transform.forward;
        forward.y = 0f;
        if (forward.sqrMagnitude > 0.0001f) forward.Normalize();

        target -= right * dx * worldPerPixel;
        target -= forward * dy * worldPerPixel;
        target.x = Mathf.Clamp(target.x, -18f, 18f);
        target.z = Mathf.Clamp(target.z, -18f, 18f);
        target.y = 0f;
    }

    void TrySelect(Vector2 screenPosition)
    {
        var cam = GetComponent<Camera>();
        if (cam == null) return;
        Ray ray = cam.ScreenPointToRay(screenPosition);
        if (!Physics.Raycast(ray, out RaycastHit hit, 300f)) return;
        var placeholder = hit.collider.GetComponentInParent<DistrictPlaceholder>();
        if (placeholder == null || bridge == null) return;
        bridge.NotifyDistrictPressed(placeholder.districtKey);
    }
}
