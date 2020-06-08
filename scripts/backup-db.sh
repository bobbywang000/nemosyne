#!/bin/bash

# open database, wait up to 20 seconds for any activity to end and create a backup file
sqlite3 "$1" <<EOF
.timeout 20000
.backup "${OUTPUT_FOLDER:-.}/$(date)-$1.bak"
EOF
