const username = "charlenebrown";
const repoList = document.querySelector(".repo-list");
const allReposContainer = document.querySelector(".repos");
const repoData = document.querySelector(".repo-data");
const viewReposButton = document.querySelector(".back-to-gallery");
const filterInput = document.querySelector(".filter-repos");

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

    gitRepos();
};


const gitRepos = async function () {
    const fetchRepos = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);
    const repoData = await fetchRepos.json();
    displayRepos(repoData);
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

        repoItem.append(button);
        repoList.append(repoItem);
    }
};

repoList.addEventListener("click", function (e) {
    if (e.target.matches(".repo-name")) {
        const repoName = e.target.dataset.repoName;
        getRepoInfo(repoName);
    }
});

const getRepoInfo = async function (repoName) {
   const fetchInfo = await fetch(`https://api.github.com/repos/${username}/${repoName}`);

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


filterInput.addEventListener("input", function (e) {
    const searchText = e.target.value;
    const repos = document.querySelectorAll(".repo");
    const searchLowerText = searchText.toLowerCase();

    for (const repo of repos) {
        const button = repo.querySelector(".repo-name");
        const repoLowerText =
            `${button.textContent} ${button.dataset.repoName}`.toLowerCase();
        if (repoLowerText.includes(searchLowerText)) {
            repo.classList.remove("hide");
         } else {
            repo.classList.add("hide");
    }
  }
});

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

