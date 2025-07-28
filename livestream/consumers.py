import os
import cv2
import base64
import torch
from channels.generic.websocket import AsyncWebsocketConsumer
from ultralytics import YOLO
import asyncio
from mediascanner import settings

# ─── CONFIG ──────────────────────────────
CONF_THRESHOLD = 0.5  # ignore detections below this confidence
BLUR_DETECTIONS = True
# ─────────────────────────────────────────


# ✅ Check for GPU
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[INFO] Loading YOLO model on: {DEVICE.upper()}")

# ✅ Load model and move to correct device
model_path = os.path.join(settings.BASE_DIR, "best.pt")
model = YOLO(model_path).to(DEVICE)

camera = None


def blur_region(img, x1, y1, x2, y2):
    roi = img[y1:y2, x1:x2]
    blurred_roi = cv2.GaussianBlur(roi, (25, 25), 30)
    img[y1:y2, x1:x2] = blurred_roi
    return img


def predict_and_process(frame, blur=True):
    results = model(frame)
    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            if conf < CONF_THRESHOLD:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])

            if blur:
                frame = blur_region(frame, x1, y1, x2, y2)
            else:
                cls_id = int(box.cls[0])
                label = f"{r.names[cls_id]} {conf:.2f}"
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(frame, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
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

            # ✅ Encode and send
            _, buffer = cv2.imencode(".jpg", processed_frame)
            await self.send(base64.b64encode(buffer).decode("utf-8"))

            await asyncio.sleep(0.05)  # ~20 FPS
