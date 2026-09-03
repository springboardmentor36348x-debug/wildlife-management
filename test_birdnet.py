"""
test_birdnet.py
Runs bird species identification on a sample audio file using BirdNET.
"""
import os
import sys
import wave
import math
import struct
from datetime import datetime

def ensure_sample_audio(audio_path: str = "sample_audio.wav") -> str:
    """Creates a 3-second sample WAV audio file if none exists."""
    if not os.path.exists(audio_path):
        print(f"Generating a sample audio tone at {audio_path}...")
        sample_rate = 44100
        duration = 3.0
        num_samples = int(sample_rate * duration)

        with wave.open(audio_path, "w") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            for i in range(num_samples):
                # 1500 Hz tone
                value = int(32767.0 * 0.5 * math.sin(2.0 * math.pi * 1500.0 * i / sample_rate))
                data = struct.pack("<h", value)
                wav_file.writeframesraw(data)
    return audio_path

def main():
    print("=" * 60)
    print("Testing BirdNET (Cornell Lab of Ornithology)")
    print("=" * 60)

    try:
        from birdnetlib import Recording
        from birdnetlib.analyzer import Analyzer
    except ImportError as e:
        print(f"ERROR: birdnetlib is not installed in the current environment: {e}")
        print("Run with: .\\venv_birdnet\\Scripts\\python.exe test_birdnet.py")
        sys.exit(1)

    audio_path = ensure_sample_audio("sample_audio.wav")
    print(f"Target sample audio: {audio_path}")

    print("Initializing BirdNET Analyzer...")
    analyzer = Analyzer()
    print("BirdNET Analyzer initialized successfully!")

    print(f"Analyzing {audio_path} (Latitude: 35.4244, Longitude: -120.7463)...")
    recording = Recording(
        analyzer,
        audio_path,
        lat=35.4244,
        lon=-120.7463,
        date=datetime(year=2024, month=5, day=10),
        min_conf=0.1
    )
    recording.analyze()

    print("\n" + "=" * 60)
    print("INFERENCE RESULTS:")
    print("=" * 60)
    print(f"Total Bird Detections: {len(recording.detections)}")
    for i, d in enumerate(recording.detections, start=1):
        print(f"[{i}] Common Name: {d.get('common_name')}")
        print(f"    Scientific Name: {d.get('scientific_name')}")
        print(f"    Confidence: {d.get('confidence'):.4f}")
        print(f"    Time Interval: {d.get('start_time')}s - {d.get('end_time')}s")
    print("=" * 60)
    print("BirdNET test completed successfully!")

if __name__ == "__main__":
    main()
