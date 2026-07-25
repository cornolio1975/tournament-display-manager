import os
import subprocess

video_output = "public/sp_sportdata_promo_20s.mp4"
logo_image = "public/sp_logo.jpg"

# FFmpeg command overlaying the official logo image at top center, with text overlays below
cmd = [
    "ffmpeg", "-y",
    "-f", "lavfi", "-i", "color=c=0x060913:s=1920x1080:d=20",
    "-i", logo_image,
    "-f", "lavfi", "-i", "sine=f=520:d=20",
    "-filter_complex",
    (
        "[1:v]scale=500:-1[logo];"
        "[0:v][logo]overlay=(W-w)/2:120[bglogo];"
        "[bglogo]"
        "drawtext=text='OFFICIAL PORTAL\\: spsportdatasolution.org':fontcolor=0x00F0FF:fontsize=36:x=(w-text_w)/2:y=310:enable='between(t,0,20)',"
        "drawtext=text='PRECISION  .  SPEED  .  RESULTS':fontcolor=0xE11D48:fontsize=46:x=(w-text_w)/2:y=400:enable='between(t,0,20)',"
        "drawtext=text='NEXT-GEN TOURNAMENT DISPLAY MANAGEMENT SYSTEM':fontcolor=white:fontsize=38:x=(w-text_w)/2:y=520:enable='between(t,1,20)',"
        "drawtext=text='REAL-TIME SCORING  |  SPONSOR ROTATION  |  PUBLIC PRESENTATION SCREENS':fontcolor=0x38BDF8:fontsize=30:x=(w-text_w)/2:y=620:enable='between(t,3,20)',"
        "drawtext=text='POWERING CHAMPIONSHIP ARENAS WORLDWIDE':fontcolor=0x00F0FF:fontsize=34:x=(w-text_w)/2:y=730:enable='between(t,5,20)',"
        "drawtext=text='Visit spsportdatasolution.org for event info':fontcolor=white:fontsize=32:x=(w-text_w)/2:y=860:enable='between(t,7,20)'[v]"
    ),
    "-map", "[v]",
    "-map", "2:a",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "128k",
    video_output
]

print("Overlaying official logo into 20-second promo video...")
res = subprocess.run(cmd, capture_output=True, text=True)
if res.returncode == 0:
    print(f"SUCCESS: Premium logo promo video created at {video_output}")
else:
    print(f"ERROR: {res.stderr}")
