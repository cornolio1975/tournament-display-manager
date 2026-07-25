import os
import zipfile

out_dir = "out"
zip_filename = "dist.zip"

# Write Hostinger Apache .htaccess inside out directory
htaccess_path = os.path.join(out_dir, ".htaccess")
htaccess_content = """<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Serve display.html directly for /display
  RewriteRule ^display/?$ display.html [L]

  # Clean URLs
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME}.html -f
  RewriteRule ^(.*)$ $1.html [L]

  # SPA Fallback
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
"""

with open(htaccess_path, "w", encoding="utf-8") as f:
    f.write(htaccess_content)

print(f"Added .htaccess to {out_dir}/")

# Zip out folder into dist.zip
count = 0
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, out_dir)
            zipf.write(file_path, arcname)
            count += 1

zip_size_mb = os.path.getsize(zip_filename) / (1024 * 1024)
print(f"SUCCESS: {zip_filename} packaged with {count} files ({zip_size_mb:.2f} MB)!")
