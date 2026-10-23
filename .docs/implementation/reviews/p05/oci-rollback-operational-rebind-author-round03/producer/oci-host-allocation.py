"""IPC-free finite readonly host allocation probe. Exact copied METHOD06 scanner."""
import json,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from oci_allocated_tree import inspect_tree
row=inspect_tree(sys.argv[1]);print(json.dumps({'allocated_bytes':row['allocated_bytes'],'logical_bytes':row['logical_bytes'],'files':row['files'],'metric':row['metric']}))
