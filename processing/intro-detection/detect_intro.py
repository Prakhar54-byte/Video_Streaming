import sys
import json
import argparse
import os
import subprocess

def get_video_duration(video_path):
    """Get video duration using ffprobe"""
    try:
        result = subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
             '-of', 'default=noprint_wrappers=1:nokey=1', video_path],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0 and result.stdout.strip():
            return float(result.stdout.strip())
    except Exception as e:
        print(f"Error getting duration: {e}", file=sys.stderr)
    return None

def predict_intro_timings(video_path):
    """
    Predict intro start and end times based on video duration.
    
    In a real production scenario with ML models, this would:
    1. Extract audio/frames from the video.
    2. Preprocess the data (spectrograms, frame resizing).
    3. Pass it through a trained CNN/RNN model.
    4. Return the predicted timestamps.
    
    For now, we use duration-aware heuristics:
    - Short videos (< 60s): No intro detection (too short)
    - Medium videos (1-5 min): Intro typically 5-15 seconds at start
    - Long videos (> 5 min): Intro typically 10-30 seconds
    """
    
    try:
        # Check if file exists
        if not os.path.exists(video_path):
            return {"error": "File not found", "introStartTime": 0, "introEndTime": 0}
        
        # Get actual video duration
        duration = get_video_duration(video_path)
        
        if duration is None:
            return {
                "error": "Could not determine video duration",
                "introStartTime": 0,
                "introEndTime": 0,
                "confidence": 0.0,
                "model_version": "v1.1.0-heuristic"
            }
        
        # Duration-aware intro detection heuristics
        if duration < 30:
            # Very short video - no intro
            return {
                "introStartTime": 0,
                "introEndTime": 0,
                "confidence": 0.9,
                "duration": duration,
                "reason": "Video too short for intro",
                "model_version": "v1.1.0-heuristic"
            }
        elif duration < 60:
            # Short video (30-60s) - minimal intro if any
            intro_end = min(5, duration * 0.1)  # Max 5 seconds or 10% of video
            return {
                "introStartTime": 0,
                "introEndTime": round(intro_end, 2),
                "confidence": 0.7,
                "duration": duration,
                "model_version": "v1.1.0-heuristic"
            }
        elif duration < 300:
            # Medium video (1-5 min) - typical intro 5-15 seconds
            intro_end = min(15, duration * 0.1)  # Max 15 seconds or 10% of video
            return {
                "introStartTime": 0,
                "introEndTime": round(intro_end, 2),
                "confidence": 0.75,
                "duration": duration,
                "model_version": "v1.1.0-heuristic"
            }
        else:
            # Long video (> 5 min) - intro typically 10-30 seconds
            intro_end = min(30, duration * 0.05)  # Max 30 seconds or 5% of video
            return {
                "introStartTime": 0,
                "introEndTime": round(intro_end, 2),
                "confidence": 0.8,
                "duration": duration,
                "model_version": "v1.1.0-heuristic"
            }
        
    except Exception as e:
        return {
            "error": str(e),
            "introStartTime": 0,
            "introEndTime": 0,
            "confidence": 0.0,
            "model_version": "v1.1.0-heuristic"
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Predict video intro timings using ML.')
    parser.add_argument('video_path', type=str, help='Path to the video file')
    
    args = parser.parse_args()
    
    result = predict_intro_timings(args.video_path)
    
    # Output JSON to stdout so Node.js can parse it
    print(json.dumps(result))
