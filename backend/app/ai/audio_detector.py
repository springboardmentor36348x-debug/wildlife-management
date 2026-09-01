from transformers import pipeline

audio_classifier = pipeline(
    "audio-classification",
    model="MIT/ast-finetuned-audioset-10-10-0.4593"
)

def detect_audio_sound(audio_path: str):
    results = audio_classifier(
        audio_path,
        top_k=5
    )

    best = results[0]

    return {
        "species": best["label"],
        "confidence": round(best["score"] * 100, 2),
        "predictions": [
            {
                "species": item["label"],
                "confidence": round(item["score"] * 100, 2)
            }
            for item in results
        ]
    }