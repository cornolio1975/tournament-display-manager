import os
import shutil
import zipfile

out_dir = "out"
if os.path.exists(out_dir):
    shutil.rmtree(out_dir)
os.makedirs(out_dir, exist_ok=True)

# 1. Copy HTML pages from .next/server/app
app_server_dir = os.path.join(".next", "server", "app")
for file in ["index.html", "display.html", "_not-found.html"]:
    src = os.path.join(app_server_dir, file)
    if os.path.exists(src):
        shutil.copy(src, os.path.join(out_dir, file))

# Create /display/index.html fallback for Hostinger URL subdirectories
display_dir = os.path.join(out_dir, "display")
os.makedirs(display_dir, exist_ok=True)
if os.path.exists(os.path.join(app_server_dir, "display.html")):
    shutil.copy(os.path.join(app_server_dir, "display.html"), os.path.join(display_dir, "index.html"))

# 2. Copy static chunks & assets to _next/static
next_static_out = os.path.join(out_dir, "_next", "static")
os.makedirs(next_static_out, exist_ok=True)
next_static_src = os.path.join(".next", "static")
if os.path.exists(next_static_src):
    shutil.copytree(next_static_src, next_static_out, dirs_exist_ok=True)

# 3. Copy all public assets (logos, video, etc.)
public_dir = "public"
if os.path.exists(public_dir):
    for item in os.listdir(public_dir):
        src_path = os.path.join(public_dir, item)
        dst_path = os.path.join(out_dir, item)
        if os.path.isfile(src_path):
            shutil.copy(src_path, dst_path)
        elif os.path.isdir(src_path):
            shutil.copytree(src_path, dst_path, dirs_exist_ok=True)

# 4. Write Hostinger Apache .htaccess
htaccess_content = """<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Direct routing for /display
  RewriteRule ^display/?$ display.html [L]

  # Clean URLs
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.*)$ $1.html [L]

  # SPA Fallback to index.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
"""
with open(os.path.join(out_dir, ".htaccess"), "w", encoding="utf-8") as f:
    f.write(htaccess_content)

# 5. Compress out directory into dist.zip
zip_filename = "dist.zip"
count = 0
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, out_dir)
            zipf.write(file_path, arcname)
            count += 1

zip_size_mb = os.path.getsize(zip_filename) / (1024 * 1024)
print(f"SUCCESS: {zip_filename} ready for Hostinger deployment ({count} files, {zip_size_mb:.2f} MB)!")
