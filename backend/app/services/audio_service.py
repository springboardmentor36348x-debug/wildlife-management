"""
Bioacoustic Recognition Engine (Milestone 3, Feature A).

Runs a PRETRAINED TensorFlow Hub YAMNet model (inference only - no
training pipeline) over an uploaded wildlife audio recording and returns
the animal-relevant AudioSet event class(es) it detects.

Why YAMNet: it is Google's pretrained, general-purpose audio event
classifier trained on the AudioSet ontology (521 classes). It already
covers everything the spec's "Audio Features" list asks for - bird
calls, mammal vocalizations, amphibian calls, insect sounds - as a set
of AudioSet class labels, with zero additional training required. Model
card: https://tfhub.dev/google/yamnet/1

IMPORTANT - SANDBOXED ENVIRONMENT NETWORK LIMITATION
------------------------------------------------------
YAMNet's weights are NOT bundled with the `tensorflow_hub` pip package -
`tensorflow_hub.load(...)` downloads them on first use from
`https://tfhub.dev/google/yamnet/1` (which redirects to a Google Cloud
Storage bucket). The development sandbox this service was originally
built and tested in only allows network egress to a fixed allowlist of
package registries (PyPI, npm, GitHub, crates.io, apt) - it does NOT
allow `tfhub.dev` or `storage.googleapis.com`. A direct test of this
exact code in that sandbox reproduced:

    tensorflow_hub.load('https://tfhub.dev/google/yamnet/1')
    -> urllib.error.HTTPError: HTTP Error 403: Forbidden

This is a network policy limitation of that sandbox, not a bug in this
code. On a normal machine (laptop, CI runner, cloud VM) with unrestricted
outbound HTTPS, this same code downloads the ~15MB YAMNet SavedModel once
(cached under $TFHUB_CACHE_DIR, default ~/.cache/tfhub_modules/) and every
call after that is a local inference call with the model held in memory.
See MILESTONE3_NOTES.md for the exact reproduction and the plumbing test
we ran instead.
"""
import csv
import io
import threading

import librosa
import numpy as np

YAMNET_HANDLE = "https://tfhub.dev/google/yamnet/1"
YAMNET_SAMPLE_RATE = 16000  # YAMNet requires mono 16kHz waveform input.

# Prediction below this score is treated as "not really there" rather than
# forced into the top slot - camera-trap-adjacent audio sensors pick up a
# lot of wind/rain/engine/silence, and YAMNet will still assign *some*
# probability to an animal class even for pure noise. 0.15 is the low end
# of a reasonable confidence floor for a 521-way classifier (uniform
# chance is ~0.002), so this discards low-confidence noise-driven guesses
# while still surfacing genuine-but-quiet animal sounds.
CONFIDENCE_THRESHOLD = 0.15

# AudioSet ontology class names (from the YAMNet class map,
# https://github.com/tensorflow/models/blob/master/research/audioset/yamnet/yamnet_class_map.csv)
# that represent real animal sounds, mapped to the spec's "Audio Features"
# categories: Bird Calls, Mammal Vocalizations, Amphibian Calls, Insect
# Sounds. Hardcoded here (rather than read from the downloaded class map
# file) so the filtering logic is inspectable without a live model load.
ANIMAL_CLASS_CATEGORY: dict[str, str] = {
    # Bird Calls
    "Bird": "bird_call",
    "Bird vocalization, bird call, bird song": "bird_call",
    "Chirp, tweet": "bird_call",
    "Squawk": "bird_call",
    "Pigeon, dove": "bird_call",
    "Crow": "bird_call",
    "Owl": "bird_call",
    "Gull, seagull": "bird_call",
    "Bird flight, flapping wings": "bird_call",
    # Mammal Vocalizations
    "Roaring cats (lions, tigers)": "mammal_vocalization",
    "Roar": "mammal_vocalization",
    "Growling": "mammal_vocalization",
    "Bark": "mammal_vocalization",
    "Howl": "mammal_vocalization",
    "Bay": "mammal_vocalization",
    "Whimper (dog)": "mammal_vocalization",
    "Yip": "mammal_vocalization",
    "Cattle, bovinae": "mammal_vocalization",
    "Moo": "mammal_vocalization",
    "Elephant": "mammal_vocalization",
    "Pig": "mammal_vocalization",
    "Oink": "mammal_vocalization",
    "Goat": "mammal_vocalization",
    "Bleat": "mammal_vocalization",
    "Sheep": "mammal_vocalization",
    "Squeal": "mammal_vocalization",
    "Snort": "mammal_vocalization",
    "Whinny": "mammal_vocalization",
    "Neigh, whinny": "mammal_vocalization",
    "Livestock, farm animals, working animals": "mammal_vocalization",
    "Wild animals": "mammal_vocalization",
    "Rodents, rats, mice": "mammal_vocalization",
    "Squeak": "mammal_vocalization",
    "Purr": "mammal_vocalization",
    "Meow": "mammal_vocalization",
    "Cat": "mammal_vocalization",
    "Domestic animals, pets": "mammal_vocalization",
    "Canidae, dogs, wolves": "mammal_vocalization",
    "Snake": "mammal_vocalization",
    "Hiss": "mammal_vocalization",
    "Rattle": "mammal_vocalization",
    # Amphibian Calls
    "Frog": "amphibian_call",
    "Croak": "amphibian_call",
    # Insect Sounds
    "Insect": "insect_sound",
    "Cricket": "insect_sound",
    "Mosquito": "insect_sound",
    "Fly, housefly": "insect_sound",
    "Buzz": "insect_sound",
    "Bee, wasp, etc.": "insect_sound",
}

_model = None
_model_lock = threading.Lock()
_model_load_error: Exception | None = None


def _get_model():
    """
    Lazily loads (and caches) the pretrained YAMNet model, exactly like
    Milestone 2's vision_service._get_model() pattern. If the download is
    blocked (see module docstring), the resulting exception is cached and
    re-raised on every call rather than re-attempting the network call
    each time - avoids hammering a blocked endpoint on every request.

    `tensorflow_hub` (and therefore TensorFlow itself) is imported here,
    inside the function, rather than at module top. This is deliberate:
    this backend also runs a PyTorch model (Milestone 2's YOLOv8, see
    vision_service.py) in the same process, and on this deployment's CPU
    build, loading TensorFlow's native libs before PyTorch/Triton has run
    its first inference reliably segfaults the worker process (reproduced
    directly - see MILESTONE3_NOTES.md for the exact repro and stack
    trace). Keeping the TensorFlow import lazy - combined with a YOLO
    warm-up call during app startup, in main.py - guarantees YOLO always
    gets its first inference in before TensorFlow ever touches the
    process, which avoids the crash entirely.
    """
    global _model, _model_load_error
    if _model is not None:
        return _model
    if _model_load_error is not None:
        raise _model_load_error

    with _model_lock:
        if _model is None and _model_load_error is None:
            try:
                import tensorflow_hub as hub  # noqa: PLC0415 - intentionally lazy, see docstring
                _model = hub.load(YAMNET_HANDLE)
            except Exception as exc:  # noqa: BLE001 - surfaced to the caller as-is
                _model_load_error = exc
                raise
    return _model


def classify_animal_sound(file_path: str) -> dict:
    """
    Runs YAMNet inference on the audio file at `file_path` and returns:
        {
          "label": str | None,       # top animal-relevant category, or None
          "confidence": float | None,
          "all_matches": [           # top 3-5 animal-relevant classes
            {"label": str, "raw_class": str, "confidence": float}, ...
          ],
        }

    Raises RuntimeError (wrapping the underlying network/model error) if
    the YAMNet model cannot be loaded - callers should turn this into a
    clear 5xx with the real error message rather than silently returning
    fabricated results. This function does not fabricate output under any
    circumstances.
    """
    # librosa.load resamples to YAMNET_SAMPLE_RATE and downmixes to mono
    # regardless of the source file's native rate/channel count.
    waveform, _sr = librosa.load(file_path, sr=YAMNET_SAMPLE_RATE, mono=True)
    waveform = waveform.astype(np.float32)

    try:
        model = _get_model()
    except Exception as exc:
        raise RuntimeError(
            f"YAMNet model could not be loaded (pretrained weights fetch failed): {exc}"
        ) from exc

    scores, _embeddings, _spectrogram = model(waveform)
    mean_scores = scores.numpy().mean(axis=0)  # average over time frames

    class_names = _load_class_names(model)

    animal_matches: list[dict] = []
    for idx, score in enumerate(mean_scores):
        raw_class = class_names[idx]
        category = ANIMAL_CLASS_CATEGORY.get(raw_class)
        if category is None:
            continue  # not an animal-relevant AudioSet class - skip
        if float(score) < CONFIDENCE_THRESHOLD:
            continue  # environmental-noise filtering: discard low-confidence guesses
        animal_matches.append(
            {"label": category, "raw_class": raw_class, "confidence": round(float(score), 4)}
        )

    animal_matches.sort(key=lambda m: m["confidence"], reverse=True)
    top = animal_matches[0] if animal_matches else None

    return {
        "label": top["label"] if top else None,
        "confidence": top["confidence"] if top else None,
        "all_matches": animal_matches[:5],
    }


def _load_class_names(model) -> list[str]:
    """Reads YAMNet's bundled class-map CSV (AudioSet display_name column, index-ordered)."""
    class_map_path = model.class_map_path().numpy().decode("utf-8")
    with open(class_map_path) as f:
        reader = csv.reader(io.StringIO(f.read()))
        next(reader)  # header: index,mid,display_name
        return [row[2] for row in reader]
