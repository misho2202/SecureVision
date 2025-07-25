from roboflow import Roboflow
import cv2
import time
import glob
import os
from dotenv import load_dotenv
# Load .env file
load_dotenv()

# ─── CONFIG ─────────────────────────────────────────────────────────────────────
MODE             = "webcam"  # ← options: "image", "webcam", "video", "folder"
API_KEY          = os.getenv('ROBOFLOW_API_KEY')
PROJECT_SLUG     = os.getenv('ROBOFLOW_PROJECT_SLUG')
VERSION_NUMBER   = 1
IMAGE_PATH       = r"C:\Users\miavetisyan\Desktop\3ARLBD4V3S7X.jpg"
VIDEO_PATH       = r"C:\Users\miavetisyan\Desktop\video_2025-07-14_14-36-51.mp4"
IMAGE_FOLDER_PATH  = r"C:\Users\miavetisyan\Desktop\images"
OUTPUT_FOLDER_PATH = r"C:\Users\miavetisyan\Desktop\output_images"
SAVE_RESULTS     = True
BLUR_DETECTIONS  = True
# ────────────────────────────────────────────────────────────────────────────────


def load_model(api_key, slug, version):
    rf = Roboflow(api_key=api_key)
    project = rf.project(slug)
    return project.version(version).model


def blur_region(img, x, y, w, h):
    roi = img[y:y+h, x:x+w]
    blurred_roi = cv2.GaussianBlur(roi, (25, 25), 30)
    img[y:y+h, x:x+w] = blurred_roi
    return img


def draw_or_blur_predictions(img, preds, blur=False):
    for p in preds["predictions"]:
        x, y = int(p["x"]), int(p["y"])
        w, h = int(p["width"]), int(p["height"])
        cls  = p["class"]
        conf = p["confidence"]

        tl_x = max(x - w // 2, 0)
        tl_y = max(y - h // 2, 0)
        br_x = x + w // 2
        br_y = y + h // 2

        if blur:
            img = blur_region(img, tl_x, tl_y, w, h)
        else:
            cv2.rectangle(img, (tl_x, tl_y), (br_x, br_y), (0, 255, 0), 2)
            cv2.putText(
                img,
                f"{cls} {conf:.2f}",
                (tl_x, tl_y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )


def predict_and_process(model, frame, blur=True):
    # Save to temporary file because Roboflow API only takes path
    tmp_path = "temp_frame.jpg"
    cv2.imwrite(tmp_path, frame)
    result = model.predict(tmp_path).json()
    draw_or_blur_predictions(frame, result, blur=blur)
    return frame


def run_image_mode(model):
    img = cv2.imread(IMAGE_PATH)
    if img is None:
        raise FileNotFoundError(f"Image not found: {IMAGE_PATH}")
    output = predict_and_process(model, img)
    if SAVE_RESULTS:
        cv2.imwrite("output_image.jpg", output)
    print("[✓] Processed image saved to output_image.jpg")


import datetime

def run_webcam_mode(model):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Webcam failed to open.")

    # Get resolution and FPS
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0 or fps != fps:  # Handles NaN or 0
        print("[WARNING] Webcam FPS not available. Defaulting to 10 FPS.")
        fps = 10

    out = None
    output_filename = None
    if SAVE_RESULTS:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        output_filename = f"output_webcam_{timestamp}.mp4"
        out = cv2.VideoWriter(
            output_filename,
            cv2.VideoWriter_fourcc(*'mp4v'),
            fps,
            (width, height)
        )

    print("[INFO] Recording webcam... Press 'q' to quit.")
    frame_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            print("[WARNING] Frame capture failed.")
            break

        start = time.time()
        processed = predict_and_process(model, frame.copy(), blur=BLUR_DETECTIONS)
        fps_calc = 1 / (time.time() - start + 1e-6)  # Add small value to avoid division by zero

        # Optional overlay
        cv2.putText(processed, f"FPS: {fps_calc:.2f}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        # Show preview (optional)
        cv2.imshow("Webcam - Press q to quit", processed)

        # Save frame
        if SAVE_RESULTS and out:
            out.write(processed)
            frame_count += 1

        # Break on keypress
        if cv2.waitKey(10) & 0xFF == ord('q'):
            print("[INFO] Quit key pressed.")
            break

    cap.release()
    if out:
        out.release()

    if SAVE_RESULTS:
        if frame_count > 0:
            print(f"[✓] {frame_count} frames saved to {output_filename}")
        else:
            print("[WARNING] No frames saved. Output video may be empty.")

    cv2.destroyAllWindows()


def run_video_mode(model):
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        raise FileNotFoundError(f"Video not found: {VIDEO_PATH}")

    width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps    = cap.get(cv2.CAP_PROP_FPS)

    out = None
    if SAVE_RESULTS:
        out = cv2.VideoWriter(
            "output_video.mp4",
            cv2.VideoWriter_fourcc(*'mp4v'),
            fps,
            (width, height)
        )

    print("[INFO] Processing video...")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        processed = predict_and_process(model, frame.copy(), blur=BLUR_DETECTIONS)

        # 👇 Removed display
        # cv2.imshow("Video", processed)

        if SAVE_RESULTS and out:
            out.write(processed)

        # 👇 Optional: remove keypress check since there's no display
        # if cv2.waitKey(1) & 0xFF == ord('q'):
        #     break

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
    model = load_model(API_KEY, PROJECT_SLUG, VERSION_NUMBER)

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
