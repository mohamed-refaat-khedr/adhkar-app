/* أذكار المسلم — Service Worker
   يخزّن واجهة التطبيق وكل ملفات الصوت الـ 88 عند أول تحميل بالإنترنت،
   فيعمل التطبيق كاملًا من غير إنترنت: القراءة والعدّادات والصوت.
   ملفات الصوت تُنزَّل كاملة عند التثبيت، وطلبات المدى (Range) التي
   يرسلها مشغّل الصوت تُقدَّم من النسخة المخزنة حتى يعمل التشغيل دون اتصال. */

var CACHE_NAME = "adhkar-muslim-v3";
var AUDIO_CACHE = "adhkar-muslim-audio-v2";
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

var AUDIO_FILES = [
  "./audio/1.mp3",
  "./audio/2.mp3",
  "./audio/3.mp3",
  "./audio/4.mp3",
  "./audio/16.mp3",
  "./audio/17.mp3",
  "./audio/18.mp3",
  "./audio/66.mp3",
  "./audio/67.mp3",
  "./audio/68.mp3",
  "./audio/69.mp3",
  "./audio/70.mp3",
  "./audio/71.mp3",
  "./audio/72.mp3",
  "./audio/73.mp3",
  "./audio/75.mp3",
  "./audio/76.mp3",
  "./audio/77.mp3",
  "./audio/78.mp3",
  "./audio/79.mp3",
  "./audio/80.mp3",
  "./audio/81.mp3",
  "./audio/82.mp3",
  "./audio/83.mp3",
  "./audio/84.mp3",
  "./audio/85.mp3",
  "./audio/86.mp3",
  "./audio/87.mp3",
  "./audio/88.mp3",
  "./audio/89.mp3",
  "./audio/90.mp3",
  "./audio/91.mp3",
  "./audio/92.mp3",
  "./audio/93.mp3",
  "./audio/94.mp3",
  "./audio/95.mp3",
  "./audio/96.mp3",
  "./audio/97.mp3",
  "./audio/98.mp3",
  "./audio/99.mp3",
  "./audio/100.mp3",
  "./audio/101.mp3",
  "./audio/102.mp3",
  "./audio/103.mp3",
  "./audio/104.mp3",
  "./audio/105.mp3",
  "./audio/106.mp3",
  "./audio/107.mp3",
  "./audio/108.mp3",
  "./audio/109.mp3",
  "./audio/110.mp3",
  "./audio/111.mp3",
  "./audio/120.mp3",
  "./audio/121.mp3",
  "./audio/122.mp3",
  "./audio/123.mp3",
  "./audio/124.mp3",
  "./audio/125.mp3",
  "./audio/156.mp3",
  "./audio/157.mp3",
  "./audio/158.mp3",
  "./audio/159.mp3",
  "./audio/163.mp3",
  "./audio/164.mp3",
  "./audio/178.mp3",
  "./audio/179.mp3",
  "./audio/180.mp3",
  "./audio/181.mp3",
  "./audio/206.mp3",
  "./audio/207.mp3",
  "./audio/248.mp3",
  "./audio/249.mp3",
  "./audio/250.mp3",
  "./audio/251.mp3",
  "./audio/252.mp3",
  "./audio/253.mp3",
  "./audio/254.mp3",
  "./audio/255.mp3",
  "./audio/256.mp3",
  "./audio/257.mp3",
  "./audio/258.mp3",
  "./audio/259.mp3",
  "./audio/260.mp3",
  "./audio/261.mp3",
  "./audio/262.mp3",
  "./audio/263.mp3",
  "./audio/264.mp3",
  "./audio/265.mp3"
];

var FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;800;900&display=swap";

/* يقدّم الجزء المطلوب من ملف صوتي كامل مخزّن، استجابة لطلب Range */
function rangedResponse(response, rangeHeader) {
  var m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
  if (!m) return Promise.resolve(response);
  return response.clone().arrayBuffer().then(function (buf) {
    var total = buf.byteLength;
    var start, end;
    if (m[1] === "") {
      /* صيغة اللاحقة bytes=-N: آخر N بايت من الملف */
      start = total - parseInt(m[2], 10);
      if (start < 0) start = 0;
      end = total - 1;
    } else {
      start = parseInt(m[1], 10);
      end = m[2] === "" ? total - 1 : parseInt(m[2], 10);
    }
    if (isNaN(start) || isNaN(end) || start < 0 || end < start || start >= total) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": "bytes */" + total }
      });
    }
    if (end >= total) end = total - 1;
    var slice = buf.slice(start, end + 1);
    return new Response(slice, {
      status: 206,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(end - start + 1),
        "Content-Range": "bytes " + start + "-" + end + "/" + total,
        "Accept-Ranges": "bytes"
      }
    });
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return caches.open(AUDIO_CACHE);
      })
      .then(function (audioCache) {
        /* تنزيل كل ملفات الصوت كاملة عند أول تحميل: فشل ملف واحد
           لا يفشل التثبيت كله، وسيُعاد تنزيله عند أول تشغيل له */
        return Promise.all(
          AUDIO_FILES.map(function (url) {
            return audioCache.add(url).catch(function () {});
          })
        );
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

  /* الصوت المحلي: من ذاكرة الصوت أولًا (كاملة بعد التثبيت)،
     وطلبات Range تُقدَّم من النسخة المخزنة */
  if (url.origin === self.location.origin && url.pathname.indexOf(".mp3") !== -1) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(function (cache) {
        return cache.match(url.href, { ignoreSearch: true }).then(function (cached) {
          var range = request.headers.get("Range");
          if (cached) {
            if (range) return rangedResponse(cached, range);
            return cached;
          }
          /* غير مخزّن بعد: نزّل الملف كاملًا (بدون Range) وخزّنه، ثم قدّم المطلوب */
          return fetch(url.href)
            .then(function (response) {
              if (response && response.status === 200) {
                cache.put(url.href, response.clone());
                if (range) return rangedResponse(response, range);
                return response;
              }
              return response;
            })
            .catch(function () {
              return Response.error();
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
