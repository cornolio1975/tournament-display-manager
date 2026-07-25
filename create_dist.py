import os
import zipfile

out_dir = "out"
zip_filename = "dist.zip"

if not os.path.exists(out_dir):
    print(f"ERROR: {out_dir} directory does not exist. Run build first.")
    exit(1)

print(f"Packaging {out_dir} into {zip_filename}...")
count = 0
with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(out_dir):
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, out_dir)
            zipf.write(file_path, arcname)
            count += 1

print(f"SUCCESS: {zip_filename} created with {count} files!")
