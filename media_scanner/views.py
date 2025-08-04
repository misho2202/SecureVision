import subprocess
from datetime import datetime
import numpy as np
import torch
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import cv2
import os

from ultralytics import YOLO

from mediascanner import settings

# Global camera instance
camera = None

# Check for GPU
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[INFO] Loading YOLO model on: {DEVICE.upper()}")

# Load model and move to correct device
model_path = os.path.join(settings.BASE_DIR, "best.pt")
model = YOLO(model_path).to(DEVICE)


CONF_THRESHOLD = 0.5
BLUR_DETECTIONS = True


def blur_region(img, x, y, w, h):
    roi = img[y:y + h, x:x + w]
    blurred_roi = cv2.GaussianBlur(roi, (25, 25), 30)
    img[y:y + h, x:x + w] = blurred_roi
    return img


def draw_or_blur_predictions(img, results, blur=False):
    for r in results:
        for box in r.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            if conf < CONF_THRESHOLD:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            label = f"{r.names[cls_id]} {conf:.2f}"

            if blur:
                img = blur_region(img, x1, y1, x2 - x1, y2 - y1)
            else:
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.putText(img, label, (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
    return img


def predict_and_process(model, frame, blur=True):
    results = model(frame)
    return draw_or_blur_predictions(frame, results, blur=blur)


def run_video_mode(model, input_path, output_path):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Video not found: {input_path}")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:  # fallback to safe fps
        fps = 25

    # Use H.264 if supported
    out = cv2.VideoWriter(
        output_path,
        cv2.VideoWriter_fourcc(*'avc1'),
        fps,
        (width, height)
    )

    print("[INFO] Processing video...")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        processed = predict_and_process(model, frame.copy(), blur=BLUR_DETECTIONS)
        out.write(processed)

    cap.release()
    out.release()
    print(f"[✓] Done. Output saved to {output_path}")


# Process single video using OpenCV
def process_video(input_path, output_path, model):
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Video not found: {input_path}")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25

    # Use mp4v for better compatibility
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    print("[INFO] Processing video...")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        processed = predict_and_process(model, frame.copy(), blur=BLUR_DETECTIONS)
        out.write(processed)

    cap.release()
    out.release()
    print(f"[✓] Done. Output saved to {output_path}")


# convert mp4 to webm
def convert_to_webm(input_path, output_path):
    subprocess.run([
        "ffmpeg", "-y",
        "-i", input_path,
        "-c:v", "libvpx-vp9", "-b:v", "1M",
        "-c:a", "libopus",
        output_path
    ])
    print(f"[✓] Converted to {output_path}")


@csrf_exempt
def upload(request):
    if request.method == "POST":
        uploaded_files = request.FILES.getlist("images")
        results = []

        for f in uploaded_files:
            file_ext = os.path.splitext(f.name)[1].lower()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

            # IMAGE HANDLING
            if file_ext in [".jpg", ".jpeg", ".png", ".bmp"]:
                file_bytes = f.read()
                np_arr = np.frombuffer(file_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                blurred = predict_and_process(model, frame, blur=BLUR_DETECTIONS)
                filename = f"blurred_{timestamp}_{f.name}"
                blurred_dir = os.path.join(settings.MEDIA_ROOT, "blurred")
                os.makedirs(blurred_dir, exist_ok=True)
                blurred_path = os.path.join(blurred_dir, filename)
                cv2.imwrite(blurred_path, blurred)

                results.append({
                    "filename": filename,
                    "url": f"{settings.MEDIA_URL}blurred/{filename}",
                })

            # VIDEO HANDLING
            elif file_ext in [".mp4", ".mov", ".avi", ".mkv"]:
                video_dir = os.path.join(settings.MEDIA_ROOT, "blurred")
                os.makedirs(video_dir, exist_ok=True)

                input_path = os.path.join(video_dir, f"input_{timestamp}_{f.name}")
                output_mp4_path = os.path.join(video_dir, f"blurred_{timestamp}.mp4")
                output_webm_path = os.path.join(video_dir, f"blurred_{timestamp}.webm")

                with open(input_path, "wb") as video_file:
                    for chunk in f.chunks():
                        video_file.write(chunk)

                # Process and convert
                process_video(input_path, output_mp4_path, model)
                convert_to_webm(output_mp4_path, output_webm_path)

                # Clean up
                os.remove(input_path)
                os.remove(output_mp4_path)

                results.append({
                    "filename": os.path.basename(output_webm_path),
                    "url": f"{settings.MEDIA_URL}blurred/{os.path.basename(output_webm_path)}",
                })

        return JsonResponse({"results": results})

    return JsonResponse({"error": "Only POST allowed"}, status=400)


@csrf_exempt
def disconnect_livestream(request):
    """API to stop the webcam"""
    global camera

    if camera and camera.isOpened():
        camera.release()
        camera = None
        return JsonResponse({"status": "disconnected"})
    else:
        return JsonResponse({"status": "already_closed"})


@csrf_exempt
def delete_file(request):
    if request.method == "POST":
        import json
        try:
            data = json.loads(request.body)
            filename = data.get("filename")

            if not filename:
                return JsonResponse({"error": "Filename is required"}, status=400)

            file_path = os.path.join(settings.MEDIA_ROOT, "blurred", filename)
            if os.path.exists(file_path):
                os.remove(file_path)
                return JsonResponse({"status": "deleted"})
            else:
                return JsonResponse({"error": "File not found"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Only POST allowed"}, status=400)

