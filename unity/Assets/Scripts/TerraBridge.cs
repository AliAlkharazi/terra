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
        public float available;
        public float spent;
        public float allocated;
    }

    [Serializable]
    public class VaultPayload
    {
        public string key;
        public string label;
        public float amount;
        public float locked;
    }

    [Serializable]
    class SetDistrictsMessage
    {
        public string type;
        public VaultPayload vault;
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

        if (msg == null || msg.type != "setDistricts")
        {
            Debug.LogWarning("[TerraBridge] expected type setDistricts");
            return;
        }

        var placeholders = GetComponentsInChildren<DistrictPlaceholder>(true);
        int applied = 0;

        if (msg.vault != null && !string.IsNullOrEmpty(msg.vault.key))
        {
            applied += ApplyOne(placeholders, msg.vault.key, msg.vault.label, msg.vault.amount, msg.vault.amount, msg.vault.amount);
        }

        if (msg.districts != null)
        {
            foreach (var payload in msg.districts)
            {
                if (payload == null || string.IsNullOrEmpty(payload.key)) continue;
                applied += ApplyOne(placeholders, payload.key, payload.label, payload.monthlyBudget, payload.available, payload.allocated);
            }
        }

        Debug.Log("[TerraBridge] setDistricts applied " + applied);
    }

    static int ApplyOne(DistrictPlaceholder[] placeholders, string key, string label, float monthlyBudget, float available, float allocated)
    {
        foreach (var placeholder in placeholders)
        {
            if (placeholder.districtKey != key) continue;
            placeholder.ApplyPayload(label, monthlyBudget, available, allocated);
            return 1;
        }
        return 0;
    }

    public void NotifyDistrictPressed(string key)
    {
        Debug.Log("[TerraBridge] districtPress " + key);
    }
}
