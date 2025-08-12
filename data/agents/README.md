# Ably Agent Data

This directory contains CSV exports of Ably agent metadata for analysis and database import.

## Files

- **agents.csv** - Export of all agents from protocol/agents.json
- **agent-release-data.csv** - GitHub release data for all SDK/wrapper agents with version tracking

## Snowflake Import

### Initial Setup

1. Create tables and stages using `create_tables.sql`
2. Upload CSV files to Snowflake stage
3. Run `load_data.sql` to import data

### Manual Import Steps

1. **Upload files to Snowflake:**
   ```sql
   PUT file://data/agents.csv @AGENT_DATA_STAGE;
   PUT file://data/agent-release-data.csv @AGENT_DATA_STAGE;
   ```

2. **Run the merge operation** (from load_data.sql):
   - Loads data into staging tables
   - Merges with existing data (updates existing, inserts new)
   - Cleans up staging tables

3. **Verify the import:**
   ```sql
   SELECT COUNT(*) FROM AGENTS;
   SELECT COUNT(*) FROM AGENT_RELEASES;
   ```

## Data Schema

### agents.csv
- identifier: Unique agent identifier
- versioned: Whether the agent tracks versions (true/false)
- type: Agent type (sdk, wrapper, runtime, os)
- source: GitHub repository URL (if applicable)
- product: Product category (pub-sub, asset-tracking, platform, etc.)
- name: Human-readable agent name

### agent-release-data.csv
- identifier: Agent identifier (foreign key to agents)
- version: Release version
- release_date: Date of release
- release_type: Type (stable, beta, alpha, dev)
- support_end_date: When support ends for this version
- deprecation_date: When version is deprecated
- sunset_date: When version stops working
- sunset_reason: Reason for sunset (if applicable)
- latest_version: Current latest version
- latest_version_release_date: Release date of latest version
- release_info_summary: AI-generated summary of release notes
- release_info: Full release notes/changelog
