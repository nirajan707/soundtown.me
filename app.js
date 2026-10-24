const songs = Array.isArray(window.SOUNDTOWN_SONGS) ? window.SOUNDTOWN_SONGS : [];
const stopWords = new Set(["a", "an", "and", "by", "for", "from", "in", "lyrics", "lyric", "new", "nepali", "of", "song", "songs", "the", "tiktok", "trending", "viral", "with"]);
const searchInputs = [document.querySelector("#header-search"), document.querySelector("#hero-search")];
const resultLists = [document.querySelector("#header-results"), document.querySelector("#hero-results")];
const homeView = document.querySelector("#home-view");
const songView = document.querySelector("#song-view");
let visibleCount = 12;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097f]+/g, " ")
    .trim();
}

function words(value) {
  return normalize(value).split(/\s+/).filter((word) => word && !stopWords.has(word));
}

function editDistance(left, right) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const previous = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = previous;
    }
  }
  return row[right.length];
}

function matchWord(queryWord, titleWord) {
  if (queryWord === titleWord) return 1;
  if (queryWord.length >= 3 && (titleWord.startsWith(queryWord) || queryWord.startsWith(titleWord))) return 0.85;
  const threshold = queryWord.length > 6 ? 2 : 1;
  return editDistance(queryWord, titleWord) <= threshold ? 0.65 : 0;
}

function scoreSong(song, query) {
  const normalizedQuery = normalize(query);
  const normalizedTitle = normalize(song.title);
  if (normalizedTitle.includes(normalizedQuery)) return 100;

  const queryWords = words(query);
  const titleWords = words(song.title);
  if (!queryWords.length || !titleWords.length) return 0;

  const score = queryWords.reduce((total, queryWord) => {
    const bestMatch = Math.max(0, ...titleWords.map((titleWord) => matchWord(queryWord, titleWord)));
    return total + bestMatch;
  }, 0);
  return score / queryWords.length;
}

function searchSongs(query) {
  if (!query.trim()) return [];
  return songs
    .map((song) => ({ song, score: scoreSong(song, query) }))
    .filter((result) => result.score >= 0.48)
    .sort((left, right) => right.score - left.score || left.song.title.localeCompare(right.song.title));
}

function songName(song) {
  return song.title.split("|")[0].trim() || song.title;
}

function songUrl(song) {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(song.id)}`;
}

function renderSongCard(song, index = 0) {
  const title = songName(song);
  const thumbnail = `https://i.ytimg.com/vi/${encodeURIComponent(song.id)}/hqdefault.jpg`;
  return `
    <button class="song-card" type="button" data-song-id="${escapeHtml(song.id)}">
      <span class="card-thumbnail">
        <img src="${thumbnail}" alt="" loading="lazy" />
        <span class="play-mark" aria-hidden="true">▶</span>
        <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
      </span>
      <span class="card-title">${escapeHtml(title)}</span>
      <span class="card-subtitle">${escapeHtml(song.title)}</span>
    </button>`;
}

function renderCatalog() {
  const grid = document.querySelector("#catalog-grid");
  const recentSongs = songs.slice(0, visibleCount);
  grid.innerHTML = recentSongs.map((song, index) => renderSongCard(song, index)).join("");
  document.querySelector("#catalog-count").textContent = `${songs.length} VIDEOS`;

  let moreButton = document.querySelector("#show-more");
  if (recentSongs.length < songs.length) {
    if (!moreButton) {
      moreButton = document.createElement("button");
      moreButton.id = "show-more";
      moreButton.className = "show-more";
      moreButton.type = "button";
      moreButton.textContent = "Show more songs";
      grid.after(moreButton);
      moreButton.addEventListener("click", () => {
        visibleCount = Math.min(visibleCount + 12, songs.length);
        renderCatalog();
      });
    }
    moreButton.hidden = false;
  } else if (moreButton) {
    moreButton.hidden = true;
  }
}

function renderResults(query, list) {
  if (!query.trim()) {
    list.hidden = true;
    list.innerHTML = "";
    return;
  }
  const matches = searchSongs(query).slice(0, 7);
  const items = matches.map(({ song }) => `
    <button class="search-result" type="button" role="option" data-song-id="${escapeHtml(song.id)}">
      <img src="https://i.ytimg.com/vi/${encodeURIComponent(song.id)}/default.jpg" alt="" />
      <span><strong>${escapeHtml(songName(song))}</strong><small>${escapeHtml(song.title)}</small></span>
      <span class="result-arrow" aria-hidden="true">↗</span>
    </button>`).join("");
  const fallback = `
    <a class="search-fallback" href="https://www.youtube.com/@soundtown77/search?query=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer">
      Search all Sound Town videos on YouTube <span aria-hidden="true">↗</span>
    </a>`;
  list.innerHTML = `${items || `<p class="no-results">No close match in the indexed videos.</p>`}${fallback}`;
  list.hidden = false;
}

function renderLyrics(song) {
  const content = document.querySelector("#lyrics-content");
  if (!song.lyrics) {
    content.innerHTML = `
      <span class="notice-icon" aria-hidden="true">♪</span>
      <div>
        <h3>Lyrics are not available as text yet.</h3>
        <p>Watch the Sound Town video above to read along. Text lyrics can be added here when provided by the rights holder or supplied with permission.</p>
        <a id="lyrics-video-link" href="${songUrl(song)}" target="_blank" rel="noopener noreferrer">Open the lyric video on YouTube ↗</a>
      </div>`;
    return;
  }
  content.innerHTML = `<div class="licensed-lyrics">${escapeHtml(song.lyrics).replace(/\n/g, "<br>")}</div>`;
}

function renderRelated(song) {
  const related = songs
    .filter((candidate) => candidate.id !== song.id)
    .map((candidate) => ({ song: candidate, score: scoreSong(candidate, songName(song)) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((result) => result.song);
  document.querySelector("#related-grid").innerHTML = related.map((item, index) => renderSongCard(item, index)).join("");
}

function openSong(song, updateHash = true) {
  if (!song || !/^[A-Za-z0-9_-]{11}$/.test(song.id)) return;
  const title = songName(song);
  homeView.hidden = true;
  songView.hidden = false;
  document.querySelector("#song-title").textContent = `${title} Lyrics`;
  document.querySelector("#song-byline").textContent = song.title;
  document.querySelector("#breadcrumb-title").textContent = `${title} lyrics`;
  document.querySelector("#lyrics-song-title").textContent = `${title} lyrics`;
  document.querySelector("#song-video").src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.id)}?rel=0`;
  const videoLink = songUrl(song);
  document.querySelector("#watch-youtube").href = videoLink;
  document.querySelector("#lyrics-video-link").href = videoLink;
  renderLyrics(song);
  renderRelated(song);
  document.title = `${title} lyrics | Sound Town`;
  document.querySelector('meta[property="og:title"]').content = document.title;
  if (updateHash) {
    window.history.pushState({ songId: song.id }, "", `#song=${encodeURIComponent(song.id)}`);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function returnHome(updateHash = true) {
  songView.hidden = true;
  homeView.hidden = false;
  document.querySelector("#song-video").src = "";
  document.title = "Sound Town — Song Lyrics";
  document.querySelector('meta[property="og:title"]').content = document.title;
  if (updateHash) window.history.pushState({}, "", window.location.pathname);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleSearchSubmit(event, input) {
  event.preventDefault();
  const matches = searchSongs(input.value);
  if (matches.length) {
    openSong(matches[0].song);
    resultLists.forEach((list) => { list.hidden = true; });
  } else if (input.value.trim()) {
    window.open(`https://www.youtube.com/@soundtown77/search?query=${encodeURIComponent(input.value.trim())}`, "_blank", "noopener");
  }
}

searchInputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    const query = input.value;
    searchInputs.forEach((otherInput) => {
      if (otherInput !== input) otherInput.value = query;
    });
    resultLists.forEach((list) => renderResults(query, list));
  });
  input.addEventListener("focus", () => {
    if (input.value.trim()) renderResults(input.value, resultLists[index]);
  });
  input.form.addEventListener("submit", (event) => handleSearchSubmit(event, input));
});

document.addEventListener("click", (event) => {
  const songButton = event.target.closest("[data-song-id]");
  if (songButton) {
    const song = songs.find((item) => item.id === songButton.dataset.songId);
    if (song) openSong(song);
    resultLists.forEach((list) => { list.hidden = true; });
  }
  if (!event.target.closest(".search-form")) {
    resultLists.forEach((list) => { list.hidden = true; });
  }
  if (event.target.closest("[data-home]") || event.target.closest("#home-link")) {
    event.preventDefault();
    returnHome();
  }
});

document.querySelectorAll("[data-query]").forEach((button) => {
  button.addEventListener("click", () => {
    const heroSearch = document.querySelector("#hero-search");
    heroSearch.value = button.dataset.query;
    renderResults(button.dataset.query, document.querySelector("#hero-results"));
    heroSearch.focus();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    document.querySelector(homeView.hidden ? "#header-search" : "#hero-search").focus();
  }
  if (event.key === "Escape") resultLists.forEach((list) => { list.hidden = true; });
});

function restoreRoute() {
  const match = window.location.hash.match(/^#song=([A-Za-z0-9_-]{11})$/);
  const song = match ? songs.find((item) => item.id === match[1]) : null;
  if (song) openSong(song, false);
  else returnHome(false);
}

window.addEventListener("popstate", restoreRoute);
window.addEventListener("hashchange", restoreRoute);
document.querySelector("#copyright-year").textContent = new Date().getFullYear();
renderCatalog();
restoreRoute();
