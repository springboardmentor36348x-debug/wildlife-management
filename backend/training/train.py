"""
Step 3 of the training pipeline: fine-tune YOLOv8 on the converted
Snapshot Serengeti bounding-box dataset.

This is the step that needs a GPU and real time (hours, likely 1-2+ days
for the full bbox subset depending on epochs/hardware). Run this on:
  - Google Colab Pro (recommended for a student project - cheap, easy)
  - A cloud GPU instance (AWS/GCP/Azure/Lambda/RunPod)
  - A local machine with an NVIDIA GPU

It will NOT run at a usable speed on CPU-only hardware for a dataset this
size - don't try this on the same Windows laptop we set the backend up on.

Usage:
    python train.py --data dataset/yolo/data.yaml --epochs 100 --model yolov8s.pt

Output:
    runs/detect/train/weights/best.pt   <- this is the file you deploy
"""
import argparse

from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser(description="Fine-tune YOLOv8 on the wildlife dataset.")
    parser.add_argument("--data", default="dataset/yolo/data.yaml", help="Path to data.yaml from convert_to_yolo.py")
    parser.add_argument("--model", default="yolov8s.pt", help="Base checkpoint to fine-tune from (n=fastest, s/m/l=more accurate)")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16, help="Reduce if you hit GPU out-of-memory errors")
    parser.add_argument("--device", default=0, help="GPU index, or 'cpu' (not recommended for this dataset size)")
    parser.add_argument("--patience", type=int, default=20, help="Early stopping: stop if val metrics don't improve for N epochs")
    args = parser.parse_args()

    print(f"Loading base model: {args.model}")
    model = YOLO(args.model)

    print(f"Starting training on {args.data} for up to {args.epochs} epochs ...")
    results = model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        patience=args.patience,
        project="runs/detect",
        name="wildlife_yolov8",
        exist_ok=True,
    )

    print("\nTraining complete.")
    print("Best weights saved to: runs/detect/wildlife_yolov8/weights/best.pt")
    print("\nTo evaluate on the validation set:")
    print("    yolo val model=runs/detect/wildlife_yolov8/weights/best.pt data=" + args.data)
    print("\nTo deploy: copy best.pt into backend/app/ml_models/ and set")
    print("YOLO_MODEL_PATH in backend/.env to point at it.")


if __name__ == "__main__":
    main()
