"""Source file inventory shared by manifest/docs checks; never traverses dependencies."""
from pathlib import Path
import os
EXCLUDED = {'.git', 'node_modules', 'dist', '__pycache__', '.venv', '.artifacts', 'coverage'}
def source_files(root: Path):
    for directory, names, files in os.walk(root):
        names[:] = [name for name in names if name not in EXCLUDED]
        if Path(directory) == root/'.history':
            names[:] = [name for name in names if name != 'example']
        for name in files:
            if name in EXCLUDED:
                continue
            path = Path(directory)/name
            if name.endswith(('.pyc','.tsbuildinfo','.log')) or name == '.env' or (name.startswith('.env.') and name != '.env.example'):
                continue
            yield path
