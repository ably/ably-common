#!/bin/bash

# Script to upload CSV files to S3
# Reads configuration from environment variables or .env file

set -e

# Load .env file if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Configuration from environment variables with defaults
S3_BUCKET="${S3_BUCKET:-files.ably.io}"
S3_PREFIX="${S3_PREFIX:-ably-common/data}"
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

# Upload all CSV files from data folder recursively
echo "Uploading CSV files from data/ folder..."
echo "  Bucket: s3://${S3_BUCKET}"
echo "  Prefix: ${S3_PREFIX}"
echo ""

# Use sync to upload all CSV files while maintaining folder structure
aws s3 sync data/ "s3://${S3_BUCKET}/${S3_PREFIX}/" \
    --exclude "*" \
    --include "*.csv" \
    --profile "$AWS_PROFILE"

echo ""
echo "✅ Files uploaded successfully!"
echo ""
echo "📋 Uploaded files:"
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" --recursive --profile "$AWS_PROFILE" | grep "\.csv$"
echo ""
echo "Now Snowflake is ready to import the data from S3."
