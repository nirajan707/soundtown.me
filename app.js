const songs = Array.isArray(window.SOUNDTOWN_SONGS) ? window.SOUNDTOWN_SONGS : [];
const stopWords = new Set(["a", "an", "and", "by", "for", "from", "in", "lyrics", "lyric", "new", "nepali", "of", "song", "songs", "the", "tiktok", "trending", "viral", "with"]);
const searchInputs = [document.querySelector("#header-search"), document.querySelector("#hero-search")];
const resultLists = [document.querySelector("#header-results"), document.querySelector("#hero-results")];
const homeView = document.querySelector("#home-view");
const songView = document.querySelector("#song-view");
const siteHomeUrl = new URL("/", document.querySelector('link[rel="canonical"]').href);
let visibleCount = 12;
let activeLyricsLanguage = "romanized";
let currentSong = null;
const homeTitle = "Nepali Song Lyrics, Artists & Videos | Sound Town";
const homeDescription = "Search Nepali songs by title, artist, or lyrics, and watch official Sound Town music videos.";

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

const devanagariConsonants = new Map([
  ["क", "k"], ["ख", "kh"], ["ग", "g"], ["घ", "gh"], ["ङ", "ng"],
  ["च", "ch"], ["छ", "chh"], ["ज", "j"], ["झ", "jh"], ["ञ", "ny"],
  ["ट", "T"], ["ठ", "Th"], ["ड", "D"], ["ढ", "Dh"], ["ण", "N"],
  ["त", "t"], ["थ", "th"], ["द", "d"], ["ध", "dh"], ["न", "n"],
  ["प", "p"], ["फ", "ph"], ["ब", "b"], ["भ", "bh"], ["म", "m"],
  ["य", "y"], ["र", "r"], ["ल", "l"], ["व", "w"], ["श", "sh"],
  ["ष", "Sh"], ["स", "s"], ["ह", "h"], ["क्ष", "ksh"], ["त्र", "tr"], ["ज्ञ", "gy"]
]);
const devanagariVowels = new Map([
  ["अ", "a"], ["आ", "aa"], ["इ", "i"], ["ई", "ii"], ["उ", "u"],
  ["ऊ", "uu"], ["ऋ", "ri"], ["ए", "e"], ["ऐ", "ai"], ["ओ", "o"], ["औ", "au"]
]);
const devanagariVowelSigns = new Map([
  ["ा", "aa"], ["ि", "i"], ["ी", "ii"], ["ु", "u"], ["ू", "uu"],
  ["ृ", "ri"], ["े", "e"], ["ै", "ai"], ["ो", "o"], ["ौ", "au"]
]);
const romanConsonants = new Map([
  ["kh", "ख"], ["gh", "घ"], ["ng", "ङ"], ["chh", "छ"], ["ch", "च"],
  ["jh", "झ"], ["ny", "ञ"], ["Th", "ठ"], ["th", "थ"], ["Dh", "ढ"],
  ["dh", "ध"], ["ph", "फ"], ["bh", "भ"], ["sh", "श"], ["Sh", "ष"],
  ["ksh", "क्ष"], ["tr", "त्र"], ["gy", "ज्ञ"], ["T", "ट"], ["D", "ड"],
  ["N", "ण"], ["k", "क"], ["g", "ग"], ["c", "च"], ["j", "ज"], ["t", "त"],
  ["d", "द"], ["n", "न"], ["p", "प"], ["f", "फ"], ["b", "ब"], ["m", "म"],
  ["y", "य"], ["r", "र"], ["l", "ल"], ["v", "व"], ["w", "व"], ["s", "स"],
  ["h", "ह"], ["x", "क्ष"]
]);
const romanVowels = new Map([
  ["aa", "आ"], ["ii", "ई"], ["uu", "ऊ"], ["ee", "ई"], ["oo", "ऊ"], ["ai", "ऐ"], ["au", "औ"],
  ["ri", "ऋ"], ["a", "अ"], ["i", "इ"], ["u", "उ"], ["e", "ए"],
  ["o", "ओ"]
]);
const romanVowelSigns = new Map([
  ["आ", "ा"], ["इ", "ि"], ["ई", "ी"], ["उ", "ु"], ["ऊ", "ू"],
  ["ऋ", "ृ"], ["ए", "े"], ["ऐ", "ै"], ["ओ", "ो"], ["औ", "ौ"]
]);

function devanagariToRomanized(text) {
  const characters = Array.from(text);
  let result = "";
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    if (devanagariVowels.has(character)) {
      result += devanagariVowels.get(character);
    } else if (devanagariConsonants.has(character)) {
      result += devanagariConsonants.get(character);
      const next = characters[index + 1];
      if (devanagariVowelSigns.has(next)) {
        result += devanagariVowelSigns.get(next);
        index += 1;
      } else if (next !== "्") {
        result += "a";
      }
    } else if (character === "्") {
      continue;
    } else if (character === "ं" || character === "ँ") {
      result += "n";
    } else if (character === "ः") {
      result += "h";
    } else {
      result += character;
    }
  }
  return result;
}

function romanizedToDevanagari(text) {
  const tokens = [...romanConsonants.keys(), ...romanVowels.keys()]
    .sort((left, right) => right.length - left.length);
  let result = "";
  let index = 0;
  while (index < text.length) {
    const token = tokens.find((candidate) => text.slice(index, index + candidate.length) === candidate)
      || tokens.find((candidate) => text.slice(index, index + candidate.length).toLowerCase() === candidate.toLowerCase());
    if (!token) {
      result += text[index];
      index += 1;
      continue;
    }
    if (romanConsonants.has(token)) {
      result += romanConsonants.get(token);
      index += token.length;
      const vowelKeys = [...romanVowels.keys()].sort((left, right) => right.length - left.length);
      const vowel = vowelKeys.find((candidate) => text.slice(index, index + candidate.length) === candidate)
        || vowelKeys.find((candidate) => text.slice(index, index + candidate.length).toLowerCase() === candidate.toLowerCase());
      if (vowel) {
        const independentVowel = romanVowels.get(vowel);
        result += romanVowelSigns.get(independentVowel) || "";
        index += vowel.length;
      } else {
        const nextIsConsonant = [...romanConsonants.keys()]
          .some((candidate) => text.slice(index, index + candidate.length).toLowerCase() === candidate.toLowerCase());
        if (nextIsConsonant) result += "्";
      }
      continue;
    }
    result += romanVowels.get(token);
    index += token.length;
  }
  return result;
}

function lyricVersions(song) {
  const lyrics = song.lyrics || {};
  const romanized = Array.isArray(lyrics.romanized) ? lyrics.romanized : null;
  const devanagari = Array.isArray(lyrics.devanagari) ? lyrics.devanagari : null;
  if (romanized && !devanagari) {
    return {
      romanized,
      devanagari: romanized.map((verse) => ({
        ...verse,
        lines: verse.lines.map(romanizedToDevanagari)
      })),
      generatedLanguage: "devanagari"
    };
  }
  if (devanagari && !romanized) {
    return {
      romanized: devanagari.map((verse) => ({
        ...verse,
        lines: verse.lines.map(devanagariToRomanized)
      })),
      devanagari,
      generatedLanguage: "romanized"
    };
  }
  return { romanized, devanagari, generatedLanguage: null };
}

function searchableText(song) {
  const versions = lyricVersions(song);
  const lyricLines = [versions.romanized, versions.devanagari]
    .filter(Array.isArray)
    .flatMap((language) => language.flatMap((verse) => verse.lines || []));
  const tags = Array.isArray(song.tags) ? song.tags : [];
  const keywords = Array.isArray(song.keywords) ? song.keywords : [];
  return [song.title, song.artist, ...tags, ...keywords, ...lyricLines].filter(Boolean).join(" ");
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
  const normalizedSearchText = normalize(searchableText(song));
  if (normalizedSearchText.includes(normalizedQuery)) return 100;

  const queryWords = words(query);
  const searchWords = words(searchableText(song));
  if (!queryWords.length || !searchWords.length) return 0;

  const score = queryWords.reduce((total, queryWord) => {
    const bestMatch = Math.max(0, ...searchWords.map((searchWord) => matchWord(queryWord, searchWord)));
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

function songPageUrl(song) {
  const url = new URL(siteHomeUrl);
  url.searchParams.set("song", song.id);
  return url.href;
}

function renderSongCard(song) {
  const title = songName(song);
  const thumbnail = `https://i.ytimg.com/vi/${encodeURIComponent(song.id)}/hqdefault.jpg`;
  return `
    <a class="song-card" href="${escapeHtml(songPageUrl(song))}" data-song-id="${escapeHtml(song.id)}">
      <span class="card-thumbnail">
        <img src="${thumbnail}" alt="" loading="lazy" />
        <span class="play-mark" aria-hidden="true">▶</span>
      </span>
      <span class="card-title">${escapeHtml(title)}</span>
      <span class="card-subtitle">${escapeHtml(song.title)}</span>
    </a>`;
}

function renderCatalog() {
  const grid = document.querySelector("#catalog-grid");
  const recentSongs = songs.slice(0, visibleCount);
  grid.innerHTML = recentSongs.map((song) => renderSongCard(song)).join("");
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
    <a class="search-result" href="${escapeHtml(songPageUrl(song))}" role="option" data-song-id="${escapeHtml(song.id)}">
      <img src="https://i.ytimg.com/vi/${encodeURIComponent(song.id)}/default.jpg" alt="" />
      <span><strong>${escapeHtml(songName(song))}</strong><small>${escapeHtml(song.title)}</small></span>
      <span class="result-arrow" aria-hidden="true">↗</span>
    </a>`).join("");
  const fallback = `
    <a class="search-fallback" href="https://www.youtube.com/@soundtown77/search?query=${encodeURIComponent(query)}" target="_blank" rel="noopener noreferrer">
      Search all Sound Town videos on YouTube <span aria-hidden="true">↗</span>
    </a>`;
  list.innerHTML = `${items || `<p class="no-results">No close match in the indexed videos.</p>`}${fallback}`;
  list.hidden = false;
}

function renderLyrics(song) {
  const content = document.querySelector("#lyrics-content");
  const languageToggle = document.querySelector("#language-toggle");
  currentSong = song;
  const versions = lyricVersions(song);
  const hasRomanized = Array.isArray(versions.romanized);
  const hasDevanagari = Array.isArray(versions.devanagari);
  if (!hasRomanized && !hasDevanagari) {
    languageToggle.hidden = true;
    content.classList.add("lyrics-notice");
    content.classList.remove("lyrics-display");
    content.innerHTML = `
      <span class="notice-icon" aria-hidden="true">♪</span>
      <div>
        <h3>Lyrics are not available as text yet.</h3>
        <p>Watch the Sound Town video above to read along. Text lyrics can be added here when provided by the rights holder or supplied with permission.</p>
        <a id="lyrics-video-link" href="${songUrl(song)}" target="_blank" rel="noopener noreferrer">Open the lyric video on YouTube ↗</a>
      </div>`;
    return;
  }
  languageToggle.hidden = false;
  if (activeLyricsLanguage === "devanagari" ? !hasDevanagari : !hasRomanized) {
    activeLyricsLanguage = hasRomanized ? "romanized" : "devanagari";
  }
  const isRomanized = activeLyricsLanguage === "romanized";
  const verses = versions[activeLyricsLanguage];
  const sections = verses.map((verse) => `
    <section class="lyric-verse">
      ${verse.label ? `<h3>${escapeHtml(verse.label)}</h3>` : ""}
      <p>${verse.lines.map(escapeHtml).join("<br>")}</p>
    </section>`).join("");
  content.classList.remove("lyrics-notice");
  content.classList.add("lyrics-display");
  const translationNote = versions.generatedLanguage === activeLyricsLanguage
    ? "Automatically transliterated. Review spelling and pronunciation."
    : isRomanized
      ? "Romanized Nepali lyrics."
      : "Nepali lyrics in Devanagari script.";
  content.innerHTML = `
    <div class="licensed-lyrics" lang="${isRomanized ? "ne-Latn" : "ne"}">${sections}</div>
    <p class="translation-note">${translationNote}</p>`;
  document.querySelectorAll(".language-option").forEach((button) => {
    const selected = button.dataset.language === activeLyricsLanguage;
    button.disabled = button.dataset.language === "devanagari" ? !hasDevanagari : !hasRomanized;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
}

function renderRelated(song) {
  const related = songs
    .filter((candidate) => candidate.id !== song.id)
    .map((candidate) => ({ song: candidate, score: scoreSong(candidate, songName(song)) }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .map((result) => result.song);
  document.querySelector("#related-grid").innerHTML = related.map((item) => renderSongCard(item)).join("");
}

function setMeta(selector, attribute, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
}

function setSongSeo(song) {
  const title = `${songName(song)} lyrics | Sound Town`;
  const description = `${song.title}. ${song.lyrics ? "Read the romanized Nepali lyrics" : "Find song details and lyrics information"} and watch the official video on Sound Town.`;
  const keywords = [...new Set(words(searchableText(song)))].slice(0, 30).join(", ");
  const pageUrl = songPageUrl(song);
  document.title = title;
  setMeta('meta[name="description"]', "content", description.slice(0, 160));
  setMeta('meta[name="keywords"]', "content", keywords);
  setMeta('meta[property="og:type"]', "content", "video.other");
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", description.slice(0, 160));
  setMeta('meta[property="og:url"]', "content", pageUrl);
  setMeta('meta[property="og:image"]', "content", `https://i.ytimg.com/vi/${encodeURIComponent(song.id)}/hqdefault.jpg`);
  setMeta('meta[name="twitter:title"]', "content", title);
  setMeta('meta[name="twitter:description"]', "content", description.slice(0, 160));
  setMeta('meta[name="twitter:image"]', "content", `https://i.ytimg.com/vi/${encodeURIComponent(song.id)}/hqdefault.jpg`);
  setMeta('link[rel="canonical"]', "href", pageUrl);

  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: song.title,
    description: description.slice(0, 160),
    thumbnailUrl: [`https://i.ytimg.com/vi/${encodeURIComponent(song.id)}/hqdefault.jpg`],
    embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.id)}`,
    contentUrl: songUrl(song),
    url: pageUrl,
    publisher: {
      "@type": "Organization",
      name: "Sound Town",
      url: siteHomeUrl.href
    },
    inLanguage: "ne"
  };
  document.querySelector("#song-schema").textContent = JSON.stringify(schema);
}

function setHomeSeo() {
  document.title = homeTitle;
  setMeta('meta[name="description"]', "content", homeDescription);
  setMeta('meta[name="keywords"]', "content", "Nepali song lyrics, Nepali songs, song lyrics, Sound Town, Nepali music videos");
  setMeta('meta[property="og:type"]', "content", "website");
  setMeta('meta[property="og:title"]', "content", homeTitle);
  setMeta('meta[property="og:description"]', "content", homeDescription);
  setMeta('meta[property="og:url"]', "content", siteHomeUrl.href);
  setMeta('meta[property="og:image"]', "content", `${siteHomeUrl.href}soundtown-logo.jpg`);
  setMeta('meta[name="twitter:title"]', "content", homeTitle);
  setMeta('meta[name="twitter:description"]', "content", homeDescription);
  setMeta('meta[name="twitter:image"]', "content", `${siteHomeUrl.href}soundtown-logo.jpg`);
  setMeta('link[rel="canonical"]', "href", siteHomeUrl.href);
  document.querySelector("#song-schema").textContent = "";
}

function openSong(song, updateUrl = true) {
  if (!song || !/^[A-Za-z0-9_-]{11}$/.test(song.id)) return;
  const title = songName(song);
  const versions = lyricVersions(song);
  activeLyricsLanguage = versions.generatedLanguage === "romanized" ? "devanagari" : "romanized";
  homeView.hidden = true;
  songView.hidden = false;
  document.querySelector("#song-title").textContent = `${title} Lyrics`;
  document.querySelector("#song-byline").textContent = song.title;
  document.querySelector("#breadcrumb-title").textContent = `${title} lyrics`;
  document.querySelector("#lyrics-song-title").textContent = `${title} lyrics`;
  document.querySelector("#song-video").src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(song.id)}?rel=0`;
  const videoLink = songUrl(song);
  document.querySelector("#watch-youtube").href = videoLink;
  renderLyrics(song);
  renderRelated(song);
  setSongSeo(song);
  if (updateUrl) {
    window.history.pushState({ songId: song.id }, "", songPageUrl(song));
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function returnHome(updateUrl = true) {
  songView.hidden = true;
  homeView.hidden = false;
  document.querySelector("#song-video").src = "";
  setHomeSeo();
  if (updateUrl) window.history.pushState({}, "", window.location.pathname);
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

document.querySelectorAll(".language-option").forEach((button) => {
  button.addEventListener("click", () => {
    if (!Array.isArray(lyricVersions(currentSong || {})[button.dataset.language])) return;
    activeLyricsLanguage = button.dataset.language;
    renderLyrics(currentSong);
  });
});

document.addEventListener("click", (event) => {
  const songButton = event.target.closest("[data-song-id]");
  if (songButton) {
    event.preventDefault();
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
  const querySongId = new URLSearchParams(window.location.search).get("song");
  const legacyMatch = window.location.hash.match(/^#song=([A-Za-z0-9_-]{11})$/);
  const songId = querySongId || (legacyMatch && legacyMatch[1]);
  const song = songId ? songs.find((item) => item.id === songId) : null;
  if (song) openSong(song, false);
  else {
    returnHome(false);
    const query = new URLSearchParams(window.location.search).get("q");
    if (query) {
      searchInputs.forEach((input) => { input.value = query; });
      resultLists.forEach((list) => renderResults(query, list));
    }
  }
}

window.addEventListener("popstate", restoreRoute);
window.addEventListener("hashchange", restoreRoute);
document.querySelector("#copyright-year").textContent = new Date().getFullYear();
renderCatalog();
restoreRoute();
