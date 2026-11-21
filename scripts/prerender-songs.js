const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repositoryRoot = path.resolve(__dirname, "..");
const template = fs.readFileSync(path.join(repositoryRoot, "index.html"), "utf8");
const songsSource = fs.readFileSync(path.join(repositoryRoot, "songs-data-20261112.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(songsSource, context);
const songs = context.window.SOUNDTOWN_SONGS || [];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function songName(song) {
  return song.displayTitle || (song.title || "").split("|")[0].trim() || song.title;
}

function isSoundTown(song) {
  return song.contentType === "soundtown" && song.showLyrics === false &&
    typeof song.youtubeVideoId === "string";
}

function detailRows(song) {
  const details = song.details || {};
  const rows = [
    ["Sung by", details.singers || song.artist],
    ["Composed by", details.composer],
    ["Lyrics by", details.lyricists],
    ["Music produced by", details.producer],
    ["Mandolin", details.mandolin],
    ["Mixed & mastered by", details.mixingMastering],
    ["Backing vocals", details.backingVocals],
    ["Saxophone", details.saxophone]
  ].filter(([, value]) => value);
  if (!rows.length) return "";
  return `<dl class="song-details-list">${rows.map(([label, value]) =>
    `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
  ).join("")}</dl>`;
}

function lyricsMarkup(song) {
  if (isSoundTown(song) || song.showLyrics === false) {
    return `<section class="lyrics-section" id="lyrics-section" aria-labelledby="about-heading">
      <div class="section-heading compact-heading">
        <div>
          <span class="eyebrow"><span class="eyebrow-line"></span> ABOUT THIS SONG</span>
          <h2 id="about-heading">Watch &amp; <em>enjoy.</em></h2>
        </div>
      </div>
      <div class="lyrics-notice">
        <span class="notice-icon" aria-hidden="true">▶</span>
        <div>
          <h3>Watch the complete lyric video</h3>
          <p>Watch the complete lyric video and follow along with the lyrics directly in the video.</p>
        </div>
      </div>
    </section>`;
  }

  const lyrics = song.lyrics || {};
  const romanized = Array.isArray(lyrics.romanized) ? lyrics.romanized : null;
  const devanagari = Array.isArray(lyrics.devanagari) ? lyrics.devanagari : null;
  const sections = romanized || devanagari;
  if (!sections) {
    return `<section class="lyrics-section" id="lyrics-section" aria-labelledby="lyrics-heading">
      <div class="lyrics-notice"><span class="notice-icon" aria-hidden="true">♪</span><div>
        <h3>Lyrics are not available as text yet.</h3>
        <p>Watch the official video above to read along or use the YouTube source for accurate lyrics.</p>
      </div></div>
    </section>`;
  }
  const verses = sections.map((verse) => `<section class="lyric-verse">
    ${verse.label ? `<h3>${escapeHtml(verse.label)}</h3>` : ""}
    <p>${verse.lines.map(escapeHtml).join("<br>")}</p>
  </section>`).join("");
  return `<section class="lyrics-section" id="lyrics-section" aria-labelledby="lyrics-heading">
    <div class="section-heading compact-heading">
      <div>
        <span class="eyebrow"><span class="eyebrow-line"></span> THE WORDS</span>
        <h2 id="lyrics-heading">LYRICS: <em>${escapeHtml(songName(song))}</em></h2>
      </div>
    </div>
    <div class="lyrics-display"><div class="licensed-lyrics">${verses}</div></div>
  </section>`;
}

function relatedMarkup(song) {
  const related = songs.filter((item) => item.id !== song.id).slice(0, 4);
  return related.map((item) => `<a class="song-card" href="/songs/${encodeURIComponent(item.id)}/" data-song-id="${escapeHtml(item.id)}">
    <span class="card-thumbnail"><img src="https://i.ytimg.com/vi/${encodeURIComponent(item.id)}/hqdefault.jpg" alt="" loading="lazy"></span>
    <span class="card-title">${escapeHtml(songName(item))}</span>
    <span class="card-subtitle">${escapeHtml(item.artist || item.title)}</span>
  </a>`).join("");
}

function renderSongPage(song) {
  const name = songName(song);
  const seo = song.seo || {};
  const title = seo.title || `${name} ${isSoundTown(song) ? "official video" : "lyrics"} | Sound Town`;
  const description = seo.description || `${name}${song.artist ? ` by ${song.artist}` : ""}. ${
    isSoundTown(song) ? "Watch the official lyric video and explore song information on Sound Town."
      : "Read the available lyrics and watch the official music video on Sound Town."
  }`;
  const videoId = isSoundTown(song) ? song.youtubeVideoId : song.id;
  const canonical = `https://soundtown.me/songs/${encodeURIComponent(song.id)}/`;
  const keywords = [...new Set([...(seo.keywords || []), ...(song.tags || []), ...(song.keywords || [])])].join(", ");
  let html = template;
  html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description.slice(0, 160))}" />`);
  html = html.replace(/<meta name="keywords" content="[^"]*" \/>/, `<meta name="keywords" content="${escapeHtml(keywords)}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${escapeHtml(canonical)}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(description.slice(0, 160))}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${escapeHtml(canonical)}" />`);
  html = html.replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${escapeHtml(description.slice(0, 160))}" />`);
  html = html.replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg" />`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace('<section class="home-view" id="home-view">', '<section class="home-view" id="home-view" hidden>');
  html = html.replace('<section class="song-view" id="song-view" hidden>', '<section class="song-view" id="song-view">');
  html = html.replace(/<h1 id="song-title">[^<]*<\/h1>/, `<h1 id="song-title">${escapeHtml(name)}</h1>`);
  html = html.replace(/<p class="song-byline" id="song-byline"><\/p>/, `<p class="song-byline" id="song-byline">${escapeHtml(song.artist || song.title)}</p>`);
  html = html.replace(/<span id="breadcrumb-title">[^<]*<\/span>/, `<span id="breadcrumb-title">${escapeHtml(name)}</span>`);
  html = html.replace(/<iframe id="song-video"[^>]*><\/iframe>/, `<iframe id="song-video" title="${escapeHtml(`${name} official music video`)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0"></iframe>`);
  html = html.replace(/<a class="text-link" id="watch-youtube"[^>]*>[^<]*<\/a>/, `<a class="text-link" id="watch-youtube" href="https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}" target="_blank" rel="noopener noreferrer">${isSoundTown(song) ? "Watch on YouTube" : "Open on YouTube"} ↗</a>`);
  html = html.replace(/<section class="song-details-section"[\s\S]*?<\/section>\s*<section class="lyrics-section"/,
    `<section class="song-details-section" id="song-details-section" aria-labelledby="song-details-heading">
      <div class="section-heading compact-heading"><div><span class="eyebrow"><span class="eyebrow-line"></span> SONG DETAILS</span><h2 id="song-details-heading"><em>${escapeHtml(name)}</em></h2></div></div>
      ${detailRows(song)}
      <p id="song-details-description">${escapeHtml(description)}${song.languages?.length ? ` Language: ${escapeHtml(song.languages.join(", "))}.` : ""}</p>
    </section>
    <section class="lyrics-section"`);
  html = html.replace(/<section class="lyrics-section"[\s\S]*?<\/section>\s*<section class="related-section"/,
    `${lyricsMarkup(song)}\n          <section class="related-section"`);
  html = html.replace(/<div class="song-grid related-grid" id="related-grid"><\/div>/,
    `<div class="song-grid related-grid" id="related-grid">${relatedMarkup(song)}</div>`);
  html = html.replace(/<script type="application\/ld\+json" id="song-schema"><\/script>/,
    `<script type="application/ld+json" id="song-schema">${JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "VideoObject",
          name,
          description: description.slice(0, 160),
          thumbnailUrl: [`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`],
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
          url: canonical,
          keywords,
          inLanguage: song.languages || ["en"]
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://soundtown.me/" },
            { "@type": "ListItem", position: 2, name, item: canonical }
          ]
        }
      ]
    })}</script>`);
  html = html.replace('href="styles.css?', 'href="/styles.css?');
  html = html.replace('src="songs-data-20261112.js?', 'src="/songs-data-20261112.js?');
  html = html.replace('src="app.js?', 'src="/app.js?');
  html = html.replace(/src="soundtown-logo\.jpg/g, 'src="/soundtown-logo.jpg');
  return html;
}

fs.rmSync(path.join(repositoryRoot, "songs"), { recursive: true, force: true });
for (const song of songs) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(song.id)) continue;
  const outputDir = path.join(repositoryRoot, "songs", song.id);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "index.html"), renderSongPage(song), "utf8");
}

const indexPath = path.join(repositoryRoot, "index.html");
let indexHtml = fs.readFileSync(indexPath, "utf8");
const staticSongLinks = songs
  .filter((song) => /^[A-Za-z0-9_-]{11}$/.test(song.id))
  .map((song) => `<a class="song-card" href="/songs/${encodeURIComponent(song.id)}/" data-song-id="${escapeHtml(song.id)}">
    <span class="card-thumbnail"><img src="https://i.ytimg.com/vi/${encodeURIComponent(song.id)}/hqdefault.jpg" alt="" loading="lazy"></span>
    <span class="card-title">${escapeHtml(songName(song))}</span>
    <span class="card-subtitle">${escapeHtml(song.artist || song.title)}</span>
  </a>`).join("");
indexHtml = indexHtml.replace(/<div class="song-grid" id="catalog-grid"[^>]*>[\s\S]*?<\/div>\s*<p class="catalog-note"/,
  `<div class="song-grid" id="catalog-grid" aria-live="polite">${staticSongLinks}</div>\n          <p class="catalog-note"`);
fs.writeFileSync(indexPath, indexHtml, "utf8");

console.log(`Prerendered ${songs.length} song pages.`);
