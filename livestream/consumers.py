import os
import cv2
import base64
import torch
from channels.generic.websocket import AsyncWebsocketConsumer
from ultralytics import YOLO
import asyncio
from mediascanner import settings


from collections import deque
import time

# Store detection history as deque of (timestamp, (x1, y1, x2, y2))
recent_blurs = deque()
BLUR_DURATION = 0.5  # seconds

from collections import defaultdict

object_tracks = defaultdict(list)  # cls_id: list of (timestamp, (x1, y1, x2, y2))
PREDICT_AHEAD = 0.2  # seconds to predict ahead


# ─── CONFIG ──────────────────────────────
CONF_THRESHOLD = 0.3  # ignore detections below this confidence
BLUR_DETECTIONS = True
# ─────────────────────────────────────────


# Check for GPU
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[INFO] Loading YOLO model on: {DEVICE.upper()}")

# Load model and move to correct device
model_path = os.path.join(settings.BASE_DIR, "best.pt")
model = YOLO(model_path).to(DEVICE)

camera = None


def blur_region(img, x1, y1, x2, y2):
    height, width = img.shape[:2]

    # Clamp coordinates to stay within frame
    x1 = max(0, min(x1, width - 1))
    x2 = max(0, min(x2, width - 1))
    y1 = max(0, min(y1, height - 1))
    y2 = max(0, min(y2, height - 1))

    # Skip if box is too small or invalid
    if x2 <= x1 or y2 <= y1:
        return img

    roi = img[y1:y2, x1:x2]
    if roi.size == 0:
        return img

    blurred_roi = cv2.GaussianBlur(roi, (25, 25), 30)
    img[y1:y2, x1:x2] = blurred_roi
    return img


def predict_and_process(frame, blur=True):
    current_time = time.time()

    # Step 1: Run YOLO
    results = model(frame, stream=True)

    detected_now = []

    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            if conf < CONF_THRESHOLD:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cls_id = int(box.cls[0])
            detected_now.append((cls_id, (x1, y1, x2, y2)))

            # Store detection history
            object_tracks[cls_id].append((current_time, (x1, y1, x2, y2)))

            # Optional: draw label
            if not blur:
                label = f"{r.names[cls_id]} {conf:.2f}"
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Step 2: Predict future positions
    future_blurs = []
    for cls_id, track in object_tracks.items():
        # Clean old history (>0.5s ago)
        track = [(t, bbox) for t, bbox in track if current_time - t <= 0.5]
        object_tracks[cls_id] = track

        if len(track) >= 2:
            (t1, box1), (t2, box2) = track[-2], track[-1]

            # Compute motion vector
            dt = t2 - t1
            if dt == 0:
                continue

            dx1 = (box2[0] - box1[0]) / dt
            dy1 = (box2[1] - box1[1]) / dt
            dx2 = (box2[2] - box1[2]) / dt
            dy2 = (box2[3] - box1[3]) / dt

            dt_future = PREDICT_AHEAD
            pred_box = (
                int(box2[0] + dx1 * dt_future),
                int(box2[1] + dy1 * dt_future),
                int(box2[2] + dx2 * dt_future),
                int(box2[3] + dy2 * dt_future),
            )
            future_blurs.append(pred_box)

    # Step 3: Apply blur to current and predicted
    if blur:
        for _, box in detected_now:
            x1, y1, x2, y2 = box
            frame = blur_region(frame, x1, y1, x2, y2)

        for x1, y1, x2, y2 in future_blurs:
            frame = blur_region(frame, x1, y1, x2, y2)

    return frame


class LivestreamConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        global camera
        await self.accept()

        if camera is None or not camera.isOpened():
            camera = cv2.VideoCapture(0)

        asyncio.create_task(self.stream_video())

    async def disconnect(self, close_code):
        global camera
        if camera and camera.isOpened():
            camera.release()

    async def stream_video(self):
        global camera
        while True:
            if camera is None or not camera.isOpened():
                break

            ret, frame = camera.read()
            if not ret:
                break

            processed_frame = predict_and_process(frame, blur=BLUR_DETECTIONS)

            # Encode and send
            _, buffer = cv2.imencode(".jpg", processed_frame)
            await self.send(base64.b64encode(buffer).decode("utf-8"))

            await asyncio.sleep(0.05)  # ~20 FPS
