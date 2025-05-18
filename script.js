let emojiMap = {};
let page = 1;
let isLoading = false;
let allLoaded = false;

const CACHE_KEY = "githubEmojiCache";
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function loadEmojiMap() {
  const cached = localStorage.getItem(CACHE_KEY);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const now = Date.now();
      if (now - parsed.timestamp < CACHE_EXPIRY_MS) {
        emojiMap = parsed.data;
        return;
      }
    } catch (err) {
      console.warn("Failed to parse emoji cache:", err);
    }
  }

  const res = await fetch("https://api.github.com/emojis");
  const data = await res.json();
  emojiMap = data;

  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify({
      timestamp: Date.now(),
      data: data,
    })
  );
}

function renderGitHubEmojis(text) {
  return text.replace(/:([a-z0-9_+-]+):/gi, (match, code) => {
    if (emojiMap[code]) {
      return `<img src="${emojiMap[code]}" alt="${code}" class="emoji-img" loading="lazy">`;
    }
    return match;
  });
}

async function fetchProjects() {
  if (isLoading || allLoaded) return;

  isLoading = true;
  document.getElementById("loading").classList.remove("hidden");

  const res = await fetch(
    `https://api.github.com/search/repositories?q=user:CodeWhiteWeb+topic:my-projects&per_page=30&page=${page}`
  );
  const data = await res.json();

  const container = document.getElementById("projects");

  if (!data.items || data.items.length === 0) {
    allLoaded = true;
    document.getElementById("end").classList.remove("hidden");
    document.getElementById("loading").classList.add("hidden");
    return;
  }

  const sortedRepos = data.items.sort(
    (a, b) => b.stargazers_count - a.stargazers_count
  );

  sortedRepos.forEach((repo) => {
    const card = document.createElement("div");
    card.className = `card break-inside-avoid backdrop-blur-sm border border-zinc-800 rounded-2xl p-5 shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:border-cyan-400/60 opacity-0 animate-fade-in
`;

    const desc = repo.description || "No description provided.";
    const withEmojis = renderGitHubEmojis(desc);

    card.innerHTML = `
      <h2 class="text-xl font-semibold text-white mb-2">
        <a href="${repo.html_url}" target="_blank" class="hover:underline">${
      repo.name
    }</a>
      </h2>
      <p class="text-gray-400 text-sm emoji-text mb-2">${withEmojis}</p>
      <p class="text-xs text-gray-500 mt-2">
  <span class="bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded-full text-xs mr-2">⭐ ${
    repo.stargazers_count
  }</span>
  ${
    repo.language
      ? `<span class="bg-zinc-800 text-gray-400 px-2 py-0.5 rounded-full text-xs">${repo.language}</span>`
      : ""
  }
</p>
    `;

    container.appendChild(card);
  });

  page++;
  isLoading = false;
  document.getElementById("loading").classList.add("hidden");
}

function handleScroll() {
  const scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop;
  const windowHeight = window.innerHeight;
  const fullHeight = document.documentElement.scrollHeight;

  if (scrollTop + windowHeight >= fullHeight - 100) {
    fetchProjects();
  }
}

async function init() {
  await loadEmojiMap();
  await fetchProjects();
  window.addEventListener("scroll", handleScroll);
}

init();
