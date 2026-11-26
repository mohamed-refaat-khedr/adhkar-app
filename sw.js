/* أذكار المسلم — Service Worker
   يخزّن واجهة التطبيق (الصفحة والأيقونات والخطوط وصورة محمد رفعت) عند أول تحميل،
   فيعمل التطبيق من غير إنترنت للقراءة والعدّادات.
   الصوت الآن ملفات محلية في مجلد audio/ وتُخزَّن عند أول تشغيل لكل ذكر،
   فيعمل التطبيق كاملًا من غير إنترنت ومن غير أي اعتماد خارجي. */

var CACHE_NAME = "adhkar-muslim-v2";
var AUDIO_CACHE = "adhkar-muslim-audio-v1";
var FONT_CACHE = "adhkar-muslim-fonts-v1";

var APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./mohamed-refaat.jpg"
];

var FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800;900&display=swap";

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return caches.open(FONT_CACHE);
      })
      .then(function (fontCache) {
        /* خطوط جوجل اختيارية للتخزين: لو فشلت لا يفشل التثبيت كله */
        return fontCache.add(FONT_CSS).catch(function () {});
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys.map(function (key) {
            if (key !== CACHE_NAME && key !== FONT_CACHE && key !== AUDIO_CACHE) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;

  var url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }

  /* أي طلب لمستودع GitHub خارجي (لم يعد يستخدمه التطبيق): شبكة فقط */
  if (
    url.hostname === "raw.githubusercontent.com" ||
    url.hostname === "github.com"
  ) {
    return;
  }

  /* الصوت المحلي: من ذاكرة الصوت أولًا، ويُحفظ عند أول تشغيل ناجح */
  if (url.origin === self.location.origin && url.pathname.indexOf(".mp3") !== -1) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (response) {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  /* خطوط جوجل: من الذاكرة أولًا، وتُحفظ عند أول تحميل ناجح */
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.open(FONT_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (response) {
            if (response && (response.status === 200 || response.type === "opaque")) {
              cache.put(request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  /* أي طلب خارجي آخر: شبكة فقط */
  if (url.origin !== self.location.origin) return;

  /* ملفات التطبيق نفسها: من الذاكرة أولًا، مع تحديثها من الشبكة عند توفرها */
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(request, { ignoreSearch: true }).then(function (cached) {
        var network = fetch(request)
          .then(function (response) {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(function () {
            if (request.mode === "navigate") {
              return cache.match("./index.html");
            }
            return cached;
          });
        return cached || network;
      });
    })
  );
});
