#!/bin/bash

# Script to upload CSV files to S3
# Reads configuration from environment variables or .env file
# Usage: ./upload-to-s3.sh [--dry-run]

set -e

# Parse command line arguments
DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
    DRY_RUN=true
    echo "🔍 Running in DRY-RUN mode (no actual upload will occur)"
    echo ""
fi

# Load .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration from environment variables with defaults
S3_BUCKET="${S3_BUCKET:-schemas.ably.com}"
S3_PREFIX="${S3_PREFIX:-csv/agents}"
AWS_PROFILE="${AWS_PROFILE:-default}"

echo "📤 Uploading CSV files to S3..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   brew install awscli  # macOS"
    echo "   apt-get install awscli  # Ubuntu/Debian"
    exit 1
fi

# Check if data/agents folder exists
if [ ! -d "data/agents" ]; then
    echo "❌ data/agents folder not found."
    echo "   Please ensure the data generation scripts have been run."
    exit 1
fi

# Check if essential files exist
if [ ! -f "data/agents/agents.csv" ]; then
    echo "❌ data/agents/agents.csv not found."
    echo "   Run 'npm run export:agents' to generate this file."
    exit 1
fi

# Check for agent-release-data.csv (optional but warn if missing)
if [ ! -f "data/agents/agent-release-data.csv" ]; then
    echo "⚠️  Warning: data/agents/agent-release-data.csv not found."
    echo "   Run 'npm run fetch:agent-releases' to generate release data."
    echo "   Continuing with available files..."
fi

# Upload all CSV files from data/agents folder
echo "Uploading CSV files from data/agents/ folder..."
echo "  Bucket: s3://${S3_BUCKET}"
echo "  Prefix: ${S3_PREFIX}"
echo ""

# Use sync to upload all CSV files to schemas.ably.com/csv/agents/
if [ "$DRY_RUN" = true ]; then
    echo "📋 Files that would be uploaded:"
    find data/agents/ -name "*.csv" -type f | while read file; do
        basename="$(basename "$file")"
        echo "  - $basename → s3://${S3_BUCKET}/${S3_PREFIX}/$basename"
    done
    echo ""
    echo "🔍 Dry-run complete. To actually upload, run without --dry-run"
    echo ""
    echo "Files will be publicly available at:"
    echo "  - https://${S3_BUCKET}/${S3_PREFIX}/agents.csv"
    echo "  - https://${S3_BUCKET}/${S3_PREFIX}/agent-release-data.csv"
    echo ""
    echo "⚠️  Note: Upload requires GitHub Actions or appropriate AWS IAM permissions"
    echo "   The schemas.ably.com bucket uses the ably-sdk-schemas-ably-common role"
else
    aws s3 sync data/agents/ "s3://${S3_BUCKET}/${S3_PREFIX}/" \
        --exclude "*" \
        --include "*.csv" \
        --acl public-read \
        --profile "$AWS_PROFILE"

    echo ""
    echo "✅ Files uploaded successfully!"
    echo ""
    echo "📋 Uploaded files:"
    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" --recursive --profile "$AWS_PROFILE" | grep "\.csv$"
    echo ""
    echo "Files publicly available at:"
    echo "  - https://${S3_BUCKET}/${S3_PREFIX}/agents.csv"
    echo "  - https://${S3_BUCKET}/${S3_PREFIX}/agent-release-data.csv"
fi
