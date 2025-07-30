import torch
from ultralytics import YOLO
import cv2
import time
import glob
import os
import datetime

from mediascanner import settings

# ─── CONFIG ─────────────────────────────────────────────────────────────────────
MODE               = "webcam"  # options: "image", "webcam", "video", "folder"
MODEL_PATH         = r"best.pt"  # <-- your trained model path
IMAGE_PATH         = r"C:\Users\miavetisyan\Desktop\images\photo_5_2025-07-16_15-36-36.jpg"
VIDEO_PATH         = r"C:\Users\miavetisyan\Desktop\video_2025-07-14_15-20-20.mp4"
IMAGE_FOLDER_PATH  = r"C:\Users\miavetisyan\Desktop\images"
OUTPUT_FOLDER_PATH = r"C:\Users\miavetisyan\Desktop\output_images"
SAVE_RESULTS       = True
BLUR_DETECTIONS    = True
CONF_THRESHOLD     = 0.5  # Filter detections below this confidence
# ────────────────────────────────────────────────────────────────────────────────


def load_model(model_path):
    # ✅ Check for GPU
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[INFO] Loading YOLO model on: {DEVICE.upper()}")

    # ✅ Load model and move to correct device
    full_model_path = os.path.join(settings.BASE_DIR, model_path)
    model = YOLO(full_model_path).to(DEVICE)
    return model
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


def run_image_mode(model):
    img = cv2.imread(IMAGE_PATH)
    if img is None:
        raise FileNotFoundError(f"Image not found: {IMAGE_PATH}")
    output = predict_and_process(model, img, blur=BLUR_DETECTIONS)
    if SAVE_RESULTS:
        cv2.imwrite("output_image.jpg", output)
    print("[✓] Processed image saved to output_image.jpg")


def run_webcam_mode(model):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Webcam failed to open.")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps != fps:
        print("[WARNING] Webcam FPS not available. Defaulting to 10 FPS.")
        fps = 10

    out = None
    output_filename = None
    if SAVE_RESULTS:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        output_filename = f"output_webcam_{timestamp}.mp4"
        out = cv2.VideoWriter(output_filename, cv2.VideoWriter_fourcc(*'mp4v'),
                              fps, (width, height))

    print("[INFO] Recording webcam... Press 'q' to quit.")
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARNING] Frame capture failed.")
            break

        start = time.time()
        processed = predict_and_process(model, frame.copy(), blur=BLUR_DETECTIONS)
        fps_calc = 1 / (time.time() - start + 1e-6)

        cv2.putText(processed, f"FPS: {fps_calc:.2f}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        cv2.imshow("Webcam - Press q to quit", processed)

        if SAVE_RESULTS and out:
            out.write(processed)
            frame_count += 1

        if cv2.waitKey(10) & 0xFF == ord('q'):
            print("[INFO] Quit key pressed.")
            break

    cap.release()
    if out:
        out.release()
    if SAVE_RESULTS:
        print(f"[✓] Saved {frame_count} frames to {output_filename}")
    cv2.destroyAllWindows()


def run_video_mode(model):
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        raise FileNotFoundError(f"Video not found: {VIDEO_PATH}")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    out = None
    if SAVE_RESULTS:
        out = cv2.VideoWriter("output_video.mp4", cv2.VideoWriter_fourcc(*'mp4v'),
                              fps, (width, height))

    print("[INFO] Processing video...")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        processed = predict_and_process(model, frame.copy(), blur=BLUR_DETECTIONS)
        if SAVE_RESULTS and out:
            out.write(processed)

    cap.release()
    if out:
        out.release()
    print("[✓] Done. Output saved to output_video.mp4")


def run_folder_mode(model):
    if not os.path.exists(OUTPUT_FOLDER_PATH):
        os.makedirs(OUTPUT_FOLDER_PATH)

    image_extensions = ('*.jpg', '*.jpeg', '*.png', '*.bmp', '*.webp')
    image_files = []
    for ext in image_extensions:
        image_files.extend(glob.glob(os.path.join(IMAGE_FOLDER_PATH, ext)))

    print(f"[INFO] Found {len(image_files)} images in folder.")

    for i, img_path in enumerate(image_files, 1):
        img = cv2.imread(img_path)
        if img is None:
            print(f"[WARNING] Skipping unreadable file: {img_path}")
            continue

        output = predict_and_process(model, img.copy(), blur=BLUR_DETECTIONS)
        base_name = os.path.basename(img_path)
        save_path = os.path.join(OUTPUT_FOLDER_PATH, base_name)

        if SAVE_RESULTS:
            cv2.imwrite(save_path, output)
            print(f"[{i}/{len(image_files)}] Saved: {save_path}")


def main():
    model = load_model(MODEL_PATH)

    if MODE == "image":
        run_image_mode(model)
    elif MODE == "webcam":
        run_webcam_mode(model)
    elif MODE == "video":
        run_video_mode(model)
    elif MODE == "folder":
        run_folder_mode(model)
    else:
        raise ValueError("MODE must be 'image', 'webcam', 'video', or 'folder'")

    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
