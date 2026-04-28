import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const seedPath = path.join(root, "ops", "linear", "visulive-linear-os.seed.json");
const outputDir = path.join(root, "ops", "linear", "generated");
const csvPath = path.join(outputDir, "visulive-linear-issues.csv");
const markdownPath = path.join(outputDir, "visulive-linear-setup.md");

function csvCell(value) {
  const text = Array.isArray(value) ? value.join(", ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function priorityName(priority) {
  switch (String(priority).toLowerCase()) {
    case "urgent":
      return "Urgent";
    case "high":
      return "High";
    case "normal":
      return "Medium";
    case "low":
      return "Low";
    default:
      return priority || "Medium";
  }
}

function readSeed() {
  if (!fs.existsSync(seedPath)) {
    throw new Error(`Linear seed file not found: ${seedPath}`);
  }
  return JSON.parse(fs.readFileSync(seedPath, "utf8"));
}

function writeCsv(seed) {
  const header = [
    "Title",
    "Description",
    "Team",
    "Project",
    "Milestone",
    "Labels",
    "Priority",
    "State",
    "Blocked By",
  ];
  const rows = seed.issues.map((issue) => [
    issue.title,
    issue.description,
    seed.team.name,
    issue.project,
    issue.milestone,
    issue.labels,
    priorityName(issue.priority),
    issue.state ?? "",
    issue.blockedBy ?? [],
  ]);

  const contents = [header, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
  fs.writeFileSync(csvPath, `${contents}\n`);
}

function writeMarkdown(seed) {
  const [project] = seed.projects;
  const lines = [
    "# VisuLive Linear Setup",
    "",
    `Workspace: ${seed.workspaceUrl}`,
    `Team: ${seed.team.name}`,
    `Team key: ${seed.team.key}`,
    `Project: ${project.name}`,
    "",
    "## Connector Truth",
    "",
    "- Use the direct `mcp__linear__` connector for VisuLive.",
    "- Do not use the stale `mcp__codex_apps__linear_mcp_server` connector if it reads `learning-capture-pipeline`.",
    "- Before any write, verify the project URL starts with `https://linear.app/visulive/` and the team key is `VIS`.",
    "- If the direct connector is unavailable, reconnect `codex mcp login linear` and verify workspace reads before writing.",
    "",
    "## Project",
    "",
    project.description,
    "",
    "## Milestones",
    "",
    ...project.milestones.flatMap((milestone) => [
      `- ${milestone.name}: ${milestone.description}`,
    ]),
    "",
    "## Labels",
    "",
    ...seed.labels.map((label) => `- ${label.name}: ${label.description}`),
    "",
    "## Issues",
    "",
    ...seed.issues.flatMap((issue) => [
      `### ${issue.title}`,
      "",
      `Priority: ${priorityName(issue.priority)}`,
      `State: ${issue.state ?? "Backlog"}`,
      `Milestone: ${issue.milestone}`,
      `Labels: ${issue.labels.join(", ")}`,
      ...(issue.blockedBy?.length
        ? [`Blocked by: ${issue.blockedBy.join(", ")}`]
        : []),
      "",
      issue.description,
      "",
    ]),
  ];

  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`);
}

fs.mkdirSync(outputDir, { recursive: true });
const seed = readSeed();
writeCsv(seed);
writeMarkdown(seed);

console.log(`Wrote ${path.relative(root, csvPath)}`);
console.log(`Wrote ${path.relative(root, markdownPath)}`);
