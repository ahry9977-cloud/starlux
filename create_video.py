#!/usr/bin/env python3
"""
STAR LUX Promotional Video Creator
Creates a 25-second cinematic promotional video from images and voiceover
"""

import subprocess
import os
from pathlib import Path

# Configuration
PROMO_DIR = Path("/home/ubuntu/star_lux_promo")
OUTPUT_VIDEO = PROMO_DIR / "starlux_promo_final.mp4"
VOICEOVER = PROMO_DIR / "voiceover.wav"

# Scene configuration (image, duration in seconds)
SCENES = [
    ("scene1_identity.png", 4),    # 0-4 seconds
    ("scene2_quality.png", 6),     # 5-10 seconds
    ("scene3_benefits.png", 7),    # 11-17 seconds
    ("scene4_security.png", 5),    # 18-22 seconds
    ("scene5_finale.png", 3),      # 23-25 seconds
]

# Total duration: 25 seconds

def create_video_segment(image_path: Path, duration: float, output_path: Path, index: int):
    """Create a video segment from an image with Ken Burns effect"""
    
    # Ken Burns effect parameters (subtle zoom)
    if index % 2 == 0:
        # Zoom in effect
        filter_complex = f"zoompan=z='min(zoom+0.0008,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(duration*30)}:s=1920x1080:fps=30"
    else:
        # Zoom out effect
        filter_complex = f"zoompan=z='if(lte(zoom,1.0),1.15,max(1.0,zoom-0.0008))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(duration*30)}:s=1920x1080:fps=30"
    
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
    """Concatenate video segments with crossfade transitions"""
    
    # Create concat file
    concat_file = PROMO_DIR / "concat_list.txt"
    with open(concat_file, "w") as f:
        for path in segment_paths:
            f.write(f"file '{path}'\n")
    
    # Simple concat without transitions first
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
    print("STAR LUX Promotional Video Creator")
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
    print(f"✅ Video created successfully!")
    print(f"📁 Output: {OUTPUT_VIDEO}")
    print(f"⏱️ Duration: {duration:.1f} seconds")
    print("=" * 50)

if __name__ == "__main__":
    main()
