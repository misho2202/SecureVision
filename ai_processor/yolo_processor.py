from ultralytics import YOLO
import cv2
import torch

# ─── CONFIG ───────────────────────────────────────────
MODEL_PATH = r"best.pt"  # change if needed
SAVE_RESULTS = True
BLUR_DETECTIONS = True
CONF_THRESHOLD = 0.5
RESIZE_FOR_SPEED = True   # ✅ added for faster inference
RESIZE_DIM = (320, 320)
FRAME_SKIP = 2            # ✅ process 1 every 2 frames
# ──────────────────────────────────────────────────────

# ✅ Auto-select GPU if available
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[INFO] YOLO model running on: {DEVICE}")

# ✅ Load YOLO once
model = YOLO(MODEL_PATH).to(DEVICE)


def blur_region(img, x, y, w, h):
    """Apply Gaussian blur to detected region."""
    roi = img[y:y + h, x:x + w]
    blurred_roi = cv2.GaussianBlur(roi, (25, 25), 30)
    img[y:y + h, x:x + w] = blurred_roi
    return img


def draw_or_blur_predictions(img, results, blur=True):
    """Draw bounding boxes or blur detected objects."""
    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            if conf < CONF_THRESHOLD:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            if blur:
                img = blur_region(img, x1, y1, x2 - x1, y2 - y1)
            else:
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
    return img


def predict_and_process(frame, blur=True):
    """Run YOLO detection and process frame."""
    # ✅ Optional resize for speed
    orig_shape = (frame.shape[1], frame.shape[0])
    resized_frame = cv2.resize(frame, RESIZE_DIM) if RESIZE_FOR_SPEED else frame

    results = model(resized_frame, device=DEVICE)
    processed = draw_or_blur_predictions(resized_frame, results, blur=blur)

    # ✅ Resize back to original shape for streaming
    return cv2.resize(processed, orig_shape) if RESIZE_FOR_SPEED else processed


def process_image_file(input_path, output_path=None):
    """Process single image from disk and save."""
    img = cv2.imread(input_path)
    if img is None:
        raise FileNotFoundError(f"Image not found: {input_path}")

    processed = predict_and_process(img.copy(), blur=BLUR_DETECTIONS)
    if output_path:
        cv2.imwrite(output_path, processed)
    return processed


import time

def generate_webcam_stream():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Webcam failed to open.")

    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    frame_count = 0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_count += 1
            if frame_count % FRAME_SKIP == 0:
                processed = predict_and_process(frame.copy(), blur=BLUR_DETECTIONS)
            else:
                processed = frame

            _, buffer = cv2.imencode(".jpg", processed)
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
            )

    except GeneratorExit:
        print("[INFO] Client disconnected, releasing camera.")
    finally:
        cap.release()
        cv2.destroyAllWindows()
