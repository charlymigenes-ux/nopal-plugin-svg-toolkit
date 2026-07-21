import json
import shutil
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PluginContractTests(unittest.TestCase):
    def test_manifest_matches_nopal_plugin_contract(self):
        manifest = json.loads((ROOT / "nopal-plugin.json").read_text(encoding="utf-8"))

        self.assertEqual(manifest["schema_version"], 1)
        self.assertEqual(manifest["id"], "svg-toolkit")
        self.assertEqual(manifest["version"], "0.8.0")
        self.assertNotIn("backend", manifest)
        self.assertEqual(manifest["frontend"], {
            "script": "frontend/svg-toolkit.js",
            "style": "frontend/svg-toolkit.css",
            "section": "svg-toolkit",
        })
        self.assertTrue((ROOT / manifest["frontend"]["script"]).is_file())
        self.assertTrue((ROOT / manifest["frontend"]["style"]).is_file())

    def test_frontend_registers_mount_and_unmount(self):
        source = (ROOT / "frontend" / "svg-toolkit.js").read_text(encoding="utf-8")

        self.assertIn("const PLUGIN_ID = 'svg-toolkit'", source)
        self.assertIn("window.NopalPluginRegistry[PLUGIN_ID]", source)
        self.assertIn("{ mount, unmount, version: VERSION }", source)
        self.assertIn("data-plugin-nav", source)
        self.assertIn("svg-toolkit-section", source)

    def test_javascript_has_valid_syntax(self):
        node = shutil.which("node")
        if node is None:
            self.skipTest("Node.js no está instalado")
        result = subprocess.run(
            [node, "--check", str(ROOT / "frontend" / "svg-toolkit.js")],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
