import os
import sys
import glob
import importlib.util
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from services.chroma_service import chroma_service

class SkillService:
    def __init__(self, skills_dir=None):
        self.skills_dir = skills_dir or config.SKILLS_DIR

    def scan_and_load_skills(self):
        """Scans skills/ subfolders for SKILL.md files and loads them into ChromaDB skills_store."""
        scanned_skills = []
        if not self.skills_dir.exists():
            return scanned_skills

        for item in self.skills_dir.iterdir():
            if item.is_dir():
                skill_md = item / "SKILL.md"
                if skill_md.exists():
                    try:
                        with open(skill_md, "r", encoding="utf-8") as f:
                            content = f.read()

                        name = item.name
                        desc = f"Skill {name}"

                        # Parse YAML frontmatter if present
                        if content.startswith("---"):
                            parts = content.split("---", 2)
                            if len(parts) >= 3:
                                frontmatter = parts[1]
                                for line in frontmatter.splitlines():
                                    if line.startswith("name:"):
                                        name = line.split(":", 1)[1].strip().strip('"').strip("'")
                                    elif line.startswith("description:"):
                                        desc = line.split(":", 1)[1].strip().strip('"').strip("'")

                        scanned_skills.append({
                            "name": name,
                            "folder": item.name,
                            "description": desc,
                            "full_content": content,
                            "path": str(skill_md)
                        })
                    except Exception as e:
                        print(f"Error reading SKILL.md in {item}: {e}")

        if scanned_skills:
            chroma_service.ingest_skills(scanned_skills)

        return scanned_skills

    def get_all_skill_names(self):
        """Returns list of skill names available in skills/ folder."""
        skills = self.scan_and_load_skills()
        return [s["name"] for s in skills]

    def execute_tool(self, tool_name, arguments=None):
        """
        Dynamically locates and dispatches tool execution to scripts in skills/ folders.
        tool_name: e.g. 'env_tools.get_time_and_weather', 'person_search.query_person_registry',
                   'stock_search.get_stock_market_data', 'doc_search.search_document_vector_db'
        """
        arguments = arguments or {}
        if "." in tool_name:
            module_name, func_name = tool_name.split(".", 1)
        else:
            module_name = ""
            func_name = tool_name

        # Find all python script files within skills/ directory tree
        script_files = list(self.skills_dir.glob("**/*.py"))

        # Primary search: match module name
        for script_path in script_files:
            target_stem = script_path.stem
            if module_name and (target_stem == module_name or target_stem == module_name.replace("-", "_")):
                try:
                    spec = importlib.util.spec_from_file_location(target_stem, script_path)
                    mod = importlib.util.module_from_spec(spec)
                    sys.modules[target_stem] = mod
                    spec.loader.exec_module(mod)

                    if hasattr(mod, func_name):
                        func = getattr(mod, func_name)
                        return func(**arguments)
                except Exception as e:
                    print(f"[Skill Execution Error] {script_path}: {e}")

        # Secondary search: match function name across all skill scripts
        for script_path in script_files:
            try:
                target_stem = script_path.stem
                spec = importlib.util.spec_from_file_location(target_stem, script_path)
                mod = importlib.util.module_from_spec(spec)
                sys.modules[target_stem] = mod
                spec.loader.exec_module(mod)

                if hasattr(mod, func_name):
                    func = getattr(mod, func_name)
                    return func(**arguments)
            except Exception:
                pass

        return {"status": "error", "message": f"Tool '{tool_name}' (function '{func_name}') not found in skills scripts."}

skill_service = SkillService()
