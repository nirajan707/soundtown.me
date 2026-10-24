const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const repositoryRoot = path.resolve(__dirname, "..");
const songsSource = fs.readFileSync(path.join(repositoryRoot, "songs.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(songsSource, context);

const configuredSiteUrl = new URL(process.env.SITE_URL || "https://soundtown.me/");
configuredSiteUrl.pathname = "/";
configuredSiteUrl.search = "";
configuredSiteUrl.hash = "";
const urls = [
  configuredSiteUrl.href,
  ...context.window.SOUNDTOWN_SONGS.map((song) => {
    const url = new URL(configuredSiteUrl.href);
    url.searchParams.set("song", song.id);
    return url.href;
  })
];
const entries = urls.map((url, index) => `  <url>
    <loc>${url.replace(/&/g, "&amp;")}</loc>
    <changefreq>${index === 0 ? "weekly" : "monthly"}</changefreq>
    <priority>${index === 0 ? "1.0" : "0.7"}</priority>
  </url>`).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;

fs.writeFileSync(path.join(repositoryRoot, "sitemap.xml"), sitemap);
console.log(`Wrote sitemap.xml with ${urls.length} URLs.`);
