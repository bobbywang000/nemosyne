#!/bin/bash

# open database, wait up to 20 seconds for any activity to end and create a backup file
sqlite3 "$1" <<EOF
.timeout 20000
.backup "${OUTPUT_FOLDER:-.}/$1-$(date -u +"%Y-%m-%dT%H_%M_%SZ").bak"
EOF
