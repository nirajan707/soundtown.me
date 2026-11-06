(() => {
  const consentKey = "soundtown-cookie-consent";
  const banner = document.querySelector("#cookie-banner");
  if (!banner) return;

  let consent;
  try {
    consent = window.localStorage.getItem(consentKey);
  } catch (error) {
    console.warn("Cookie consent preference could not be read.", error);
  }
  if (consent) return;

  banner.hidden = false;
  banner.querySelectorAll("[data-cookie-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.cookieChoice;
      try {
        window.localStorage.setItem(consentKey, choice);
      } catch (error) {
        console.warn("Cookie consent preference could not be saved.", error);
      }
      banner.hidden = true;
    });
  });
})();
