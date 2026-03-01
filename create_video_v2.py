#!/usr/bin/env python3
"""
STAR LUX Promotional Video V2 Creator
Creates a 25-second cinematic promotional video focusing on infrastructure
"""

import subprocess
import os
from pathlib import Path

# Configuration
PROMO_DIR = Path("/home/ubuntu/star_lux_promo_v2")
OUTPUT_VIDEO = PROMO_DIR / "starlux_promo_v2_final.mp4"
VOICEOVER = PROMO_DIR / "voiceover_v2.wav"

# Scene configuration (image, duration in seconds) - Different timing from V1
SCENES = [
    ("scene1_foundation.png", 6),   # 0-5 seconds - Slow build
    ("scene2_network.png", 6),      # 6-11 seconds - Network
    ("scene3_ecosystem.png", 6),    # 12-17 seconds - Ecosystem
    ("scene4_stability.png", 4),    # 18-22 seconds - Stability
    ("scene5_closing.png", 3),      # 23-25 seconds - Closing
]

# Total duration: 25 seconds

def create_video_segment(image_path: Path, duration: float, output_path: Path, index: int):
    """Create a video segment from an image with slow, elegant Ken Burns effect"""
    
    # Slower, more elegant motion for V2
    if index == 0:
        # Very slow zoom in for foundation
        filter_complex = f"zoompan=z='min(zoom+0.0004,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(duration*30)}:s=1920x1080:fps=30"
    elif index == 4:
        # Static for closing
        filter_complex = f"scale=1920:1080,setsar=1"
    else:
        # Very slow pan for other scenes
        filter_complex = f"zoompan=z='1.05':x='iw/2-(iw/zoom/2)+sin(on/100)*20':y='ih/2-(ih/zoom/2)':d={int(duration*30)}:s=1920x1080:fps=30"
    
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", str(image_path),
        "-vf", filter_complex,
        "-t", str(duration),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        str(output_path)
    ]
    
    print(f"Creating segment {index + 1}: {image_path.name} ({duration}s)")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    return True

def concat_videos(segment_paths: list, output_path: Path):
    """Concatenate video segments"""
    
    # Create concat file
    concat_file = PROMO_DIR / "concat_list.txt"
    with open(concat_file, "w") as f:
        for path in segment_paths:
            f.write(f"file '{path}'\n")
    
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", str(concat_file),
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        str(output_path)
    ]
    
    print("Concatenating video segments...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    return True

def add_audio(video_path: Path, audio_path: Path, output_path: Path):
    """Add voiceover audio to video"""
    
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-i", str(audio_path),
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-map", "0:v:0",
        "-map", "1:a:0",
        "-shortest",
        str(output_path)
    ]
    
    print("Adding voiceover audio...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
        return False
    return True

def main():
    print("=" * 50)
    print("STAR LUX Promotional Video V2 Creator")
    print("Focus: Infrastructure & Integrated System")
    print("=" * 50)
    
    # Create video segments
    segment_paths = []
    for i, (image_name, duration) in enumerate(SCENES):
        image_path = PROMO_DIR / image_name
        segment_path = PROMO_DIR / f"segment_{i+1}.mp4"
        
        if not image_path.exists():
            print(f"Error: Image not found: {image_path}")
            return
        
        if create_video_segment(image_path, duration, segment_path, i):
            segment_paths.append(segment_path)
        else:
            print(f"Failed to create segment {i+1}")
            return
    
    # Concatenate segments
    concat_video = PROMO_DIR / "video_no_audio.mp4"
    if not concat_videos(segment_paths, concat_video):
        print("Failed to concatenate videos")
        return
    
    # Add audio
    if not add_audio(concat_video, VOICEOVER, OUTPUT_VIDEO):
        print("Failed to add audio")
        return
    
    # Cleanup temporary files
    print("Cleaning up temporary files...")
    for segment in segment_paths:
        if segment.exists():
            segment.unlink()
    if concat_video.exists():
        concat_video.unlink()
    concat_file = PROMO_DIR / "concat_list.txt"
    if concat_file.exists():
        concat_file.unlink()
    
    # Get final video info
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", 
         "-of", "default=noprint_wrappers=1:nokey=1", str(OUTPUT_VIDEO)],
        capture_output=True, text=True
    )
    duration = float(result.stdout.strip()) if result.stdout.strip() else 0
    
    print("=" * 50)
    print(f"✅ Video V2 created successfully!")
    print(f"📁 Output: {OUTPUT_VIDEO}")
    print(f"⏱️ Duration: {duration:.1f} seconds")
    print("=" * 50)

if __name__ == "__main__":
    main()
