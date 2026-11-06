/* LIFE OS service worker. Generated at build time by scripts/finalize-web.cjs — do not edit dist copies.
 *
 * What it does:
 *  - keeps a copy of the app's own files (HTML, JS, fonts, icons, bundled pictures) so the installed app can start
 *    without internet;
 *  - always asks the network first for the page itself, so a newly published version is picked up on the next
 *    launch; the cached copy is used only when the network is unavailable or too slow;
 *  - removes caches of older versions (it keeps the previous one for pages that are still open).
 * What it never does:
 *  - touch IndexedDB or localStorage — records, photos and settings are not stored or deleted here;
 *  - handle requests to other sites (TMDB catalog Worker, image.tmdb.org, maps…): those go straight to the network;
 *  - cache anything that is not a public file of the app.
 */
const BUILD = '7fc41eaf4df10789';
const BASE = "/life-os";
const PRECACHE = ["/life-os/_expo/static/js/web/entry-f38ebdcb07473a72634355210846e7e2.js","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png","/life-os/assets/__node_modules/.pnpm/expo-router@58.0.29_f135c63fe1bd1adb01988179c66038a4/node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png","/life-os/assets/assets/approved/bag.5e16f742a010fa06c0a1876f7b6c2367.jpg","/life-os/assets/assets/approved/bowl.ae9f7dc029ddd2b8e078da878defabad.jpg","/life-os/assets/assets/approved/casserole.d9eb0408bc558defc868139a25b78cf3.jpg","/life-os/assets/assets/approved/chicken.03a22fff01fa300de5be7abfc2bb31f4.jpg","/life-os/assets/assets/approved/dyson.3378f2897276399d46d39cedb84c6d0e.jpg","/life-os/assets/assets/approved/iron.c96b6da6c73a6789962e983501ad1a6e.jpg","/life-os/assets/assets/approved/laptop.8e7d99c88c2a6b158428789322bfcdf2.jpg","/life-os/assets/assets/approved/magnesium.7ae8a920d11c7e123930dc6dd6c1c325.jpg","/life-os/assets/assets/approved/note0.7abcc66e6935eaa87e1088859f2ef88a.jpg","/life-os/assets/assets/approved/note1.5d7a4a2731c1be4863c9949f330ac360.jpg","/life-os/assets/assets/approved/note2.df704e89609a81813bb61b3f5f395218.jpg","/life-os/assets/assets/approved/note3.e2c275a80bde0b9c84877d91cb771b75.jpg","/life-os/assets/assets/approved/note4.1dcd4591c63946478e1fe3d9afbe53c3.jpg","/life-os/assets/assets/approved/note5.1a3367b9d7208d02f9a3e64e4af91c7e.jpg","/life-os/assets/assets/approved/note6.e48f3f3a9f57dd46afa5038dcad67c16.jpg","/life-os/assets/assets/approved/note7.80a85a76a220c14023ffd0edd8e268f1.jpg","/life-os/assets/assets/approved/note8.788a1f814c367d713174f16d9ca3ae85.jpg","/life-os/assets/assets/approved/oatmeal.214865cad626eff7bac1fd00372082b8.jpg","/life-os/assets/assets/approved/pancakes.f5f1bf7663d02c6f42aa99b750c08d8e.jpg","/life-os/assets/assets/approved/paper.1fa58d70fe6fa461c7d610d710683afa.jpg","/life-os/assets/assets/approved/plant.762a6746b9c459da43bf6c1991a78e57.jpg","/life-os/assets/assets/approved/shoe.a8972a4ba69710e2b348db514df2b8a8.jpg","/life-os/assets/assets/approved/soup.e6f2a12794fbd9dd32edef3b970bf39a.jpg","/life-os/assets/assets/approved/vitamin.9bd7286cd0ca53a54368fad186f4b151.jpg","/life-os/assets/assets/approved/watch.a54c56bba7d36ee9e4dd797d46d1de14.jpg","/life-os/assets/assets/attribution/tmdb.35cf0d50363737893ef309c3131b7b26.png","/life-os/assets/assets/editorial/bag-natural.11d870577b7a39e95a082c62303293f4.jpg","/life-os/assets/assets/editorial/cinema-natural.f8e46c1c83813694fbfa64b2a241e210.jpg","/life-os/assets/assets/editorial/food-natural.425bb60de924fafd3a183a4af642ef6b.jpg","/life-os/assets/assets/editorial/headphones.ce00e4cf74cbdd533538bb793c82299f.jpg","/life-os/assets/assets/editorial/health-natural.546e0a84a032af980f85fa5142fbaf30.jpg","/life-os/assets/assets/editorial/home-natural.f915f024f228f0b9f77cb3c4d7140cc7.jpg","/life-os/assets/assets/editorial/ideas-natural.30aa72424e5fbe861f48b6c57b08552f.jpg","/life-os/assets/assets/editorial/lamp.ad9c8b79bad663949618d2eeea3ca7c7.jpg","/life-os/assets/assets/editorial/perfume.69dab53d069548b79d250c18947b37a7.jpg","/life-os/assets/assets/editorial/reference-reading.187a4231bf161fc364f2b01971e41a1a.jpg","/life-os/assets/assets/editorial/reference-wellness.d40546e5bfc79dfee3fa93bf97afa410.jpg","/life-os/assets/assets/editorial/travel-natural.a876422ac34343e2dedf7381176b29ce.jpg","/life-os/assets/assets/editorial/wardrobe-natural.6229180567b21d8e338b86a7ab646982.jpg","/life-os/assets/assets/editorial/work-natural.d01e655177cb8cc7b7469af1319413f2.jpg","/life-os/assets/assets/fonts/Inter.bff0f6e3b9e2259a28313168a907054f.ttf","/life-os/assets/assets/meal-photos/01.c360d36aa4587ae0fa33575c1c3f1fee.jpg","/life-os/assets/assets/meal-photos/02.216979f2f46d791767317e27a646548a.jpg","/life-os/assets/assets/meal-photos/03.15d4a6968ccbac0603af59a77f96e581.jpg","/life-os/assets/assets/meal-photos/04.cbf8ebab992f3ee3cf365d7873869371.jpg","/life-os/assets/assets/meal-photos/05.12f41e70d8508fee9c03cc7f0ecff828.jpg","/life-os/assets/assets/meal-photos/06.39521c03aae2718d33b97fc22d04d801.jpg","/life-os/assets/assets/meal-photos/07.99e240ac021d0313f599669682e1f476.jpg","/life-os/assets/assets/meal-photos/08.421f982847d1edf13e931b9990a440fb.jpg","/life-os/assets/assets/meal-photos/09.baf198f0227dc797fc5603b584c1cdb4.jpg","/life-os/assets/assets/meal-photos/10.c4d0776535d750de61f578e60dcedc17.jpg","/life-os/assets/assets/meal-photos/11.5ff0826cd2ff20fe8abc02029836c858.jpg","/life-os/assets/assets/meal-photos/12.a73118fe80e788920f7182b5db8d6aa6.jpg","/life-os/assets/assets/meal-photos/13.d3535702db70094455e26ca0ce1f5c39.jpg","/life-os/assets/assets/meal-photos/14.4643122b0fd9b2dc2fbd416fa5338083.jpg","/life-os/assets/assets/meal-photos/15.9f3c31a5ae07dc3c3496527ad4b60b32.jpg","/life-os/assets/assets/meal-photos/16.b86f03696092e970566c4c28824a99e6.jpg","/life-os/assets/assets/meal-photos/17.62ef94bc65d1661a900560863f8a5c85.jpg","/life-os/assets/assets/meal-photos/18.0fc557481296cc28b6b7211a4b381db9.jpg","/life-os/assets/assets/meal-photos/19.bd44926c53add1cd4ff9ad8ab893a1c9.jpg","/life-os/assets/assets/meal-photos/20.d881fe44e18c68b6806ab41f4bbb8343.jpg","/life-os/assets/assets/meal-photos/21.b9828d27d20ad8b1c7af0ed34f888e24.jpg","/life-os/assets/assets/meal-photos/22.603d64ba131805ad3ed09d9cde04efe2.jpg","/life-os/assets/assets/meal-photos/23.c9d13937052c49a324957defe96b75a3.jpg","/life-os/assets/assets/meal-photos/24.6d34b1c2e6d446d2aace9c608984425e.jpg","/life-os/assets/assets/meal-photos/25.2f972e7df1fb316e2c822e6395d2eb36.jpg","/life-os/assets/assets/meal-photos/26.be9b55a4fb5b7d31a6852712c7d678d7.jpg","/life-os/assets/assets/meal-photos/27.f12e4323af9538989527a6d968a30524.jpg","/life-os/assets/assets/meal-photos/28.9347549ec11d15a29f2c6b823a17c3f8.jpg","/life-os/assets/assets/meal-photos/29.d807b352a744201d82f9423bf5a15071.jpg","/life-os/assets/assets/meal-photos/30.ba1c79c72114de91a351d6289f6b96f5.jpg","/life-os/assets/assets/meal-photos/31.7b24630328091971cb979d77de34b4f5.jpg","/life-os/assets/assets/meal-photos/32.203ccf7722c9edd4102e5f43c740ccfb.jpg","/life-os/assets/assets/meal-photos/33.e53a1b935a8c6af11608f938f1e3e963.jpg","/life-os/assets/assets/meal-photos/34.787e698cb22055968762d472a3cfed88.jpg","/life-os/assets/assets/meal-photos/35.b6757420d6b364ec41f2df63bfa1dbd3.jpg","/life-os/assets/assets/meal-photos/36.4ab7a2723d4b283f4fbfd681eb8927bc.jpg","/life-os/assets/assets/meal-photos/37.22f9b3b60671674fd77d5d0f2c3227e6.jpg","/life-os/assets/assets/meal-photos/38.c4c16281c2ef66e6d23b4bd9f44feebe.jpg","/life-os/assets/assets/meal-photos/39.802ea755aaed64bae3e03c656a4de653.jpg","/life-os/assets/assets/meal-photos/40.60c8b82cfffc51a4ecccff94d3559073.jpg","/life-os/assets/assets/meal-photos/41.b30656c685a2ea7d1d270d471b861b0d.jpg","/life-os/assets/assets/meal-photos/42.c9f0a39d73f283191fe3ea147d3b7d0a.jpg","/life-os/assets/assets/meal-photos/43.8710049f1fb8b3f8628ca2cee33bccf8.jpg","/life-os/assets/assets/meal-photos/44.230ed5f39ac0d534b764669a098bb677.jpg","/life-os/assets/assets/meal-photos/45.878ef11e2b0ef7bf93c83ddd6244760b.jpg","/life-os/assets/assets/meal-photos/46.e2dc72ae7cd62d7992db832cc2d4b4d3.jpg","/life-os/assets/assets/meal-photos/47.f795b915298f0e02ca1eabf5aea04fd4.jpg","/life-os/assets/assets/meal-photos/48.e39ffccb459135fea35b0eaacc9ca8fa.jpg","/life-os/assets/assets/meal-photos/49.93fbaeb510738ceac63bb67818596f60.jpg","/life-os/assets/assets/meal-photos/50.203edf6c97846ef1696bc313d4e3dc0d.jpg","/life-os/assets/assets/meal-photos/51.74237db5e339095b128bb8acb8972ec4.jpg","/life-os/assets/assets/meal-photos/52.39beada1e917381d8a70cbbf1fe043d5.jpg","/life-os/assets/assets/meal-photos/53.36a75034c2ff7a04c465f0d9fa7109e9.jpg","/life-os/assets/assets/meal-photos/54.768378f30a1f605ed553e327bcbfe4a3.jpg","/life-os/assets/assets/meal-photos/55.a2cf5e684305a9d864c528b312ca9284.jpg","/life-os/assets/assets/meal-photos/56.a6e0a8854492625a3bcf26109e707b71.jpg","/life-os/assets/assets/meal-photos/57.0cf78e165a86c0cc3bcc36d9c65ee94c.jpg","/life-os/assets/assets/meal-photos/58.ae5159de7b0d233bab3a2eb5dbaaa4d3.jpg","/life-os/assets/assets/meal-photos/59.e9347bddc9e8fc8d0d48fa05670c4369.jpg","/life-os/assets/assets/meal-photos/60.b9fe81f226248c91cac72a0a7e8aa9e2.jpg","/life-os/assets/assets/meal-photos/61.ba4744247141fc5b3ab6e7aa61517934.jpg","/life-os/assets/assets/meal-photos/62.d280c866f8d7a49041743312aa8b94a9.jpg","/life-os/assets/assets/meal-photos/63.250db5ecc8fda875260a9ed93502f27d.jpg","/life-os/assets/assets/meal-photos/64.e8a3016c82e79abc6f4bb3f602559943.jpg","/life-os/assets/assets/meal-photos/65.3dd2637a928057007b8c482b9503373d.jpg","/life-os/assets/assets/meal-photos/66.7a6abd953cb0776e5ab881278d06a991.jpg","/life-os/assets/assets/meal-photos/67.d9d58db9cc337906091e79c6c36fca5f.jpg","/life-os/assets/assets/meal-photos/68.d111a8a6f064ff0909eb451ce5575a3c.jpg","/life-os/assets/assets/meal-photos/69.72fafe9c6d5a81ccff4f3e75c6d51ab2.jpg","/life-os/assets/assets/meal-photos/70.5e6568564ee2feeb49060d06866caad8.jpg","/life-os/assets/assets/meal-photos/71.633e529b6963194cdc0b3dabdbda8d8f.jpg","/life-os/assets/assets/meal-photos/72.afb1ff92c17937a9ff8cea1be0cd9b76.jpg","/life-os/assets/assets/meal-photos/73.faca51d0044fffb00976c77ba479bc85.jpg","/life-os/assets/assets/meal-photos/74.41d2fa64d4326e0caf9114421855e20b.jpg","/life-os/assets/assets/meal-photos/75.4d580f1de786b8b7a24fc563c1dd8715.jpg","/life-os/assets/assets/meal-photos/76.4e9c5ae080f4d973a008c58fb68ea4f8.jpg","/life-os/assets/assets/meal-photos/77.7434594f46f084c1c81823f701f9162a.jpg","/life-os/icons/apple-touch-icon.png","/life-os/icons/favicon-48.png","/life-os/icons/icon-192.png","/life-os/icons/icon-512.png","/life-os/icons/icon-maskable-512.png","/life-os/","/life-os/manifest.webmanifest"];
const PREFIX = 'life-os-app-';
const CACHE = PREFIX + BUILD;
const SHELL = BASE + '/';
const NETWORK_TIMEOUT = 4000;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Best effort per file: one missing picture must not block the update.
    await Promise.all(PRECACHE.map(url => fetch(url, {cache: 'reload'}).then(r => r.ok ? cache.put(url, r) : undefined).catch(() => undefined)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = (await caches.keys()).filter(k => k.startsWith(PREFIX));
    const meta = await Promise.all(keys.map(async k => {
      const r = await (await caches.open(k)).match('__created__');
      return {k, t: r ? Number(await r.text()) : 0};
    }));
    await (await caches.open(CACHE)).put('__created__', new Response(String(Date.now())));
    const older = meta.filter(m => m.k !== CACHE).sort((a, b) => b.t - a.t);
    await Promise.all(older.slice(1).map(m => caches.delete(m.k)));
    await self.clients.claim();
  })());
});

const timeout = ms => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !(url.pathname === BASE || url.pathname.startsWith(BASE + '/'))) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await Promise.race([fetch(request, {cache: 'no-cache'}), timeout(NETWORK_TIMEOUT)]);
        // GitHub Pages answers inner routes with 404.html (status 404) — it is the same app shell.
        if ((response.ok || response.status === 404) && (response.headers.get('content-type') || '').includes('text/html')) {
          cache.put(SHELL, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        return (await cache.match(SHELL)) || (await caches.match(SHELL)) || Response.error();
      }
    })());
    return;
  }

  // Hashed build files never change under the same name: cache first.
  const immutable = /\/_expo\/static\/|\/assets\/.+\.[0-9a-f]{20,}\./.test(url.pathname);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (immutable) {
      const hit = await caches.match(request);
      if (hit) return hit;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    }
    // Manifest, icons and other unhashed files: network first, cached copy offline.
    try {
      const response = await fetch(request, {cache: 'no-cache'});
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    } catch {
      return (await caches.match(request)) || Response.error();
    }
  })());
});
