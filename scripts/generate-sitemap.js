const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repositoryRoot = path.resolve(__dirname, "..");
const songsSource = fs.readFileSync(path.join(repositoryRoot, "songs-data-20261112.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(songsSource, context);

const configuredSiteUrl = new URL(process.env.SITE_URL || "https://soundtown.me/");
configuredSiteUrl.pathname = "/";
configuredSiteUrl.search = "";
configuredSiteUrl.hash = "";
const urls = [
  configuredSiteUrl.href,
  new URL("about.html", configuredSiteUrl.href).href,
  new URL("privacy-policy.html", configuredSiteUrl.href).href,
  ...context.window.SOUNDTOWN_SONGS
    .filter((song) => /^[A-Za-z0-9_-]{11}$/.test(song.id))
    .map((song) => new URL(`songs/${encodeURIComponent(song.id)}/`, configuredSiteUrl.href).href)
];
const entries = urls.map((url) => {
  const isHome = url === configuredSiteUrl.href;
  const isPolicy = url.endsWith("/privacy-policy.html");
  const isAbout = url.endsWith("/about.html");
  const isSong = url.includes("/songs/");
  return `  <url>
    <loc>${url.replace(/&/g, "&amp;")}</loc>
    <changefreq>${isHome ? "weekly" : isSong ? "monthly" : "yearly"}</changefreq>
    <priority>${isHome ? "1.0" : isPolicy || isAbout ? "0.5" : "0.7"}</priority>
  </url>`;
}).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

fs.writeFileSync(path.join(repositoryRoot, "sitemap.xml"), sitemap);
console.log(`Wrote sitemap.xml with ${urls.length} URLs.`);
