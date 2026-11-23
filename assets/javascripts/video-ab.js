/* A/B trailer events for GoatCounter. Cookieless; assignment lives in localStorage. */
(function () {
  if (window.__videoAbBound) return;
  window.__videoAbBound = true;
  window.__videoAbEvents = window.__videoAbEvents || [];

  function logEvent(path, title) {
    var ev = { path: path, title: title || path, event: true };
    window.__videoAbEvents.push(ev);
    if (window.console && typeof console.debug === "function") {
      console.debug("[video-ab]", ev.path, ev.title);
    }
    var payload = { path: ev.path, title: ev.title, event: true };
    if (window.goatcounter && typeof window.goatcounter.count === "function") {
      window.goatcounter.count(payload);
    } else {
      window.goatcounter = window.goatcounter || {};
      (window.goatcounter.queue = window.goatcounter.queue || []).push(payload);
    }
  }

  function isBookOrBuyLink(href) {
    return /\/products\/|amazon\.com|bookshop\.org|barnesandnoble\.com|walmart\.com/i.test(href || "");
  }

  function setup(video) {
    if (video.getAttribute("data-video-ab-ready")) return;
    var test = video.getAttribute("data-video-ab");
    if (!test) return;
    var variant = video.getAttribute("data-variant");
    if (!variant) {
      var dataEl = video.parentElement && video.parentElement.querySelector(".js-video-ab-variants");
      if (dataEl) {
        try {
          var variants = JSON.parse(dataEl.textContent);
          if (variants && variants[0]) {
            variant = variants[0].id;
            video.setAttribute("data-variant", variant);
          }
        } catch (e) {}
      }
    }
    if (!variant) return;
    video.setAttribute("data-video-ab-ready", "1");

    var prefix = "video-ab/" + test + "/" + variant + "/";
    logEvent(prefix + "impression", "Video shown: " + test + " / " + variant);

    var played = false;
    var watched = false;
    video.addEventListener("play", function () {
      if (played) return;
      played = true;
      logEvent(prefix + "play", "Video play: " + test + " / " + variant);
    });
    function checkWatch() {
      if (watched) return;
      if (video.duration && video.currentTime / video.duration >= 0.75) {
        watched = true;
        logEvent(prefix + "watch75", "Video 75%: " + test + " / " + variant);
      }
    }
    video.addEventListener("timeupdate", checkWatch);
    video.addEventListener("seeked", checkWatch);
    video.addEventListener("ended", checkWatch);

    document.addEventListener("click", function (event) {
      var link = event.target && event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      var href = link.getAttribute("href") || "";
      if (!isBookOrBuyLink(href)) return;
      var label = (link.getAttribute("aria-label") || link.textContent || href)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      logEvent(prefix + "click", "Book/buy click (" + variant + "): " + label);
    }, true);
  }

  function init() {
    var videos = document.querySelectorAll("video[data-video-ab]");
    for (var i = 0; i < videos.length; i++) setup(videos[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
