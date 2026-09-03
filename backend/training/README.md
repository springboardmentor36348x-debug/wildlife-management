# Training a Wildlife-Specific YOLOv8 Model

> **Read this first: do you actually need this?**
>
> If your goal is *general/global* species identification, **you probably
> don't need to train anything.** The app now uses [SpeciesNet](https://github.com/google/cameratrapai)
> (Google) + [MegaDetector](https://github.com/microsoft/MegaDetector)
> (Microsoft) as the primary Image Analysis Engine — a pretrained pipeline
> covering **2000+ species worldwide**, already used in production by the
> Wildlife Insights platform (Google/WWF/Smithsonian/Wildlife Conservation
> Society). Just `pip install speciesnet megadetector` (already in
> `requirements.txt`) and it works immediately — no GPU training, no
> multi-day Colab run, no dataset download.
>
> For audio, **BirdNET** (via `birdnetlib`) now covers 6,522 bird species
> globally the same way — also pretrained, also zero training required.
> There is no equivalent mature global model for non-bird animal sounds yet
> (mammal calls, frog calls, insect sounds) - that gap is real and
> unresolved industry-wide, not something this pipeline was meant to fix.
>
> **This training pipeline is still useful for one specific case:** if you
> need a species that SpeciesNet's ~2000 classes don't cover, or you want a
> model specialized for one very specific region/site where local
> fine-tuning outperforms a general global model. That's a narrower,
> optional, later-stage optimization — not a prerequisite for the app to
> identify wildlife species.

This trains YOLOv8 on the **Snapshot Serengeti bounding-box subset** so a
*regional* detector can recognize African savanna species (lion, wildebeest,
zebra, etc.) beyond generic COCO classes like "cow" or "sheep". Note this
dataset is **African savanna wildlife only** — it will not help identify
species from other regions (e.g. Indian wildlife); it's included here as a
worked example of the fine-tuning pipeline, swap in a different
bounding-box-labeled dataset for a different region if you go this route.

## Why not the full 7.1M-image dataset?

The full Snapshot Serengeti release is enormous - 11 seasons, each
242GB-636GB, several terabytes total - and most of those images only have a
whole-image species *tag*, not a bounding box, so they can't train an object
detector directly. LILA (the host) separately provides **~150,000 hand-drawn
bounding boxes across ~78,000 images** specifically for detection training.
That subset is what this pipeline uses - it's the same subset used in
published research on this dataset, not a shortcut.

## Where to run this

**Not on the laptop you set the backend up on.** Training a detector on tens
of thousands of images needs a GPU and will be unusably slow (or literally
run for weeks) on CPU. Options, cheapest/easiest first:

1. **Google Colab** (free tier has usage limits; Colab Pro ~$10/month gives
   longer runtimes and better GPUs) - recommended for a student project.
2. A cloud GPU instance (AWS/GCP/Azure/Lambda Labs/RunPod) - pay per hour.
3. A local machine with an NVIDIA GPU, if you have access to one.

## Step-by-step

### 1. Get the bounding-box annotation URL
Go to https://lila.science/datasets/snapshot-serengeti, find the
**"Bounding boxes"** link, and copy its URL (LILA occasionally renames
files, so grab the current link rather than reusing an old one). Also grab
the **"Recommended train/val splits"** link if you want to use LILA's
official location-based split.

### 2. On your GPU environment (e.g. a Colab notebook), install dependencies
```bash
pip install -r requirements.txt
```

### 3. Download the bbox-annotated subset
```bash
python download_dataset.py --bbox-json-url "<the URL from step 1>" --output-dir dataset/raw
```
This downloads the annotation file plus **only the ~78,000 images that have
boxes** (not the full dataset). Still expect several GB and a while to
download depending on your connection. For a first test run before
committing to the full download:
```bash
python download_dataset.py --bbox-json-url "<URL>" --output-dir dataset/raw --limit 500
```

### 4. Convert to YOLO format
```bash
python convert_to_yolo.py --raw-dir dataset/raw --output-dir dataset/yolo
```
This writes `dataset/yolo/images/{train,val}`, `dataset/yolo/labels/{train,val}`,
and `dataset/yolo/data.yaml`. By default it splits 85/15 by camera location
(not randomly by image) to avoid near-duplicate scenes leaking between train
and val. Pass `--use-lila-split <path>` to use LILA's official split instead.

### 5. Train
```bash
python train.py --data dataset/yolo/data.yaml --epochs 100 --model yolov8s.pt
```
- `--model yolov8n.pt` = fastest, least accurate. `yolov8s.pt` is a
  reasonable default. `yolov8m.pt`/`yolov8l.pt` = slower, more accurate, need
  more GPU memory.
- Expect real training time in the **hours to low-single-digit days** range
  depending on GPU and epoch count - this is a genuinely long-running job,
  not something to babysit interactively. Kick it off and check back.
- Lower `--batch` if you hit a GPU out-of-memory error.

### 6. Deploy the trained model into the app
Once training finishes, the best checkpoint is at:
```
runs/detect/wildlife_yolov8/weights/best.pt
```
Copy it into the backend:
```bash
cp runs/detect/wildlife_yolov8/weights/best.pt ../app/ml_models/wildlife_yolov8_best.pt
```
Then in `backend/.env`, set:
```
YOLO_MODEL_PATH=app/ml_models/wildlife_yolov8_best.pt
```
Restart the backend (`uvicorn app.main:app --reload`). This becomes tier 2
in the fallback chain (see `app/services/image_analysis.py`) - it's only
used if SpeciesNet doesn't classify something, or isn't installed.

## Sanity-checking before committing to a full run

Before spending hours/days on a full training run, do a smoke test:
1. `--limit 500` on the download step
2. Run the conversion and training end-to-end on that tiny subset for just
   `--epochs 5`
3. Confirm `best.pt` gets produced and loads correctly in the app

This catches format/config mistakes in minutes instead of after a full
multi-hour run.
