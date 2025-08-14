#!/bin/bash

# Background process to continuously clean extended attributes during build

APP_PATH="$1"
PID_FILE="/tmp/xattr-cleaner.pid"

# Store our PID
echo $$ > "$PID_FILE"

echo "🧹 Starting continuous xattr cleaning for: $APP_PATH"

while [ -f "$PID_FILE" ]; do
    if [ -d "$APP_PATH" ]; then
        # Remove problematic extended attributes
        xattr -cr "$APP_PATH" 2>/dev/null || true
        find "$APP_PATH" -type f -exec xattr -d com.apple.FinderInfo {} \; 2>/dev/null || true
        find "$APP_PATH" -type f -exec xattr -d com.apple.fileprovider.fpfs#P {} \; 2>/dev/null || true
        find "$APP_PATH" -type f -exec xattr -d com.apple.provenance {} \; 2>/dev/null || true
    fi
    sleep 0.5  # Clean every 500ms
done

echo "🛑 Stopped xattr cleaning"
