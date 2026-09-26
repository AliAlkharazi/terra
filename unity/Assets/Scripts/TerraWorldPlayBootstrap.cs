using UnityEngine;

/// <summary>
/// If Play is pressed before the editor has saved TerraWorld.unity,
/// still show the town. A saved scene already has a TerraBridge, so this does nothing.
/// </summary>
public static class TerraWorldPlayBootstrap
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void EnsureWorld()
    {
        if (Object.FindFirstObjectByType<TerraBridge>() != null) return;
        TerraWorldBuilder.Build();
    }
}
