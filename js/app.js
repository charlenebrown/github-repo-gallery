const username = "charlenebrown";
const repoList = document.querySelector(".repo-list");
const allReposContainer = document.querySelector(".repos");
const repoData = document.querySelector(".repo-data");
const viewReposButton = document.querySelector(".back-to-gallery");
const filterInput = document.querySelector(".filter-repos");
const languageFilter = document.querySelector("#filter-language");
const galleryStatus = document.querySelector(".gallery-status");

let galleryRepos = [];

const gitUserInfo = async function () {
    const userInfo = await fetch(`https://api.github.com/users/${username}`);
    const data = await userInfo.json();
    displayUserInfo(data);
};

gitUserInfo();
const displayUserInfo = function (data) {
    const avatar = document.querySelector(".user-avatar");
    const name = document.querySelector(".user-name span");
    const bio = document.querySelector(".user-bio span");
    const location = document.querySelector(".user-location span");
    const stats = document.querySelector(".user-stats span");

    avatar.src = data.avatar_url;
    avatar.alt = `${data.name || username}'s GitHub avatar`;

    name.textContent = data.name || username;
    bio.textContent = data.bio || "No bio provided.";
    location.textContent = data.location || "Not specified.";
    stats.textContent = data.public_repos;

    document.querySelector(".user-info").hidden = false;


};


const gitRepos = async function () {
    galleryStatus.textContent = "Loading repositories…";

    try {
        const response = await fetch("data/github-gallery.json");

        if (!response.ok) {
            throw new Error(`Gallery data returned ${response.status}.`);
        }

        const snapshot = await response.json();
        galleryRepos = snapshot.repositories;

        languageFilter.replaceChildren();

        const allOption = document.createElement("option");
        allOption.value = "";
        allOption.textContent = "All languages";
        languageFilter.append(allOption);

        const languages = new Set();

        for (const repo of galleryRepos) {
            for (const language of repo.languages) {
                languages.add(language);
            }
        }

        const sortedLanguages = [...languages].sort(function (a, b) {
            return a.localeCompare(b);
        });

        for (const language of sortedLanguages) {
            const option = document.createElement("option");
            option.value = language;
            option.textContent = language;
            languageFilter.append(option);
        }

        languageFilter.disabled = false;
        applyGalleryFilters();
    } catch (error) {
        galleryStatus.textContent =
            "Repositories could not load. Please refresh and try again.";
        console.error("Gallery loading failed:", error);
    }
};


const displayRepos = function (repos) {
    filterInput.classList.remove("hide");
    repoList.replaceChildren();

    for (const repo of repos) {
        const repoItem = document.createElement("li");
        repoItem.classList.add("repo");

        const button = document.createElement("button");
        button.type = "button";
        button.classList.add("repo-name");
        button.textContent = getGalleryTitle(repo.name);
        button.dataset.repoName = repo.name;
        button.dataset.repoOwner = repo.owner;

        repoItem.append(button);
        repoList.append(repoItem);
    }
};

repoList.addEventListener("click", function (e) {
    if (e.target.matches(".repo-name")) {
        const repoName = e.target.dataset.repoName;
        getRepoInfo(repoName, e.target.dataset.repoOwner);
    }
});

const getRepoInfo = async function (repoName, repoOwner = username) {
    const fetchInfo = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}`
    );

    if (!fetchInfo.ok) {
        console.error(
        `Could not load repository "${repoName}". GitHub returned ${fetchInfo.status}.`
    );
    return;
}

const repoInfo = await fetchInfo.json();
    //console.log(repoInfo);

    const fetchLanguages = await fetch(repoInfo.languages_url);
    const languageData = await fetchLanguages.json();

    const languages = [];
    for (const language in languageData) {
        languages.push(language);
    }

    displayRepoInfo(repoInfo, languages);
};


const displayRepoInfo = function (repoInfo, languages) {
    viewReposButton.classList.remove("hide");
    repoData.innerHTML = "";
    repoData.classList.remove("hide");
    allReposContainer.classList.add("hide");
    const div = document.createElement("div");
    div.classList.add("repo-info");
    div.innerHTML = `
       <h2 id="repo-detail-name">${getGalleryTitle(repoInfo.name)}</h2>
        <p>Description: ${repoInfo.description}</p>
        <p>Default Branch: ${repoInfo.default_branch}</p>
        <p>Languages: ${languages.join(", ")}</p>
        <a class="visit" href="${repoInfo.html_url}" target="_blank" rel="noreferrer noopener">View My Repo on GitHub!</a>
    `;
    repoData.append(div);
};

viewReposButton.addEventListener("click", function () {
    allReposContainer.classList.remove("hide");
    repoData.classList.add("hide");
    viewReposButton.classList.add("hide");
});


const applyGalleryFilters = function () {
    const searchText = filterInput.value.trim().toLowerCase();
    const selectedLanguage = languageFilter.value;

    const matchingRepos = galleryRepos.filter(function (repo) {
        const searchableName =
            `${getGalleryTitle(repo.name)} ${repo.name}`.toLowerCase();

        const matchesName = searchableName.includes(searchText);

        const matchesLanguage =
            selectedLanguage === "" ||
            repo.languages.includes(selectedLanguage);

        return matchesName && matchesLanguage;
    });

    displayRepos(matchingRepos);

    galleryStatus.textContent = matchingRepos.length === 0
        ? "No repositories match your search and language selection."
        : `Showing ${matchingRepos.length} of ${galleryRepos.length} repositories.`;
};

filterInput.addEventListener("input", applyGalleryFilters);
languageFilter.addEventListener("change", applyGalleryFilters);

const galleryTitles = {
    "github-repo-gallery": "GitHub Repo Gallery",
    "guess-the-word": "Decode the Decision",
    "sharons-pet-rescue-interactive": "Sharon’s Pet Rescue",
    "random-image-api": "Random Image Generator",
    "sound-of-becoming": "The Sound of Becoming",
    "castellan-method": "The Castellan Method",
    "writers-guild": "Writers Guild",
    "charlenebrown": "About Charlene Brown",
    "props-dot-notations": "Object Properties and Dot Notation",
    "functon-powered-modal": "Function-Powered Modal",
    "create-vacay-budget": "Vacation Budget Calculator",
    "whats-your-function": "What’s Your Function?",
    "creativenaturalista.github.io": "Cre8iveNaturalista",
    "Divi-100-Back-To-Top": "Divi Back-to-Top Styles"
};

const getGalleryTitle = function (repoName) {
    if (galleryTitles[repoName]) {
        return galleryTitles[repoName];
    }

    const acronyms = ["html", "css", "js", "api", "dom"];

    return repoName
        .split(/[-_]+/)
        .map(function (word) {
            if (acronyms.includes(word.toLowerCase())) {
                return word.toUpperCase();
            }

            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(" ");
};



const loadFeaturedProjects = async function () {
    try {
        const response = await fetch("data/github-gallery.json");

        if (!response.ok) {
            throw new Error(`Gallery data returned ${response.status}.`);
        }

        const snapshot = await response.json();
        const featuredList = document.querySelector(".featured-list");

        featuredList.replaceChildren();

        for (const fullName of snapshot.pinnedRepositories) {
            const repo = snapshot.repositories.find(function (item) {
                return item.full_name === fullName;
            });

            if (!repo) continue;

            const card = document.createElement("li");
            card.classList.add("featured-card");

            const heading = document.createElement("h3");
            const link = document.createElement("a");

            link.textContent = getGalleryTitle(repo.name);
            link.href = repo.html_url;

            const description = document.createElement("p");
            description.textContent =
                repo.description || "Explore this project on GitHub.";

            heading.append(link);
            card.append(heading, description);
            featuredList.append(card);
        }

        document.querySelector(".featured").hidden =
            featuredList.children.length === 0;
    } catch (error) {
        console.error("Featured projects could not load:", error);
    }
};

loadFeaturedProjects();

gitRepos();