from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / ".tools" / "python"))

from psd_tools import PSDImage


def walk(group, depth: int = 0, path: str = "") -> None:
    for index, layer in enumerate(group):
        current = f"{path}/{layer.name}"
        print(
            f"{'  ' * depth}{index:02d} {current} | "
            f"kind={layer.kind} visible={layer.visible} bbox={tuple(layer.bbox)}"
        )
        if layer.is_group():
            walk(layer, depth + 1, current)


if __name__ == "__main__":
    source = Path(sys.argv[1])
    psd = PSDImage.open(source)
    print(f"PSD {psd.width}x{psd.height} layers={len(psd)}")
    walk(psd)
