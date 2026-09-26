using System.Collections.Generic;
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// Creates Assets/Scenes/TerraWorld.unity on first editor open.
/// The scene is not committed as hand-written YAML.
/// </summary>
[InitializeOnLoad]
public static class TerraWorldSceneBuilder
{
    public const string SceneAssetPath = "Assets/Scenes/TerraWorld.unity";

    static TerraWorldSceneBuilder()
    {
        EditorApplication.update += Tick;
    }

    public static bool SceneFileExists =>
        File.Exists(Path.Combine(Application.dataPath, "Scenes/TerraWorld.unity"));

    static void Tick()
    {
        if (EditorApplication.isCompiling || EditorApplication.isUpdating) return;
        EditorApplication.update -= Tick;
        EditorApplication.delayCall += RunOnce;
    }

    static void RunOnce()
    {
        if (EditorApplication.isCompiling || EditorApplication.isUpdating || EditorApplication.isPlayingOrWillChangePlaymode)
        {
            EditorApplication.delayCall += RunOnce;
            return;
        }
        if (SessionState.GetBool("Terra.WorldAutoScene", false)) return;

        try
        {
            if (!SceneFileExists)
                CreateAndOpen();
            else if (string.IsNullOrEmpty(SceneManager.GetActiveScene().path))
                EditorSceneManager.OpenScene(SceneAssetPath);

            SessionState.SetBool("Terra.WorldAutoScene", true);
        }
        catch (System.Exception e)
        {
            Debug.LogError("[Terra] Could not create the world scene: " + e);
        }
    }

    [MenuItem("Terra/Build World Scene")]
    public static void BuildFromMenu()
    {
        if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
        CreateAndOpen();
    }

    [MenuItem("Terra/Send Sample Districts")]
    public static void SendSample()
    {
        var bridge = Object.FindFirstObjectByType<TerraBridge>();
        if (bridge == null)
        {
            Debug.LogWarning("[Terra] No TerraWorld in the open scene. Use Terra → Build World Scene, then Play.");
            return;
        }

        var path = Path.Combine(Application.dataPath, "StreamingAssets/sample-districts.json");
        if (!File.Exists(path))
        {
            Debug.LogWarning("[Terra] Missing " + path);
            return;
        }

        bridge.Receive(File.ReadAllText(path));
    }

    public static void CreateAndOpen()
    {
        Directory.CreateDirectory(Path.Combine(Application.dataPath, "Scenes"));
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        TerraWorldBuilder.Build();
        EditorSceneManager.SaveScene(scene, SceneAssetPath);

        var scenes = new List<EditorBuildSettingsScene>();
        bool found = false;
        foreach (var existing in EditorBuildSettings.scenes)
        {
            if (existing.path == SceneAssetPath)
            {
                scenes.Add(new EditorBuildSettingsScene(SceneAssetPath, true));
                found = true;
            }
            else scenes.Add(existing);
        }
        if (!found) scenes.Insert(0, new EditorBuildSettingsScene(SceneAssetPath, true));
        EditorBuildSettings.scenes = scenes.ToArray();

        PlayerSettings.companyName = "Terra";
        PlayerSettings.productName = "Terra World";
        AssetDatabase.SaveAssets();
        Debug.Log("[Terra] Saved " + SceneAssetPath + ". Press Play: 47.5° camera, Budget Hall, seven districts. Double-tap focuses a plot. A tap logs the category key.");
    }
}
