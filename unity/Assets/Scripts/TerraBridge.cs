using System;
using UnityEngine;

/// <summary>
/// RN → Unity entry point. The future embed calls Receive on the
/// GameObject named TerraWorld. See docs/UNITY_WORLD.md.
/// </summary>
public class TerraBridge : MonoBehaviour
{
    [Serializable]
    public class DistrictPayload
    {
        public string key;
        public string label;
        public string icon;
        public float monthlyBudget;
        public float spent;
        public float healthPct;
    }

    [Serializable]
    class SetDistrictsMessage
    {
        public string type;
        public DistrictPayload[] districts;
    }

    public void Receive(string json)
    {
        if (string.IsNullOrEmpty(json)) return;

        SetDistrictsMessage msg;
        try
        {
            msg = JsonUtility.FromJson<SetDistrictsMessage>(json);
        }
        catch (Exception e)
        {
            Debug.LogWarning("[TerraBridge] could not read message: " + e.Message);
            return;
        }

        if (msg == null || msg.type != "setDistricts" || msg.districts == null)
        {
            Debug.LogWarning("[TerraBridge] expected type setDistricts");
            return;
        }

        var placeholders = GetComponentsInChildren<DistrictPlaceholder>(true);
        int applied = 0;
        foreach (var payload in msg.districts)
        {
            if (payload == null || string.IsNullOrEmpty(payload.key)) continue;
            foreach (var placeholder in placeholders)
            {
                if (placeholder.districtKey != payload.key) continue;
                placeholder.ApplyPayload(payload.label, payload.monthlyBudget, payload.healthPct);
                applied++;
                break;
            }
        }

        Debug.Log("[TerraBridge] setDistricts applied " + applied);
    }

    public void NotifyDistrictPressed(string key)
    {
        Debug.Log("[TerraBridge] districtPress " + key);
    }
}
