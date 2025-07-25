# from ultralytics import YOLO
#
# model = YOLO("yolov8n.pt")
#
# model.train(
#     data="data.yaml",
#     epochs=50,
#     batch=8,
#     imgsz=640
# )

import torch
from ultralytics import YOLO


def check_gpu():
    print("=" * 50)
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        print(f"✅ GPU Available: {gpu_name}")
        print(f"✅ CUDA Version: {torch.version.cuda}")
        return "0"  # First GPU
    else:
        print("❌ No GPU detected. Using CPU.")
        print("\n👉 To enable GPU, install PyTorch with CUDA:")
        print("   pip uninstall torch torchvision torchaudio")
        print("   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121")
        print("   (Replace cu121 with the CUDA version your GPU supports)")
        return "cpu"


def train_model():
    device = check_gpu()

    # Load YOLO (pre-trained weights on COCO)
    model = YOLO("yolov8n.pt")

    # Train on your dataset
    model.train(
        data=r"data.yaml",
        epochs=50,
        batch=16,
        imgsz=640,
        device=device
    )

    print("=" * 50)
    print(f"✅ Training finished! Model saved to runs/detect/train/weights/best.pt")


def predict_image(image_path):
    device = check_gpu()

    model = YOLO(r"runs/detect/train/weights/best.pt")
    results = model.predict(image_path, device=device, save=True)
    print(f"✅ Prediction done! Saved annotated image(s) in 'runs/detect/predict' folder.")


if __name__ == "__main__":
    # Example: train, then test on one image
    train_model()
    # predict_image("test_image.jpg")