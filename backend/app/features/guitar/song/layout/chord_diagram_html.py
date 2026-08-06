"""Server-side re-implementation of frontend/.../guitar/chords/ChordDiagram.tsx, producing
static HTML for WeasyPrint. There's no live browser to run the React component in a PDF
render, so the same layout math (fret window, interval markers) is reproduced here in plain
Python, with a fixed print palette instead of the app's live theme colors."""

INTERVAL_LABELS = ["R", "b2", "M2", "b3", "M3", "P4", "b5", "P5", "b6", "M6", "b7", "M7"]
STANDARD_TUNING_SEMITONES = [4, 9, 2, 7, 11, 4]
_NOTE_TO_SEMITONE = {
    "C": 0, "B#": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "Fb": 4,
    "F": 5, "E#": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10,
    "Bb": 10, "B": 11, "Cb": 11,
}
_MARKER_FRETS = {3, 5, 7, 10, 12, 15}
_SIZE_SCALE = {"very_small": 0.5, "small": 0.7, "medium": 1.0, "large": 1.3}

_TEXT = "#1a1a1a"
_SURFACE = "#ffffff"
_GHOST = "#e5e5e5"
_BORDER = "#999999"
_SECONDARY = "#666666"

_BASE_CELL_W = 28
_BASE_ROW_H = 28
_BASE_NUT_H = 4
_BASE_MARKER_SIZE = 20


def _interval_semitone_from_root(root_note: str, string_index: int, fret: int) -> int | None:
    root_semitone = _NOTE_TO_SEMITONE.get(root_note)
    if root_semitone is None:
        return None
    note_semitone = (STANDARD_TUNING_SEMITONES[string_index] + fret) % 12
    return ((note_semitone - root_semitone) % 12 + 12) % 12


def _compute_fret_window(frets: list) -> tuple[int, int]:
    has_open_string = any(f == 0 for f in frets)
    positive_frets = [f for f in frets if isinstance(f, int) and f > 0]
    base_fret = 1 if (has_open_string or not positive_frets) else min(positive_frets)
    max_fret = max(positive_frets) if positive_frets else base_fret
    window_size = max(4, max_fret - base_fret + 1)
    return base_fret, window_size


def compute_window_size(frets: list) -> int:
    """The number of fret rows this chord's diagram needs on its own — used to size every
    diagram in a print block to the same (largest) height, so a page of chords lines up evenly."""
    return _compute_fret_window(frets)[1]


def diagram_pixel_width(diagram_size: str = "medium", extra_scale: float = 1.0) -> float:
    """Total rendered width of a diagram (6-string grid + gap + fret-number column). WeasyPrint
    doesn't reliably report the intrinsic width of a nested inline-flex diagram to an ancestor
    inline-block card, so callers wrapping several diagrams side by side must size each card
    explicitly with this value instead of leaving it to shrink-to-fit — otherwise cards collapse
    to their (narrower) chord-name-label width and the diagrams overlap. extra_scale composes
    with the diagram_size scale, for a block-level zoom on top of the song's own diagram size."""
    scale = _SIZE_SCALE.get(diagram_size, 1.0) * extra_scale
    grid_width = 6 * _BASE_CELL_W * scale
    right_col_width = 20 * scale
    return grid_width + 10 + right_col_width + 10


def _interval_marker_html(semitone: int, size: float, simple: bool) -> str:
    if simple:
        return f'<div style="width:{size}px;height:{size}px;flex:0 0 {size}px;border-radius:50%;background-color:{_TEXT};"></div>'
    is_root = semitone == 0
    label = INTERVAL_LABELS[semitone]
    font_size = size * (0.34 if len(label) > 2 else 0.4)
    background = _TEXT if is_root else _GHOST
    color = _SURFACE if is_root else _TEXT
    return (
        f'<div style="width:{size}px;height:{size}px;flex:0 0 {size}px;border-radius:50%;display:flex;'
        f'align-items:center;justify-content:center;background-color:{background};'
        f'border:1px solid {_BORDER};color:{color};font-size:{font_size}px;font-weight:700;'
        f'line-height:1;">{label}</div>'
    )


def _muted_marker_html(size: float) -> str:
    return (
        f'<div style="width:{size}px;height:{size}px;flex:0 0 {size}px;border-radius:50%;display:flex;'
        f'align-items:center;justify-content:center;border:1px dashed {_SECONDARY};'
        f'color:{_SECONDARY};font-size:{size * 0.4}px;font-weight:700;line-height:1;">X</div>'
    )


def _cell(content: str, width: float, height: float, border_left: bool = False) -> str:
    border = f"border-left:1px solid {_BORDER};" if border_left else ""
    return (
        f'<div style="width:{width}px;height:{height}px;flex:0 0 {width}px;display:flex;align-items:center;'
        f'justify-content:center;{border}">{content}</div>'
    )


def _open_mute_row_html(frets: list, root_note: str, simple: bool, cell_w: float, row_h: float, marker_size: float) -> str:
    cells = []
    for string_index, fret in enumerate(frets):
        content = ""
        if fret == "X":
            content = _muted_marker_html(marker_size)
        elif fret == 0:
            semitone = _interval_semitone_from_root(root_note, string_index, 0)
            if semitone is not None:
                content = _interval_marker_html(semitone, marker_size, simple)
        cells.append(_cell(content, cell_w, row_h))
    return f'<div style="display:flex;flex-wrap:nowrap;width:{cell_w * 6}px;">{"".join(cells)}</div>'


def _fret_row_html(
    fret: int, frets: list, root_note: str, simple: bool, cell_w: float, row_h: float, marker_size: float
) -> str:
    cells = []
    for string_index, string_fret in enumerate(frets):
        content = ""
        if string_fret == fret:
            semitone = _interval_semitone_from_root(root_note, string_index, fret)
            if semitone is not None:
                content = _interval_marker_html(semitone, marker_size, simple)
        cells.append(_cell(content, cell_w, row_h, border_left=string_index > 0))
    return (
        f'<div style="display:flex;flex-wrap:nowrap;width:{cell_w * 6}px;border-bottom:1px solid {_BORDER};">'
        f'{"".join(cells)}</div>'
    )


def render_chord_diagram_html(
    frets: list, root_note: str, diagram_style: str = "full", diagram_size: str = "medium", min_window_size: int = 0,
    extra_scale: float = 1.0,
) -> str:
    """Frets: list of int (fret number) or the literal 'X' for a muted string, low-to-high string order.
    min_window_size: pass the largest compute_window_size() among a group of diagrams to render
    them all with the same number of fret rows (same height), even if this chord itself needs fewer.
    extra_scale composes with the diagram_size scale, for a block-level zoom on top of the song's
    own diagram size."""
    scale = _SIZE_SCALE.get(diagram_size, 1.0) * extra_scale
    simple = diagram_style == "simple"
    cell_w = _BASE_CELL_W * scale
    row_h = _BASE_ROW_H * scale
    nut_h = _BASE_NUT_H * scale
    marker_size = _BASE_MARKER_SIZE * scale
    base_fret, window_size = _compute_fret_window(frets)
    window_size = max(window_size, min_window_size)
    fret_rows = range(base_fret, base_fret + window_size)

    grid_width = cell_w * 6
    right_col_width = 20 * scale

    left_rows = [
        f'<div style="width:{grid_width}px;height:14px;font-size:11px;color:{_SECONDARY};">'
        f'{f"{base_fret}fr" if base_fret > 1 else ""}</div>'
    ]
    left_rows.append(_open_mute_row_html(frets, root_note, simple, cell_w, row_h, marker_size))
    if base_fret == 1:
        left_rows.append(f'<div style="width:{cell_w * 6}px;height:{nut_h}px;background-color:{_TEXT};"></div>')
    for fret in fret_rows:
        left_rows.append(_fret_row_html(fret, frets, root_note, simple, cell_w, row_h, marker_size))

    right_rows = ['<div style="height:14px;"></div>', f'<div style="height:{row_h}px;"></div>']
    if base_fret == 1:
        right_rows.append(f'<div style="height:{nut_h}px;"></div>')
    for fret in fret_rows:
        is_marker_fret = fret in _MARKER_FRETS
        font_size = 12 if is_marker_fret else 10
        weight = 700 if is_marker_fret else 400
        color = _TEXT if is_marker_fret else _SECONDARY
        right_rows.append(
            f'<div style="height:{row_h}px;display:flex;align-items:center;padding-left:4px;'
            f'font-size:{font_size}px;font-weight:{weight};color:{color};">{fret}</div>'
        )

    # inline-block with explicit widths (not inline-flex + gap) — WeasyPrint doesn't reliably
    # size a flex item from its block children's intrinsic width, which let the right
    # (fret-number) column drift left and overlap the grid instead of sitting to its right.
    return (
        f'<div style="display:inline-block;color:{_TEXT};">'
        f'<div style="display:inline-block;vertical-align:top;width:{grid_width}px;">{"".join(left_rows)}</div>'
        f'<div style="display:inline-block;vertical-align:top;width:{right_col_width}px;margin-left:10px;">'
        f'{"".join(right_rows)}</div>'
        f'</div>'
    )
