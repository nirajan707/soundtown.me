const songs = [
  {
    id: "small-hours",
    title: "Small Hours",
    artist: "June Wilder",
    album: "The Quiet Between",
    genre: "Indie",
    color: "#788363",
    glyph: "☾",
    lyrics: [
      "The kitchen clock is learning how to whisper<br>While the whole wide house is fast asleep<br>I trace the shape of every little maybe<br>In the quiet that the midnight keeps",
      "If the morning finds us different<br>Let it find us standing near<br>Somewhere in these small hours<br>I can hear the future clear",
      "We don't need a map to find the feeling<br>We don't need a reason to begin<br>Leave a little light on in the hallway<br>I'll come home by following it in"
    ],
    chorusIndex: 1
  },
  {
    id: "blue-window",
    title: "Blue Window",
    artist: "Milo & The Sunday",
    album: "Open Rooms",
    genre: "Soul",
    color: "#788ca0",
    glyph: "◉",
    lyrics: [
      "Rain writes little letters on the glass<br>Every one says take your time<br>And the city wears its evening slowly<br>Like a coat it doesn't mind",
      "There's a blue window in the evening<br>Where the tired heart learns to rest<br>All the things we couldn't carry<br>Settle softly in the west",
      "You laugh, the whole room changes color<br>Even grey has somewhere left to go<br>I keep finding reasons in the ordinary<br>Little seeds beneath the snow"
    ],
    chorusIndex: 1
  },
  {
    id: "paper-moon",
    title: "Paper Moon",
    artist: "The Fern Letters",
    album: "Somewhere, Slowly",
    genre: "Folk",
    color: "#b68c72",
    glyph: "☼",
    lyrics: [
      "We cut a paper moon from yesterday's news<br>Hung it from a string above the stairs<br>You said even make-believe can guide you<br>If you look at it like someone cares",
      "Under our paper moon<br>Every little road leads home<br>We can make a sky from nothing<br>We can make a place our own",
      "When the morning pulled the dark to pieces<br>We let the silver circles fall<br>Some things only shine because we made them<br>Some things never needed stars at all"
    ],
    chorusIndex: 1
  },
  {
    id: "soft-landing",
    title: "Soft Landing",
    artist: "Lena Sol",
    album: "Ways of Returning",
    genre: "Pop",
    color: "#bb8f91",
    glyph: "✳",
    lyrics: [
      "I took the long way past the corner store<br>Just to let the day unwind<br>The world was loud with open endings<br>So I left a few behind",
      "Give me a soft landing<br>A little room to change my mind<br>Give me the kind of morning<br>That doesn't ask me to be fine",
      "The sun came through in unexpected pieces<br>On the old familiar floor<br>Maybe healing isn't quite a doorway<br>Maybe it's an open door"
    ],
    chorusIndex: 1
  },
  {
    id: "wildflower-season",
    title: "Wildflower Season",
    artist: "Arlo Finch",
    album: "A Map of Almost",
    genre: "Folk",
    color: "#a49a69",
    glyph: "❋",
    lyrics: [
      "You kept a little garden in the gravel<br>Where the old train used to turn<br>Every stubborn green and golden thing<br>Had a lesson left to learn",
      "It's wildflower season, darling<br>Nothing has to bloom in rows<br>Take the shape the sunlight gives you<br>Find your way and let it grow",
      "We were made of all the things we almost said<br>And every promise we outgrew<br>Still the field goes on forgiving<br>Every sky that isn't blue"
    ],
    chorusIndex: 1
  },
  {
    id: "after-the-glow",
    title: "After the Glow",
    artist: "Velvet Morning",
    album: "Rooms With the Lights On",
    genre: "Indie",
    color: "#9283a1",
    glyph: "✦",
    lyrics: [
      "The last song drifts away between the buildings<br>And the sidewalk holds the warmth awhile<br>We stay until the room is only breathing<br>And the quiet almost looks like a smile",
      "After the glow, after the gold<br>After the story gets quiet and old<br>I'll still be here, walking you home<br>Learning the dark by the light that we know",
      "The night is not a thing to overcome<br>It's just a softer way to see<br>How every little light along the road<br>Was waiting there for you and me"
    ],
    chorusIndex: 1
  }
];

const savedSongs = new Set();
let selectedGenre = "All";
let currentSong = songs[0];
let activeView = "discover";
let toastTimer;

const songGrid = document.querySelector("#song-grid");
const searchInput = document.querySelector("#song-search");
const readerCard = document.querySelector("#reader-card");

function getVisibleSongs() {
  const query = searchInput.value.trim().toLowerCase();
  return songs.filter((song) => {
    const matchesGenre = selectedGenre === "All" || song.genre === selectedGenre;
    const matchesQuery = !query || [song.title, song.artist, song.album, song.genre].some((value) => value.toLowerCase().includes(query));
    const matchesView = activeView !== "saved" || savedSongs.has(song.id);
    return matchesGenre && matchesQuery && matchesView;
  });
}

function renderSongs() {
  const visibleSongs = getVisibleSongs();
  songGrid.innerHTML = visibleSongs.map((song) => `
    <article class="song-card${song.id === currentSong.id ? " is-current" : ""}" data-song-id="${song.id}" tabindex="0" role="button" aria-label="Read ${song.title} by ${song.artist}">
      <div class="card-cover" style="background:${song.color}">
        <span class="cover-glyph" aria-hidden="true">${song.glyph}</span>
        <span class="card-number">${String(songs.indexOf(song) + 1).padStart(2, "0")}</span>
        <button class="card-save${savedSongs.has(song.id) ? " is-saved" : ""}" data-save-id="${song.id}" aria-label="${savedSongs.has(song.id) ? "Remove" : "Save"} ${song.title}" title="${savedSongs.has(song.id) ? "Remove from saved" : "Save lyrics"}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.7L6 21V4.8Z" /></svg>
        </button>
      </div>
      <div class="card-info">
        <span class="card-genre">${song.genre} · ORIGINAL</span>
        <h3>${song.title}</h3>
        <p>${song.artist} <span>·</span> ${song.album}</p>
      </div>
    </article>
  `).join("");
  document.querySelector("#song-total").textContent = `${String(visibleSongs.length).padStart(2, "0")} SONG${visibleSongs.length === 1 ? "" : "S"}`;
  document.querySelector("#empty-state").hidden = visibleSongs.length > 0;
  songGrid.hidden = visibleSongs.length === 0;
}

function renderReader(song) {
  currentSong = song;
  document.querySelector("#reader-title").textContent = song.title;
  document.querySelector("#reader-artist").innerHTML = `${song.artist} <span>·</span> <span id="reader-album">${song.album}</span>`;
  document.querySelector("#reader-cover").style.background = song.color;
  document.querySelector("#cover-glyph").textContent = song.glyph;
  document.querySelector("#cover-index").textContent = `NO. ${String(songs.indexOf(song) + 1).padStart(2, "0")}`;
  document.querySelector("#reader-lyrics").innerHTML = song.lyrics.map((verse, index) =>
    `<p${index === song.chorusIndex ? ' class="chorus"' : ""}>${verse.replace(/\n/g, "<br>")}</p>`
  ).join("");
  const saveButton = document.querySelector("#reader-save");
  saveButton.classList.toggle("is-saved", savedSongs.has(song.id));
  saveButton.setAttribute("aria-label", `${savedSongs.has(song.id) ? "Remove" : "Save"} lyrics`);
  renderSongs();
}

function updateSavedCount() {
  document.querySelector("#saved-count").textContent = savedSongs.size;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function toggleSaved(songId) {
  const song = songs.find((item) => item.id === songId);
  if (!song) return;
  if (savedSongs.has(songId)) {
    savedSongs.delete(songId);
    showToast(`Removed “${song.title}” from your saved lyrics`);
  } else {
    savedSongs.add(songId);
    showToast(`“${song.title}” saved for later`);
  }
  updateSavedCount();
  renderSongs();
  if (currentSong.id === songId) {
    document.querySelector("#reader-save").classList.toggle("is-saved", savedSongs.has(songId));
  }
}

songGrid.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-id]");
  if (saveButton) {
    event.stopPropagation();
    toggleSaved(saveButton.dataset.saveId);
    return;
  }
  const card = event.target.closest("[data-song-id]");
  if (!card) return;
  const song = songs.find((item) => item.id === card.dataset.songId);
  if (song) {
    renderReader(song);
    readerCard.classList.add("is-open");
  }
});

songGrid.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-song-id]")) {
    event.preventDefault();
    const song = songs.find((item) => item.id === event.target.dataset.songId);
    if (song) {
      renderReader(song);
      readerCard.classList.add("is-open");
    }
  }
});

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    selectedGenre = button.dataset.genre;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("is-selected", chip === button));
    renderSongs();
  });
});

searchInput.addEventListener("input", renderSongs);
document.querySelector("#clear-filters").addEventListener("click", () => {
  searchInput.value = "";
  selectedGenre = "All";
  activeView = "discover";
  document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("is-selected", chip.dataset.genre === "All"));
  setActiveView("discover");
  renderSongs();
});

function setActiveView(view) {
  activeView = view;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("is-active", item.dataset.view === view));
  document.querySelector("#page-label").textContent = view === "saved" ? "Saved lyrics" : "Discover";
  document.querySelector("#library-heading").innerHTML = view === "saved" ? "Your saved <em>words.</em>" : "Words worth <em>keeping.</em>";
  renderSongs();
}

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => setActiveView(button.dataset.view)));
document.querySelector("#reader-save").addEventListener("click", () => toggleSaved(currentSong.id));
document.querySelector("#close-reader").addEventListener("click", () => readerCard.classList.remove("is-open"));
document.querySelector("#copy-lyrics").addEventListener("click", async () => {
  const text = `${currentSong.title} — ${currentSong.artist}\n\n${currentSong.lyrics.join("\n\n").replace(/<br>/g, "\n")}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Lyrics copied to your clipboard");
  } catch {
    showToast("Clipboard access isn't available in this browser");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") readerCard.classList.remove("is-open");
});

const dateFormatter = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" });
document.querySelector("#today-date").textContent = dateFormatter.format(new Date()).toUpperCase();
renderReader(currentSong);
updateSavedCount();
