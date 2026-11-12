import base64
import binascii
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ORIGIN = "https://countergithub.w3spaces.com"
SVG = "{http://www.w3.org/2000/svg}"
DESTINATION = Path("assets/counter-snapshot.svg")
MAX_ATTEMPTS = 8
LIMIT = 200_000
TITLE = re.compile(r"Profile counter: ([0-9]{1,30}) badge requests")
DIGIT = re.compile(r"digit-[0-9]")
DIMENSION = re.compile(r"[0-9]{1,6}")


def read_badge(payload):
    if len(payload) > LIMIT:
        raise ValueError("oversized badge")

    root = ET.fromstring(payload)
    if root.tag != SVG + "svg":
        raise ValueError("expected an SVG badge")

    width, height = (root.get(key, "") for key in ("width", "height"))
    if not (DIMENSION.fullmatch(width) and DIMENSION.fullmatch(height)):
        raise ValueError("invalid image dimensions")

    title = root.findtext(SVG + "title", "")
    match = TITLE.fullmatch(title)
    if not match:
        raise ValueError("missing badge count")
    count = int(match[1])

    clean = ET.Element("svg", {
        "xmlns": SVG[1:-1], "width": width, "height": height,
        "viewBox": f"0 0 {width} {height}", "role": "img", "aria-labelledby": "title",
    })
    ET.SubElement(clean, "title", {"id": "title"}).text = title
    defs = ET.SubElement(clean, "defs")

    images = {}
    for image in root.findall(f"{SVG}defs/{SVG}image"):
        name, href = (image.get(key, "") for key in ("id", "href"))
        sprite_width, sprite_height = (image.get(key, "") for key in ("width", "height"))
        prefix = "data:image/gif;base64,"
        if not (DIGIT.fullmatch(name) and href.startswith(prefix)
                and DIMENSION.fullmatch(sprite_width) and DIMENSION.fullmatch(sprite_height)):
            raise ValueError("invalid digit image")
        data = base64.b64decode(href[len(prefix):], validate=True)
        if not data.startswith((b"GIF87a", b"GIF89a")):
            raise ValueError("expected a GIF digit")
        images[name] = (int(sprite_width), int(sprite_height))
        ET.SubElement(defs, "image", {
            "id": name, "href": href, "width": sprite_width, "height": sprite_height,
        })

    x = 0
    digits = []
    for element in root.findall(SVG + "use"):
        href = element.get("href", "")
        if not href.startswith("#") or href[1:] not in images:
            raise ValueError("invalid digit reference")
        name = href[1:]
        sprite_width, sprite_height = images[name]
        digits.append(name[-1])
        ET.SubElement(clean, "use", {"href": href, "x": str(x), "y": str(int(height) - sprite_height)})
        x += sprite_width

    if "".join(digits) != str(count).zfill(6) or x != int(width):
        raise ValueError("sprite sequence does not match the badge count")
    return count, ET.tostring(clean, encoding="unicode") + "\n"


def refresh():
    last = read_badge(DESTINATION.read_bytes())[0] if DESTINATION.exists() else -1
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            url = f"{ORIGIN}/preview.svg?_refresh={time.time_ns()}"
            with urllib.request.urlopen(url, timeout=8) as response:
                if response.headers.get_content_type() != "image/svg+xml":
                    raise ValueError("the host did not return a badge")
                count, svg = read_badge(response.read(LIMIT + 1))
            if count < last:
                print(f"::warning::Origin reported {count}; keeping the last confirmed count of {last}.")
                return
            if count > last:
                DESTINATION.write_text(svg, encoding="utf-8")
            print(f"Counter ready on attempt {attempt}. Confirmed badge requests: {count}.")
            return
        except (OSError, ValueError, ET.ParseError, binascii.Error) as error:
            print(f"Attempt {attempt}: {error}")
            if attempt < MAX_ATTEMPTS:
                time.sleep(10)
    print("::warning::Counter is warming up or unavailable. Keeping the last confirmed recovery count.")


if __name__ == "__main__":
    if len(sys.argv) == 3:
        _, svg = read_badge(Path(sys.argv[1]).read_bytes())
        Path(sys.argv[2]).write_text(svg, encoding="utf-8")
    else:
        refresh()
