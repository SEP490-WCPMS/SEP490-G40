import os
import traceback
import re
from typing import List, Any, Tuple

import uvicorn
from fastapi import FastAPI, UploadFile, File
import numpy as np
import cv2

from paddleocr import PaddleOCR

DEBUG = os.environ.get("DEBUG", "0") == "1"
DEBUG_DIR = "/tmp/wm_debug"
if DEBUG:
    os.makedirs(DEBUG_DIR, exist_ok=True)

print("Loading PaddleOCR model...")
ocr = PaddleOCR(use_textline_orientation=True, lang='en')
print("PaddleOCR ready.")

app = FastAPI()


def smart_correction(text: str) -> str:
    if not text:
        return ""
    repl = {
        'O': '0', 'Q': '0', 'D': '0', 'U': '0',
        'I': '1', 'L': '1', '|': '1', ']': '1',
        'B': '8', 'S': '5', 'A': '4', 'G': '6',
        'Z': '2'
    }
    s = ""
    for ch in text.upper():
        if ch.isdigit():
            s += ch
        elif ch in repl:
            s += repl[ch]
    return s


def collect_strings(obj: Any) -> List[str]:
    if obj is None:
        return []
    if isinstance(obj, str):
        return [obj]
    if isinstance(obj, (list, tuple)):
        out = []
        for e in obj:
            out.extend(collect_strings(e))
        return out
    if isinstance(obj, dict):
        out = []
        for v in obj.values():
            out.extend(collect_strings(v))
        return out
    return []


def save_debug_image(name: str, img):
    if not DEBUG:
        return
    path = os.path.join(DEBUG_DIR, name)
    try:
        cv2.imwrite(path, img)
    except Exception as e:
        print("[DEBUG] Could not save", path, e)


def preprocess_for_ocr(img: np.ndarray, upscale: float = 1.8) -> np.ndarray:
    if img is None or img.size == 0:
        return img
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.ndim == 3 else img.copy()
    h, w = gray.shape[:2]
    if upscale and max(h, w) < 1500:
        gray = cv2.resize(gray, None, fx=upscale, fy=upscale, interpolation=cv2.INTER_CUBIC)
    gray = cv2.equalizeHist(gray)
    gray = cv2.GaussianBlur(gray, (3, 3), 0)
    try:
        th1 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                    cv2.THRESH_BINARY, 15, 9)
    except Exception:
        _, th1 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    _, th2 = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    combined = cv2.bitwise_or(th1, th2)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    combined = cv2.morphologyEx(combined, cv2.MORPH_CLOSE, kernel, iterations=1)
    return combined


def detect_meter_circle(img: np.ndarray):
    """Try to detect circular meter face with HoughCircles. Return (x,y,r) or None."""
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    except Exception:
        gray = img.copy()
    h, w = gray.shape[:2]
    scale = 600.0 / max(h, w) if max(h, w) > 600 else 1.0
    small = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA) if scale != 1.0 else gray.copy()
    small = cv2.medianBlur(small, 5)
    # parameters tuned for typical meter photo
    circles = cv2.HoughCircles(small, cv2.HOUGH_GRADIENT, dp=1.2, minDist=100,
                               param1=80, param2=30,
                               minRadius=int(min(small.shape)/6), maxRadius=int(min(small.shape)/1.8))
    if circles is None:
        return None
    # ensure numpy array and rounded ints
    circles = np.uint16(np.around(circles))
    # pick the largest circle (most likely meter face)
    best = None
    best_r = 0
    for c in circles[0, :]:
        # c is an array like [x, y, r]
        if int(c[2]) > best_r:
            best_r = int(c[2])
            best = c
    # check explicitly for None (avoid ambiguous truth value)
    if best is None:
        return None
    # map back to original scale
    cx = int(best[0] / scale)
    cy = int(best[1] / scale)
    cr = int(best[2] / scale)
    return (cx, cy, cr)


def find_white_window_in_face(img: np.ndarray, cx: int, cy: int, r: int) -> List[Tuple[int, int, int, int]]:
    """Crop circular face region and find bright rectangular regions (likely mechanical digit window)."""
    H, W = img.shape[:2]
    x1 = max(0, cx - r)
    y1 = max(0, cy - r)
    x2 = min(W, cx + r)
    y2 = min(H, cy + r)
    face = img[y1:y2, x1:x2]
    if face is None or face.size == 0:
        return []
    save_debug_image("face.png", face)
    gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    _, th = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    # invert if background is dark
    white_ratio = (th == 255).sum() / float(th.size)
    # morphological to join
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 3))
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, kernel, iterations=2)
    cnts, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    rects = []
    for c in cnts:
        x, y, w, h = cv2.boundingRect(c)
        area = w * h
        if area < 800:  # skip tiny
            continue
        aspect = w / float(h + 1e-6)
        # window usually wide and relatively flat
        if aspect < 2.5:
            continue
        # map to original image coordinates
        rx = x1 + x
        ry = y1 + y
        rects.append((rx, ry, w, h, area))
    rects.sort(key=lambda r: r[4], reverse=True)
    return [(x, y, w, h) for x, y, w, h, _ in rects]


def ocr_run(image, tag=""):
    """Run PaddleOCR using predict (preferred) and collect numeric candidates."""
    candidates = []
    variants = []
    variants.append(("orig", image))
    try:
        inv = cv2.bitwise_not(image)
        variants.append(("inv", inv))
    except Exception:
        pass
    try:
        prep = preprocess_for_ocr(image, upscale=2.0)
        variants.append(("prep", prep))
        try:
            variants.append(("prep_inv", cv2.bitwise_not(prep)))
        except Exception:
            pass
    except Exception:
        pass

    for vname, v in variants:
        try:
            # prefer predict (newer API)
            try:
                res = ocr.predict(v)
            except Exception:
                # fallback to ocr.ocr for older versions
                res = ocr.ocr(v)
        except Exception as e:
            if DEBUG:
                print(f"[OCR ERROR] {tag}-{vname}: {e}")
            continue

        if DEBUG:
            print(f"[OCR RAW] {tag}-{vname}: {res}")

        texts = collect_strings(res)
        for t in texts:
            if not isinstance(t, str):
                continue
            t_clean = re.sub(r'[^0-9A-Za-z]', '', t)
            corrected = smart_correction(t_clean)
            if corrected and len(corrected) >= 3:
                candidates.append(corrected)
    # unique and prefer longer
    uniq = list(set(candidates))
    uniq.sort(key=len, reverse=True)
    return uniq


def process_full_image(original: np.ndarray):
    H, W = original.shape[:2]
    save_debug_image("input_full.png", original)
    # 1) detect circle face
    circ = detect_meter_circle(original)
    reading_candidates = []
    id_candidates = []

    if circ:
        cx, cy, r = circ
        if DEBUG:
            print(f"[INFO] Detected face circle at {cx},{cy} r={r}")
        # find white rectangular windows inside face
        rects = find_white_window_in_face(original, cx, cy, r)
        if DEBUG:
            print("[INFO] window rects:", rects)
        # try top-most (largest area) rect as reading window
        for i, (x, y, w, h) in enumerate(rects[:4]):
            sub = original[y:y+h, x:x+w]
            save_debug_image(f"window_{i}.png", sub)
            cand = ocr_run(sub, tag=f"window{i}")
            if cand:
                reading_candidates.extend(cand)

        # also try a strip slightly above/below center of face if no rects or to augment
        strip_y1 = max(0, cy - int(r * 0.25))
        strip_y2 = min(H, cy + int(r * 0.05))
        strip = original[strip_y1:strip_y2, max(0, cx - r):min(W, cx + r)]
        save_debug_image("face_strip.png", strip)
        if strip.size:
            reading_candidates.extend(ocr_run(strip, tag="face_strip"))
    else:
        if DEBUG:
            print("[WARN] No face detected, fallback to fixed ROIs")

    # 2) fixed / heuristic ROIs (body bottom & top) for meterId
    # body bottom - region where printed serial usually on body
    y1_b = int(H * 0.48)
    y2_b = int(H * 0.92)
    bottom = original[y1_b:y2_b, :]
    save_debug_image("bottom.png", bottom)
    id_candidates.extend(ocr_run(bottom, tag="body_bottom"))

    # top sticker area
    top = original[0:int(H * 0.28), :]
    save_debug_image("top.png", top)
    id_candidates.extend(ocr_run(top, tag="top"))

    # center strip fallback (if face detect failed)
    y1_c = int(H * 0.30); y2_c = int(H * 0.60); x1_c = int(W * 0.10); x2_c = int(W * 0.90)
    center = original[y1_c:y2_c, x1_c:x2_c]
    save_debug_image("center.png", center)
    reading_candidates.extend(ocr_run(center, tag="center"))

    # clean & prioritize candidates
    reading_candidates = sorted(list(set(reading_candidates)), key=lambda x: (-len(x), x))
    id_candidates = sorted(list(set(id_candidates)), key=lambda x: (-len(x), x))

    # Heuristic for reading:
    final_reading = ""
    if reading_candidates:
        # Prefer length==6 (most mechanical windows show 6 digits integer part)
        six = [c for c in reading_candidates if len(c) == 6]
        if six:
            # among six-digit candidates, prefer one with most leading zeros
            six.sort(key=lambda s: s.count('0') + (s.startswith('0') * 2), reverse=True)
            final_reading = six[0]
        else:
            # prefer ones starting with 0
            zeros = [c for c in reading_candidates if c.startswith('0')]
            if zeros:
                final_reading = zeros[0]
            else:
                final_reading = reading_candidates[0]
        # if reading has >6 digits but contains a substring of 6 digits, extract that
        if len(final_reading) > 6:
            m = re.search(r'0+\d{3,}', final_reading)
            if m:
                final_reading = m.group(0)[:6]
        # pad or trim to 6 digits if reasonable (pad left with zeros)
        if len(final_reading) < 6 and len(final_reading) >= 3:
            final_reading = final_reading.zfill(6)

    # Heuristic for meterId:
    final_id = ""
    if id_candidates:
        # prefer length == 6 first (your meterId example has 6 digits)
        c6 = [c for c in id_candidates if len(c) == 6]
        if c6:
            final_id = c6[0]
        else:
            # otherwise choose longest candidate >=5
            id_candidates.sort(key=lambda s: len(s), reverse=True)
            if len(id_candidates[0]) >= 5:
                final_id = id_candidates[0]

    # final cleanup: digits only
    final_reading = re.sub(r'[^0-9]', '', final_reading or "")
    final_id = re.sub(r'[^0-9]', '', final_id or "")

    return final_reading, final_id


@app.post("/read_meter")
async def read_meter_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        original = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if original is None:
            return {"reading": "Error", "meterId": ""}

        reading, meterId = process_full_image(original)
        print(f"RESULT -> reading: '{reading}'  meterId: '{meterId}'")
        return {"reading": reading, "meterId": meterId}
    except Exception as e:
        print("!!! ERROR in server !!!")
        traceback.print_exc()
        return {"reading": "Error", "meterId": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)