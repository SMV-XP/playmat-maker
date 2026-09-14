from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / ".tools" / "python"))

from PIL import Image
from psd_tools import PSDImage


def find_path(root, path: str):
    current = root
    for part in path.split("/"):
        current = next(layer for layer in current if layer.name == part)
    return current


def render_layer(layer):
    rendered = layer.composite(force=True)
    # psd-tools still applies a hidden parent group's visibility to composite().
    # topil() preserves the layer pixels and text rasterization in that case.
    if rendered is None or rendered.convert("RGBA").getbbox() is None:
        rendered = layer.topil()
    return rendered


def composite_layers(psd, paths: list[str], output: Path) -> None:
    layers = [find_path(psd, path) for path in paths]
    left = min(layer.left for layer in layers)
    top = min(layer.top for layer in layers)
    right = max(layer.right for layer in layers)
    bottom = max(layer.bottom for layer in layers)
    canvas = Image.new("RGBA", (right - left, bottom - top), (0, 0, 0, 0))

    # PSD layers are returned in bottom-to-top order. Composite in that same order.
    for layer in layers:
        rendered = render_layer(layer)
        if rendered is None:
            raise RuntimeError(f"Could not render {layer.name}")
        rendered = rendered.convert("RGBA")
        canvas.alpha_composite(rendered, (layer.left - left, layer.top - top))

    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output)
    print(f"{output.name}: {canvas.size} bbox=({left}, {top}, {right}, {bottom})")


def save_layer(psd, path: str, output: Path) -> None:
    layer = find_path(psd, path)
    rendered = render_layer(layer)
    if rendered is None:
        raise RuntimeError(f"Could not render {path}")
    rendered = rendered.convert("RGBA")
    output.parent.mkdir(parents=True, exist_ok=True)
    rendered.save(output)
    print(f"{output.name}: {rendered.size} bbox={tuple(layer.bbox)}")


if __name__ == "__main__":
    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    psd = PSDImage.open(source)

    composite_layers(psd, ["Zones/Security", "Zones/Security Inner"], destination / "zone-security.png")
    composite_layers(psd, ["Zones/Breeding Area", "Zones/Layer 14"], destination / "zone-breeding.png")
    composite_layers(psd, ["Zones/Deck", "Zones/Deck Inner"], destination / "zone-deck.png")
    composite_layers(psd, ["Zones/Trash", "Zones/Trash Inner"], destination / "zone-trash.png")
    save_layer(psd, "Zones/Battle", destination / "zone-battle.png")
    save_layer(psd, "Memory", destination / "memory-gauge.png")
    save_layer(psd, "Text/Security Stack", destination / "label-security.png")
    save_layer(psd, "Text/Breeding area", destination / "label-breeding.png")
    save_layer(psd, "Text/Deck", destination / "label-deck.png")
    save_layer(psd, "Text/Trash", destination / "label-trash.png")
    save_layer(psd, "Text/Battle area", destination / "label-battle.png")
    save_layer(psd, "Text/Breeding Area", destination / "zone-breeding-egg.png")
    save_layer(psd, "Turn Order/Layer 4", destination / "zone-turn-order.png")
    composite_layers(
        psd,
        [
            "Turn Order/Turn Order",
            "Turn Order/Active Phase",
            "Turn Order/Draw Phase",
            "Turn Order/Raising Phase",
            "Turn Order/Main Phase",
        ],
        destination / "label-turn-order.png",
    )
