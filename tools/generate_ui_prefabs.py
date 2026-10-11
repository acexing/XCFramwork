# -*- coding: utf-8 -*-
"""生成 UI 视图 prefab、脚本 meta、目录 meta。"""
import json
import os
import uuid

ROOT = r"D:\workstation\独游项目\Framwork\XCFramwork\assets"
DEMO_DIR = os.path.join(ROOT, "scripts", "ui", "demo")
PREFABS_ROOT = os.path.join(ROOT, "resources", "prefabs")
SCREENS_DIR = os.path.join(PREFABS_ROOT, "ui", "screens")
DIALOGS_DIR = os.path.join(PREFABS_ROOT, "ui", "dialogs")

VIEWS = {
    "MainMenu": ("screens", "MainMenuView"),
    "StageView": ("screens", "StageView"),
    "ItemShopView": ("screens", "ItemShopView"),
    "LoginDialog": ("dialogs", "LoginDialog"),
    "StageStartDialog": ("dialogs", "StageStartDialog"),
    "StageCompleteDialog": ("dialogs", "StageCompleteDialog"),
    "LevelUpDialog": ("dialogs", "LevelUpDialog"),
    "MissionDialog": ("dialogs", "MissionDialog"),
    "ShopCoinDialog": ("dialogs", "ShopCoinDialog"),
    "ShopGemDialog": ("dialogs", "ShopGemDialog"),
    "ShopLifeDialog": ("dialogs", "ShopLifeDialog"),
    "MessageDialog": ("dialogs", "MessageDialog"),
    "SettingsDialog": ("dialogs", "SettingsDialog"),
    "PauseDialog": ("dialogs", "PauseDialog"),
    "RankingDialog": ("dialogs", "RankingDialog"),
}

SCRIPT_FILES = [
    "DemoTheme.ts",
    "UISprites.ts",
    "UIBuilder.ts",
    "BaseDialog.ts",
    "ShopDialogBase.ts",
    "MainMenuView.ts",
    "LoginDialog.ts",
    "StageView.ts",
    "StageStartDialog.ts",
    "StageCompleteDialog.ts",
    "LevelUpDialog.ts",
    "MissionDialog.ts",
    "ShopCoinDialog.ts",
    "ShopGemDialog.ts",
    "ShopLifeDialog.ts",
    "ItemShopView.ts",
    "MessageDialog.ts",
    "SettingsDialog.ts",
    "PauseDialog.ts",
    "RankingDialog.ts",
    "DemoUIController.ts",
]

UUID_MAP_PATH = os.path.join(DEMO_DIR, "uuid_map.json")


def new_uuid():
    return str(uuid.uuid4())


def write_json(path, data):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def script_meta(uid):
    return {
        "ver": "4.0.24",
        "importer": "typescript",
        "imported": True,
        "uuid": uid,
        "files": [],
        "subMetas": {},
        "userData": {},
    }


def directory_meta(uid):
    return {
        "ver": "1.2.0",
        "importer": "directory",
        "imported": True,
        "uuid": uid,
        "files": [],
        "subMetas": {},
        "userData": {},
    }


def prefab_meta(uid):
    return {
        "ver": "1.1.50",
        "importer": "prefab",
        "imported": True,
        "uuid": uid,
        "files": [".json"],
        "subMetas": {},
        "userData": {},
    }


def make_prefab(view_name, script_uuid):
    return [
        {
            "__type__": "cc.Prefab",
            "_name": view_name,
            "_objFlags": 0,
            "data": {"__id__": 1},
            "optimizationPolicy": 0,
            "asyncLoadAssets": False,
            "persistent": False,
        },
        {
            "__type__": "cc.Node",
            "_name": view_name,
            "_objFlags": 0,
            "_parent": None,
            "_children": [],
            "_active": True,
            "_components": [{"__id__": 2}, {"__id__": 3}],
            "_prefab": {"__id__": 4},
            "_lpos": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
            "_lrot": {"__type__": "cc.Quat", "x": 0, "y": 0, "z": 0, "w": 1},
            "_lscale": {"__type__": "cc.Vec3", "x": 1, "y": 1, "z": 1},
            "_mobility": 0,
            "_layer": 33554432,
            "_euler": {"__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0},
            "_id": "",
        },
        {
            "__type__": "cc.UITransform",
            "_name": "",
            "_objFlags": 0,
            "node": {"__id__": 1},
            "_enabled": True,
            "_contentSize": {"__type__": "cc.Size", "width": 1920, "height": 1080},
            "_anchorPoint": {"__type__": "cc.Vec2", "x": 0.5, "y": 0.5},
            "_id": "",
        },
        {
            "__type__": script_uuid,
            "_name": "",
            "_objFlags": 0,
            "node": {"__id__": 1},
            "_enabled": True,
            "_id": "",
        },
        {
            "__type__": "cc.PrefabInfo",
            "root": {"__id__": 1},
            "asset": {"__id__": 0},
            "fileId": new_uuid().replace("-", "")[:20],
            "instance": None,
            "nestedPrefabInstanceRoots": None,
        },
    ]


def main():
    os.makedirs(SCREENS_DIR, exist_ok=True)
    os.makedirs(DIALOGS_DIR, exist_ok=True)

    uuid_map = {}
    for name in SCRIPT_FILES:
        ts_path = os.path.join(DEMO_DIR, name)
        meta_path = ts_path + ".meta"
        if not os.path.exists(ts_path):
            raise SystemExit("缺少脚本: " + ts_path)
        if os.path.exists(meta_path):
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
            uid = meta.get("uuid", new_uuid())
        else:
            uid = new_uuid()
            write_json(meta_path, script_meta(uid))
        uuid_map[os.path.splitext(name)[0]] = uid

    write_json(UUID_MAP_PATH, uuid_map)

    for dir_path in [DEMO_DIR, PREFABS_ROOT, os.path.join(PREFABS_ROOT, "ui"), SCREENS_DIR, DIALOGS_DIR]:
        meta_path = os.path.join(dir_path, "meta.meta") if False else os.path.join(dir_path + ".meta")
        if not os.path.exists(meta_path):
            write_json(meta_path, directory_meta(new_uuid()))

    prefab_uuids = {}
    for view_name, (kind, script_name) in VIEWS.items():
        script_uuid = uuid_map.get(script_name)
        if not script_uuid:
            raise SystemExit("uuid 缺失: " + script_name)
        target_dir = SCREENS_DIR if kind == "screens" else DIALOGS_DIR
        prefab_path = os.path.join(target_dir, view_name + ".prefab")
        write_json(prefab_path, make_prefab(view_name, script_uuid))
        meta_path = prefab_path + ".meta"
        prefab_uuids[view_name] = new_uuid()
        if not os.path.exists(meta_path):
            write_json(meta_path, prefab_meta(prefab_uuids[view_name]))

    print("生成完成:")
    print("  脚本 meta:", len(uuid_map))
    print("  prefab:", len(VIEWS))
    for k, v in prefab_uuids.items():
        print("   ", k, v)


if __name__ == "__main__":
    main()