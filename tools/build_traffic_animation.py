from __future__ import annotations

import math
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WIDTH = 600
HEIGHT = 600
FPS = 20
DURATION_SECONDS = 9
FRAME_COUNT = FPS * DURATION_SECONDS
FADE_FRAMES = 12

ROOT = Path(__file__).resolve().parents[1]
FRAME_DIR = ROOT / ".traffic-animation-frames"
OUTPUT = ROOT / "assets" / "traffic-compression.mp4"
POSTER = ROOT / "assets" / "traffic-compression-poster.png"

SEA_TOP = (220, 240, 248)
SEA_BOTTOM = (241, 249, 252)
LAND = (249, 250, 248)
COAST = (153, 205, 225)
COAST_GLOW = (207, 234, 243)
TEXT = (49, 67, 75)
MUTED = (107, 130, 140)
GUIDE = (123, 148, 158)
WHITE = (255, 255, 255)
WHITE_OUTLINE = (89, 110, 120)
MAGENTA = (213, 0, 126)
MAGENTA_OUTLINE = (142, 0, 84)

CENTER_X = 268
GUIDE_X = 374
FIVE_NM = 84
LEAD_START_Y = 102
REAR_INITIAL_GAP = 172


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
        Path("/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


LABEL_FONT = font(19, bold=True)
SPEED_FONT = font(15)
GUIDE_FONT = font(14)


def smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def blend_colour(top: tuple[int, int, int], bottom: tuple[int, int, int], fraction: float) -> tuple[int, int, int]:
    return tuple(round(top[index] * (1.0 - fraction) + bottom[index] * fraction) for index in range(3))


def make_background() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), SEA_BOTTOM)
    draw = ImageDraw.Draw(image)
    for y in range(HEIGHT):
        colour = blend_colour(SEA_TOP, SEA_BOTTOM, y / max(1, HEIGHT - 1))
        draw.line((0, y, WIDTH, y), fill=colour)
    return image


BACKGROUND = make_background()


def coastline_points(base_y: float) -> list[tuple[float, float]]:
    return [
        (-30, base_y + 30),
        (35, base_y + 17),
        (95, base_y + 27),
        (154, base_y + 8),
        (212, base_y + 20),
        (273, base_y - 1),
        (331, base_y + 13),
        (392, base_y - 7),
        (452, base_y + 4),
        (510, base_y - 17),
        (565, base_y - 8),
        (630, base_y - 25),
    ]


def draw_coastline(draw: ImageDraw.ImageDraw, elapsed: float) -> None:
    # The land slides south beneath the aircraft, giving a clear northbound-motion cue.
    base_y = 64 + (elapsed / DURATION_SECONDS) * 290
    coast = coastline_points(base_y)
    land_polygon = coast + [(WIDTH + 30, -50), (-30, -50)]
    draw.polygon(land_polygon, fill=LAND)
    draw.line(coast, fill=COAST_GLOW, width=10, joint="curve")
    draw.line(coast, fill=COAST, width=3, joint="curve")
    echo = [(x, y + 9) for x, y in coast]
    draw.line(echo, fill=(224, 241, 247), width=5, joint="curve")


def draw_aircraft(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    fill: tuple[int, int, int],
    outline: tuple[int, int, int],
    callsign: str,
    speed: str,
) -> None:
    points = [
        (x, y - 22),
        (x + 5, y - 8),
        (x + 22, y + 1),
        (x + 22, y + 6),
        (x + 6, y + 4),
        (x + 4, y + 22),
        (x - 4, y + 22),
        (x - 6, y + 4),
        (x - 22, y + 6),
        (x - 22, y + 1),
        (x - 5, y - 8),
    ]
    draw.polygon(points, fill=fill, outline=outline)
    draw.text((x + 31, y - 17), callsign, font=LABEL_FONT, fill=TEXT)
    draw.text((x + 31, y + 6), speed, font=SPEED_FONT, fill=MUTED)


def draw_spacing(draw: ImageDraw.ImageDraw, y1: float, y2: float, colour: tuple[int, int, int], label: str) -> None:
    draw.line((GUIDE_X, y1, GUIDE_X, y2), fill=colour, width=1)
    draw.line((GUIDE_X - 6, y1, GUIDE_X + 6, y1), fill=colour, width=1)
    draw.line((GUIDE_X - 6, y2, GUIDE_X + 6, y2), fill=colour, width=1)
    draw.text((GUIDE_X + 10, ((y1 + y2) / 2) - 8), label, font=GUIDE_FONT, fill=colour)


def render_frame(frame_number: int) -> Image.Image:
    elapsed = frame_number / FPS
    image = BACKGROUND.copy()
    draw = ImageDraw.Draw(image)
    draw_coastline(draw, elapsed)

    # All aircraft translate north together; the coastline movement reinforces the motion.
    stream_translation = -42 * (elapsed / DURATION_SECONDS)
    stream_bob = 1.2 * math.sin(elapsed * 1.15)

    y1 = LEAD_START_Y + stream_translation + stream_bob
    y2 = y1 + FIVE_NM
    y3 = y2 + FIVE_NM

    # WUK 545 begins at 300 kt, catches the stream, and reaches 250 kt exactly at 5 NM.
    if elapsed < 0.8:
        closure = 0.0
    elif elapsed < 7.2:
        closure = smoothstep((elapsed - 0.8) / 6.4)
    else:
        closure = 1.0

    rear_gap = REAR_INITIAL_GAP + (FIVE_NM - REAR_INITIAL_GAP) * closure
    y4 = y3 + rear_gap
    speed = round((300 + (250 - 300) * closure) / 5) * 5

    draw_spacing(draw, y1, y2, GUIDE, "5 NM")
    draw_spacing(draw, y2, y3, GUIDE, "5 NM")
    draw_spacing(draw, y3, y4, MAGENTA, "5 NM" if closure >= 0.995 else "closing")

    draw_aircraft(draw, CENTER_X, y1, WHITE, WHITE_OUTLINE, "EZY 5AR", "250 kt")
    draw_aircraft(draw, CENTER_X, y2, WHITE, WHITE_OUTLINE, "RYR 1WS", "250 kt")
    draw_aircraft(draw, CENTER_X, y3, WHITE, WHITE_OUTLINE, "EZY 8MH", "250 kt")
    draw_aircraft(draw, CENTER_X, y4, MAGENTA, MAGENTA_OUTLINE, "WUK 545", f"{speed} kt")

    return image


def run() -> None:
    shutil.rmtree(FRAME_DIR, ignore_errors=True)
    FRAME_DIR.mkdir(parents=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)

    frames = [render_frame(index) for index in range(FRAME_COUNT)]
    first_frame = frames[0]

    # Crossfade back to the opening state so the video can loop cleanly.
    for offset in range(FADE_FRAMES):
        index = FRAME_COUNT - FADE_FRAMES + offset
        alpha = (offset + 1) / FADE_FRAMES
        frames[index] = Image.blend(frames[index], first_frame, alpha)

    frames[0].save(POSTER, optimize=True)
    for index, frame in enumerate(frames):
        frame.save(FRAME_DIR / f"frame_{index:04d}.png", optimize=True)

    command = [
        "ffmpeg",
        "-y",
        "-framerate",
        str(FPS),
        "-i",
        str(FRAME_DIR / "frame_%04d.png"),
        "-an",
        "-c:v",
        "libx264",
        "-profile:v",
        "baseline",
        "-level",
        "3.1",
        "-pix_fmt",
        "yuv420p",
        "-crf",
        "20",
        "-movflags",
        "+faststart",
        str(OUTPUT),
    ]
    subprocess.run(command, check=True)
    shutil.rmtree(FRAME_DIR, ignore_errors=True)


if __name__ == "__main__":
    run()
