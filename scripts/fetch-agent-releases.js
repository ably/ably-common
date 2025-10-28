#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const https = require("https");

/**
 * Fetches all release information from GitHub for agents defined in agents.json
 * and generates a CSV file with support status based on Ably's deprecation policy
 */

// Try to load dotenv if available
try {
  require("dotenv").config();
} catch (e) {
  // dotenv not available, continue without it
}

const agentsFilePath = path.join(__dirname, "..", "protocol", "agents.json");
const outputPath = path.join(
  __dirname,
  "..",
  "data",
  "agents",
  "agent-release-data.csv"
);

// Load agents data
const agents = JSON.parse(fs.readFileSync(agentsFilePath, "utf8"));

// GitHub API configuration
const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!GITHUB_TOKEN) {
  console.warn(
    "⚠️  Warning: GITHUB_TOKEN not set. GitHub API rate limits will be restrictive."
  );
  console.warn(
    "   Set GITHUB_TOKEN environment variable for better rate limits."
  );
  console.warn(
    "   The script will proceed but may hit rate limits with many releases."
  );
}

if (!OPENAI_API_KEY) {
  console.warn(
    "⚠️  Warning: OPENAI_API_KEY not set. Release info summarization will be skipped."
  );
  console.warn(
    "   Set OPENAI_API_KEY environment variable to enable AI summarization."
  );
  console.warn("   The script will proceed without generating summaries.");
}

// Headers for GitHub API
const headers = {
  "User-Agent": "Ably-Agent-Release-Fetcher",
  Accept: "application/vnd.github.v3+json",
};

if (GITHUB_TOKEN) {
  headers["Authorization"] = `token ${GITHUB_TOKEN}`;
}

// Load existing CSV data if available
let existingData = {};
if (fs.existsSync(outputPath)) {
  console.log("Loading existing CSV data...");
  const csvContent = fs.readFileSync(outputPath, "utf8");
  const lines = csvContent.split("\n");
  const header = lines[0];

  if (header) {
    const headerFields = header.split(",");
    const releaseInfoIndex = headerFields.indexOf("releaseInfo");
    const releaseInfoSummaryIndex = headerFields.indexOf("releaseInfoSummary");

    lines.slice(1).forEach((line) => {
      if (line.trim()) {
        const fields = line.split(",");
        const identifier = fields[0];
        const version = fields[1];
        const key = `${identifier}_${version}`;

        existingData[key] = {
          releaseInfo: releaseInfoIndex >= 0 ? fields[releaseInfoIndex] : "",
          releaseInfoSummary:
            releaseInfoSummaryIndex >= 0 ? fields[releaseInfoSummaryIndex] : "",
        };
      }
    });
  }
}

/**
 * Make a GitHub API request
 */
async function githubRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.github.com",
      path,
      headers,
    };

    https
      .get(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`GitHub API error: ${res.statusCode} - ${data}`));
          } else {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(
                new Error(`Failed to parse GitHub response: ${e.message}`)
              );
            }
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Fetch release body from GitHub
 */
async function fetchReleaseBody(owner, repo, tag) {
  try {
    const path = `/repos/${owner}/${repo}/releases/tags/${tag}`;
    const release = await githubRequest(path);
    return release.body || "";
  } catch (error) {
    console.error(`  Error fetching release body for ${tag}: ${error.message}`);
    return "";
  }
}

/**
 * Clean release info for CSV
 */
function cleanReleaseInfo(text) {
  return text
    .replace(/\r\n/g, " ")
    .replace(/\n/g, " ")
    .replace(/,/g, ";")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Generate a summary using OpenAI
 */
async function generateSummary(releaseInfo) {
  if (!OPENAI_API_KEY || !releaseInfo || releaseInfo.length < 10) {
    return "";
  }

  // The releaseInfo has already been cleaned, but we still need to ensure it's safe for JSON
  // Use a more robust approach by creating the object first, then stringifying
  const truncatedInfo = releaseInfo.substring(0, 1000);
  const systemPrompt =
    "You are a technical writer who creates very concise summaries.";
  const userPrompt = `Summarize this software release note in one concise sentence (max 100 chars): ${truncatedInfo}`;

  return new Promise((resolve) => {
    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    };

    // Use JSON.stringify which handles escaping properly
    let data;
    try {
      data = JSON.stringify(payload);
    } catch (e) {
      console.error(`  Error stringifying OpenAI payload: ${e.message}`);
      resolve("");
      return;
    }

    const options = {
      hostname: "api.openai.com",
      port: 443,
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Length": Buffer.byteLength(data, "utf8"),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => (responseData += chunk));
      res.on("end", () => {
        try {
          // Check if we got an HTML error page
          if (responseData.trim().startsWith("<")) {
            console.error(
              "  OpenAI API returned HTML error page (likely rate limited)"
            );
            resolve("");
            return;
          }

          const response = JSON.parse(responseData);

          // Check for API errors
          if (response.error) {
            console.error(
              `  OpenAI API error: ${
                response.error.message || response.error.type || "Unknown error"
              }`
            );
            resolve("");
            return;
          }

          if (response.choices && response.choices[0]) {
            const summary = response.choices[0].message.content
              .replace(/,/g, ";")
              .replace(/\n/g, " ")
              .trim();
            resolve(summary);
          } else {
            resolve("");
          }
        } catch (e) {
          if (responseData.length > 100) {
            console.error(
              "  Error parsing OpenAI response: Response too long, likely an error page"
            );
          } else {
            console.error(`  Error parsing OpenAI response: ${e.message}`);
          }
          resolve("");
        }
      });
    });

    req.on("error", (e) => {
      console.error("  Error calling OpenAI:", e.message);
      resolve("");
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.error("  OpenAI request timeout");
      resolve("");
    });

    req.write(data);
    req.end();
  });
}

/**
 * Extract owner and repo from GitHub URL
 */
function parseGitHubUrl(url) {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }
  return { owner: match[1], repo: match[2] };
}

/**
 * Fetch all releases for a repository
 */
async function fetchReleases(owner, repo) {
  const releases = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    try {
      const path = `/repos/${owner}/${repo}/releases?per_page=${perPage}&page=${page}`;
      console.log(`Fetching releases from ${owner}/${repo} (page ${page})...`);

      const pageReleases = await githubRequest(path);

      if (pageReleases.length === 0) {
        break;
      }

      releases.push(...pageReleases);

      if (pageReleases.length < perPage) {
        break;
      }

      page++;
    } catch (error) {
      console.error(
        `Error fetching releases for ${owner}/${repo}: ${error.message}`
      );
      break;
    }
  }

  return releases;
}

/**
 * Normalize version by removing leading 'v' or repository-specific prefixes
 *
 * Special cases:
 * - ably-forks/laravel-echo: Uses 'ably-echo-X.Y.Z' format instead of standard 'vX.Y.Z'
 *   The library hardcodes this version format into the agent string in the connector code.
 *   We strip 'ably-echo-' prefix to get the semantic version for comparison and reporting.
 */
function normalizeVersion(version) {
  // Handle ably-forks/laravel-echo non-standard tag format: ably-echo-X.Y.Z -> X.Y.Z
  // This repository uses a unique tag convention where versions are prefixed with 'ably-echo-'
  // instead of the standard 'v' prefix. The hardcoded version in the source code
  // (AblyConnector.LIB_VERSION) is passed directly into the agent string as-is.
  if (version.startsWith("ably-echo-")) {
    return version.replace(/^ably-echo-/, "");
  }

  // Standard 'v' prefix removal: vX.Y.Z -> X.Y.Z
  return version.replace(/^v/, "");
}

/**
 * Determine release type from version string
 *
 * This function categorizes releases based on their version suffixes. While semantic versioning
 * recommends standard suffixes like -alpha, -beta, and -rc, various Ably SDK repositories have
 * historically used non-standard suffixes. This script was created at a point in time where these
 * non-standard conventions already existed in our release history, so we must handle them whether
 * we like them or not.
 *
 * Non-standard suffixes we've encountered and their categorization:
 * - Release Candidates: -preview, +preview (in addition to standard -rc, .rc, +rc)
 * - Beta: -swift, +swift (language-specific beta markers, in addition to standard -beta, .beta, +beta)
 * - Alpha: -experiment, +experiment, -dev, +dev (in addition to standard -alpha, .alpha, +alpha)
 *
 * Any unrecognized suffix is conservatively categorized as "alpha" to indicate it's not a stable release.
 *
 * Note: The use of both '-' (hyphen) and '+' (plus) separators, as well as '.' (dot) in some cases,
 * reflects the variety of conventions used across different repositories. Semantic versioning 2.0
 * standardizes on '-' for pre-release versions and '+' for build metadata, but historical releases
 * don't always follow this convention.
 */
function getReleaseType(version) {
  let normalized = version.toLowerCase();

  // Strip repository-specific prefixes before analyzing the version suffix
  // This ensures that non-standard tag prefixes (like 'ably-echo-') don't interfere
  // with the detection of actual pre-release suffixes (like '-alpha', '-beta', etc.)
  if (normalized.startsWith("ably-echo-")) {
    normalized = normalized.replace(/^ably-echo-/, "");
  } else if (normalized.startsWith("v")) {
    normalized = normalized.replace(/^v/, "");
  }

  // Release candidates: Close to stable, feature-complete, undergoing final testing
  if (
    normalized.includes("-rc") ||
    normalized.includes(".rc") ||
    normalized.includes("+rc") ||
    normalized.includes("release-candidate") ||
    normalized.includes("-preview") || // Non-standard but used in some SDKs
    normalized.includes("+preview") // Non-standard but used in some SDKs
  ) {
    return "release-candidate";
  }

  // Beta releases: Feature-complete but may have bugs, public testing phase
  if (
    normalized.includes("-beta") ||
    normalized.includes(".beta") ||
    normalized.includes("+beta") ||
    normalized.includes("-swift") || // Non-standard: language-specific beta marker
    normalized.includes("+swift") // Non-standard: language-specific beta marker
  ) {
    return "beta";
  }

  // Alpha releases: Early development, incomplete features, experimental
  if (
    normalized.includes("-alpha") ||
    normalized.includes(".alpha") ||
    normalized.includes("+alpha") ||
    normalized.includes("-experiment") || // Non-standard but used in some SDKs
    normalized.includes("+experiment") || // Non-standard but used in some SDKs
    normalized.includes("-dev") || // Non-standard: development builds
    normalized.includes("+dev") // Non-standard: development builds
  ) {
    return "alpha";
  }

  // Check for any other suffix - conservatively categorize as alpha
  // This catches any other non-standard suffixes we haven't explicitly documented
  if (normalized.includes("-") || normalized.includes("+")) {
    const suffix = normalized.split(/[-+]/)[1];
    if (suffix) {
      console.warn(
        `  ⚠️  Unknown version suffix in ${version}, categorizing as alpha`
      );
      return "alpha";
    }
  }

  return "stable";
}

/**
 * Compare semantic versions
 */
function compareVersions(a, b) {
  const parseVersion = (v) => {
    const clean = normalizeVersion(v);
    const parts = clean.split(/[-+]/)[0].split(".");
    return parts.map((p) => parseInt(p) || 0);
  };

  const aParts = parseVersion(a);
  const bParts = parseVersion(b);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aPart = aParts[i] || 0;
    const bPart = bParts[i] || 0;

    if (aPart > bPart) return 1;
    if (aPart < bPart) return -1;
  }

  return 0;
}

/**
 * Check if a version is less than or equal to a threshold
 */
function isVersionLessThanOrEqual(version, threshold) {
  return compareVersions(version, threshold) <= 0;
}

/**
 * Calculate support end date (12 months after the superseding release)
 */
function calculateSupportEndDate(supersedingReleaseDate) {
  if (!supersedingReleaseDate) {
    return "";
  }
  const date = new Date(supersedingReleaseDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split("T")[0];
}

/**
 * Calculate deprecation date (24 months after the superseding release)
 */
function calculateDeprecationDate(supersedingReleaseDate) {
  if (!supersedingReleaseDate) {
    return "";
  }
  const date = new Date(supersedingReleaseDate);
  date.setFullYear(date.getFullYear() + 2);
  return date.toISOString().split("T")[0];
}

/**
 * Find sunsetted versions from agent configuration
 */
function findSunsettedVersions(agent) {
  const sunsetted = [];

  if (agent.versions && agent.versions[0] && agent.versions[0].sunsetted) {
    agent.versions[0].sunsetted.forEach((sunset) => {
      sunsetted.push({
        upToVersion: sunset.upToVersion,
        sunsetDate: sunset.sunsetDate,
        reason: sunset.reason,
      });
    });
  }

  return sunsetted;
}

/**
 * Process releases for an agent
 */
async function processReleases(
  agent,
  releases,
  latestVersion,
  latestVersionDate,
  owner,
  repo
) {
  const rows = [];
  const sunsettedVersions = findSunsettedVersions(agent);

  // Find if there's a newer stable version for deprecation calculation
  const stableReleases = releases.filter(
    (r) => getReleaseType(r.tag_name) === "stable" && !r.prerelease && !r.draft
  );

  for (const release of releases) {
    const version = normalizeVersion(release.tag_name);
    const releaseDate = release.published_at
      ? release.published_at.split("T")[0]
      : "";
    const releaseType = getReleaseType(release.tag_name);

    // Find the immediate next stable release (minimum version greater than current)
    const laterReleases = stableReleases.filter(
      (r) => compareVersions(r.tag_name, release.tag_name) > 0
    );
    const supersedingRelease =
      laterReleases.length > 0
        ? laterReleases.reduce((min, r) =>
            compareVersions(r.tag_name, min.tag_name) < 0 ? r : min
          )
        : null;
    const supersedingReleaseDate = supersedingRelease?.published_at
      ? supersedingRelease.published_at.split("T")[0]
      : "";

    // Calculate support end date (12 months after superseding release)
    let supportEndDate = "";
    if (release.tag_name === latestVersion) {
      // Latest version is supported indefinitely
      supportEndDate = "";
    } else {
      supportEndDate = calculateSupportEndDate(supersedingReleaseDate);
    }

    // Calculate deprecation date (24 months after superseding release)
    const deprecationDate = calculateDeprecationDate(supersedingReleaseDate);

    // Check if version is sunsetted
    let sunsetDate = "";
    let sunsetReason = "";

    for (const sunset of sunsettedVersions) {
      if (isVersionLessThanOrEqual(version, sunset.upToVersion)) {
        sunsetDate = sunset.sunsetDate;
        sunsetReason = sunset.reason;
        break;
      }
    }

    // Get release info from existing data or fetch new
    const key = `${agent.identifier}_${version}`;
    const existing = existingData[key] || {};

    let releaseInfo = existing.releaseInfo || "";
    let releaseInfoSummary = existing.releaseInfoSummary || "";

    // Fetch release body if not in existing data
    if (!releaseInfo && release.tag_name) {
      console.log(
        `  Fetching release info for ${agent.identifier} ${version}...`
      );
      const body = await fetchReleaseBody(owner, repo, release.tag_name);
      releaseInfo = cleanReleaseInfo(body);

      // Generate summary if we have OpenAI key and no existing summary
      if (releaseInfo && !releaseInfoSummary && OPENAI_API_KEY) {
        console.log(
          `  Generating AI summary for ${agent.identifier} ${version}...`
        );
        releaseInfoSummary = await generateSummary(releaseInfo);
        // Delay after OpenAI call to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } else if (releaseInfo && !releaseInfoSummary && OPENAI_API_KEY) {
      // Generate summary for existing release info that lacks summary
      console.log(
        `  Generating AI summary for ${agent.identifier} ${version}...`
      );
      releaseInfoSummary = await generateSummary(releaseInfo);
      // Delay after OpenAI call to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    rows.push({
      identifier: agent.identifier,
      version,
      releaseDate,
      releaseType,
      supportEndDate,
      deprecationDate,
      sunsetDate,
      sunsetReason: sunsetReason.replace(/,/g, ";"), // Replace commas for CSV
      latestVersion: normalizeVersion(latestVersion),
      latestVersionReleaseDate: latestVersionDate,
      releaseInfoSummary: releaseInfoSummary.replace(/,/g, ";"),
      releaseInfo,
    });
  }

  return rows;
}

/**
 * Main function
 */
async function main() {
  const allRows = [];
  const processedRepos = new Set();

  // Get all SDK and wrapper agents
  const agentsToProcess = agents.agents.filter(
    (agent) =>
      (agent.type === "sdk" || agent.type === "wrapper") && agent.source
  );

  console.log(`Found ${agentsToProcess.length} agents to process\n`);

  // Group agents by repository to avoid duplicate fetches
  const repoToAgents = {};
  agentsToProcess.forEach((agent) => {
    const source = agent.source;
    if (!repoToAgents[source]) {
      repoToAgents[source] = [];
    }
    repoToAgents[source].push(agent);
  });

  // Process each repository
  for (const [source, repoAgents] of Object.entries(repoToAgents)) {
    try {
      const { owner, repo } = parseGitHubUrl(source);
      const repoKey = `${owner}/${repo}`;

      if (processedRepos.has(repoKey)) {
        console.log(`Skipping ${repoKey} (already processed)`);
        continue;
      }

      processedRepos.add(repoKey);

      // Fetch releases
      const releases = await fetchReleases(owner, repo);
      console.log(`  Found ${releases.length} releases`);

      if (releases.length === 0) {
        console.log(`  No releases found for ${repoKey}`);
        // Still process agents even with no releases to include them in the CSV
        for (const agent of repoAgents) {
          allRows.push({
            identifier: agent.identifier,
            version: "N/A",
            releaseDate: "",
            releaseType: "",
            supportEndDate: "",
            deprecationDate: "",
            sunsetDate: "",
            sunsetReason: "",
            latestVersion: "N/A",
            latestVersionReleaseDate: "",
            releaseInfoSummary: "",
            releaseInfo: "No releases found",
          });
        }
        continue;
      }

      // Find latest stable version
      const sortedReleases = releases
        .filter(
          (r) =>
            !r.prerelease && !r.draft && getReleaseType(r.tag_name) === "stable"
        )
        .sort((a, b) => compareVersions(b.tag_name, a.tag_name));

      const latestRelease = sortedReleases[0];
      const latestVersion = latestRelease?.tag_name || "";
      const latestVersionDate = latestRelease?.published_at
        ? latestRelease.published_at.split("T")[0]
        : "";
      console.log(`  Latest stable version: ${latestVersion}`);

      // Process releases for each agent using this repository
      for (const agent of repoAgents) {
        const agentRows = await processReleases(
          agent,
          releases,
          latestVersion,
          latestVersionDate,
          owner,
          repo
        );
        allRows.push(...agentRows);
        console.log(
          `  Processed ${agentRows.length} releases for ${agent.identifier}`
        );
      }

      console.log("");

      // Rate limiting pause
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing ${source}: ${error.message}`);
    }
  }

  // Sort rows by identifier and version
  allRows.sort((a, b) => {
    const idCompare = a.identifier.localeCompare(b.identifier);
    if (idCompare !== 0) return idCompare;
    return compareVersions(b.version, a.version); // Newest first within each identifier
  });

  // Write CSV
  console.log(`\nWriting ${allRows.length} rows to ${outputPath}`);

  const csvHeader =
    "identifier,version,releaseDate,releaseType,supportEndDate,deprecationDate,sunsetDate,sunsetReason,latestVersion,latestVersionReleaseDate,releaseInfoSummary,releaseInfo";
  const csvRows = allRows.map(
    (row) =>
      `${row.identifier},${row.version},${row.releaseDate},${row.releaseType},${row.supportEndDate},${row.deprecationDate},${row.sunsetDate},${row.sunsetReason},${row.latestVersion},${row.latestVersionReleaseDate},${row.releaseInfoSummary},${row.releaseInfo}`
  );

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const csvContent = [csvHeader, ...csvRows].join("\n");
  fs.writeFileSync(outputPath, csvContent);

  console.log("✅ Done!");

  // Summary
  const uniqueIdentifiers = new Set(allRows.map((r) => r.identifier));
  console.log(`\nSummary:`);
  console.log(`- ${uniqueIdentifiers.size} unique agents`);
  console.log(`- ${allRows.length} total releases`);
  console.log(`- ${processedRepos.size} repositories processed`);
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
