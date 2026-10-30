import { mkdir, writeFile, rename } from "node:fs/promises";

const username = process.env.GALLERY_OWNER || "charlenebrown";
const token = process.env.GH_TOKEN;

if (!token) {
  throw new Error("GH_TOKEN must be supplied by GitHub Actions, not browser code.");
}

const request = async function (path, body) {
  const response = await fetch(`https://api.github.com${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-repo-gallery-sync"
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}): ${path}`);
  }

  const result = await response.json();
  if (result.errors?.length) {
    throw new Error(`GitHub GraphQL query failed: ${result.errors.map(e => e.message).join("; ")}`);
  }
  return result;
};

// Request repository pins only. Gists are excluded by the query.
const pinsResult = await request("/graphql", {
  query: `query ($login: String!) {
    user(login: $login) {
      pinnedItems(first: 100, types: [REPOSITORY]) {
        nodes {
          ... on Repository {
            nameWithOwner
            isPrivate
          }
        }
      }
    }
  }`,
  variables: { login: username }
});

if (!pinsResult.data?.user) {
  throw new Error(`GitHub user not found: ${username}`);
}

const pinnedNames = pinsResult.data.user.pinnedItems.nodes
  .filter(repo => repo && !repo.isPrivate)
  .map(repo => repo.nameWithOwner);

// Pagination keeps the gallery working after it grows beyond 100 repositories.
const repositoriesByName = new Map();
for (let page = 1; ; page += 1) {
  const batch = await request(
    `/users/${encodeURIComponent(username)}/repos?type=owner&sort=updated&per_page=100&page=${page}`
  );
  for (const repo of batch) {
    if (!repo.private) repositoriesByName.set(repo.full_name, repo);
  }
  if (batch.length < 100) break;
}

// Public pins may belong to another owner. Preserve that owner in the data.
for (const fullName of pinnedNames) {
  if (!repositoriesByName.has(fullName)) {
    const path = fullName.split("/").map(encodeURIComponent).join("/");
    const repo = await request(`/repos/${path}`);
    if (repo.private) throw new Error("A pinned repository is no longer public.");
    repositoriesByName.set(repo.full_name, repo);
  }
}

const repositories = [];
const languages = new Set();
for (const repo of repositoriesByName.values()) {
  const path = repo.full_name.split("/").map(encodeURIComponent).join("/");
  const languageBytes = await request(`/repos/${path}/languages`);
  const repoLanguages = Object.keys(languageBytes).sort();
  repoLanguages.forEach(language => languages.add(language));

  repositories.push({
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    owner: repo.owner.login,
    description: repo.description,
    html_url: repo.html_url,
    homepage: repo.homepage || null,
    default_branch: repo.default_branch,
    languages: repoLanguages,
    updated_at: repo.updated_at,
    archived: repo.archived,
    fork: repo.fork
  });
}

repositories.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
const snapshot = {
  schemaVersion: 1,
  syncedAt: new Date().toISOString(),
  username,
  pinnedRepositories: pinnedNames,
  languages: [...languages].sort(),
  repositories
};

// Publish a complete snapshot only after every request succeeds.
await mkdir("data", { recursive: true });
await writeFile("data/github-gallery.json.tmp", JSON.stringify(snapshot, null, 2) + "\n");
await rename("data/github-gallery.json.tmp", "data/github-gallery.json");
console.log(`Saved ${repositories.length} public repositories, ${pinnedNames.length} pins, and ${languages.size} languages.`);
