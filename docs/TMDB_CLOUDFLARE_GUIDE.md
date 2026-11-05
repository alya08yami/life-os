# Постеры фильмов: TMDB через Cloudflare Worker — пошаговая инструкция

5 ноября 2026. Ничего из этого ещё не развёрнуто и не подключено.

**Главное правило:**
- ключ TMDB вы вставляете **только** в настройки Worker на сайте Cloudflare;
- его не нужно присылать в чат, класть в репозиторий, `.env` или в код приложения.

## Как это будет работать

```
LIFE OS (телефон / GitHub Pages)  →  ваш Worker на Cloudflare  →  api.themoviedb.org
      без ключа                     ключ хранится в секрете Worker     постеры: image.tmdb.org
```

- Приложение знает только **публичный адрес** Worker (например, `https://life-os-catalog.<ваше-имя>.workers.dev`).
- Ключ живёт в секрете Worker и наружу не отдаётся.
- Постеры грузятся напрямую с `image.tmdb.org` по пути, который вернул TMDB. Ключ для этого не нужен.

---

## 1. Регистрация и доступ к TMDB API

1. Зарегистрируйтесь на https://www.themoviedb.org/signup и подтвердите почту.
2. Откройте **Профиль → Settings → API** (https://www.themoviedb.org/settings/api).
3. Нажмите **Create / Request an API key**:
   - тип — **Developer** (личный, некоммерческий проект);
   - примите условия;
   - **Application name:** `LIFE OS (personal)`;
   - **Application URL:** `https://alya08yami.github.io/life-os/`;
   - **Application summary:** «Личное приложение-органайзер; поиск фильмов и постеров для своей коллекции, без коммерческого использования».
4. На той же странице появятся два значения:
   - **API Key** (короткий, 32 символа);
   - **API Read Access Token** (длинный, начинается с `eyJ…`).
   
   По документации TMDB они дают одинаковый доступ. Нам нужен **API Read Access Token**: его ждёт код Worker ниже и существующий сервер `apps/server`.
5. Никуда его не копируйте, кроме шага 4 этой инструкции.

## 2. Условия использования и атрибуция

Прочитайте и примите сами: https://www.themoviedb.org/api-terms-of-use. Текст условий я не смог открыть автоматически — сайт запрещает это роботам. Ниже — по официальному FAQ (https://developer.themoviedb.org/docs/faq):

- **Бесплатно** для некоммерческого использования при указании TMDB как источника. Если приложение начнёт приносить доход, нужна коммерческая лицензия.
- **Атрибуция обязательна:**
  - логотип TMDB из официального набора, менее заметный, чем логотип LIFE OS;
  - фраза **«This product uses the TMDB API but is not endorsed or certified by TMDB.»**;
  - размещение в разделе «О приложении / Благодарности».
  
  В LIFE OS уже есть компонент `Credits` с логотипом. На подэтапе A2 я выведу его в «Профиль → О приложении» и мелкой подписью под результатами поиска.
- **Нагрузка:** у TMDB нет дневного лимита, но около 40 запросов в секунду — верхняя граница против массового скачивания. Для личной коллекции это недостижимо. При ответе 429 Worker просто сообщит «попробуйте позже».

## 3. Создание Cloudflare Worker (без установки программ)

1. Зарегистрируйтесь на https://dash.cloudflare.com/sign-up (бесплатный план). Привязывать карту не нужно.
2. **Workers & Pages → Create → Create Worker** (шаблон «Hello World»):
   - имя: `life-os-catalog`;
   - **Deploy**.
   
   Адрес будет вида `https://life-os-catalog.<ваш-поддомен>.workers.dev`.
3. **Edit code** → замените весь код на шаблон ниже → **Deploy**.

```js
// LIFE OS · каталог фильмов (посредник TMDB). Ключ — только в секрете TMDB_TOKEN.
const ALLOWED_ORIGINS = ['https://alya08yami.github.io', 'http://localhost:8081', 'http://127.0.0.1:8081'];
const LANG = { ru: 'ru-RU', uk: 'uk-UA', en: 'en-US' };
const ATTRIBUTION = 'This product uses the TMDB API but is not endorsed or certified by TMDB.';
const safePath = p => (typeof p === 'string' && /^\/[A-Za-z0-9_.-]+$/.test(p) ? p : undefined);

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const cors = {
      'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    // Браузер с чужого сайта не получит ответ; приложение на телефоне Origin не отправляет.
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'forbidden' }, 403, cors);
    if (request.method !== 'GET') return json({ error: 'method' }, 405, cors);
    if (!env.TMDB_TOKEN) return json({ error: 'catalog_unavailable' }, 503, cors);

    const url = new URL(request.url);
    const language = LANG[url.searchParams.get('locale')] ?? 'ru-RU';
    let target;
    if (url.pathname === '/search') {
      const query = (url.searchParams.get('query') ?? '').trim();
      if (!query || query.length > 200) return json({ error: 'invalid_input' }, 400, cors);
      target = new URL('https://api.themoviedb.org/3/search/multi');
      target.searchParams.set('query', query);
      target.searchParams.set('include_adult', 'false');
    } else {
      const m = url.pathname.match(/^\/(movie|tv)\/(\d{1,9})$/);
      if (!m) return json({ error: 'not_found' }, 404, cors);
      target = new URL(`https://api.themoviedb.org/3/${m[1]}/${m[2]}`);
      target.searchParams.set('append_to_response', 'videos');
    }
    target.searchParams.set('language', language);

    // Кэш на сутки: повторные поиски не тратят запросы TMDB (на адресе workers.dev кэш Cloudflare не действует — это безвредно; заработает со своим доменом).
    const cacheKey = new Request(target.toString());
    const cache = caches.default;
    let upstream = await cache.match(cacheKey);
    if (!upstream) {
      upstream = await fetch(target, { headers: { Authorization: `Bearer ${env.TMDB_TOKEN}`, accept: 'application/json' } });
      if (upstream.status === 429) return json({ error: 'rate_limited' }, 429, cors);
      if (!upstream.ok) return json({ error: 'catalog_unavailable' }, 502, cors);
      upstream = new Response(upstream.body, upstream);
      upstream.headers.set('Cache-Control', 'public, max-age=86400');
      ctx.waitUntil(cache.put(cacheKey, upstream.clone()));
    }
    const data = await upstream.json();

    if (url.pathname === '/search') {
      const results = (data.results ?? [])
        .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
        .slice(0, 10)
        .map(r => ({
          id: r.id, mediaType: r.media_type, title: r.title ?? r.name,
          originalTitle: r.original_title ?? r.original_name, description: r.overview,
          year: String(r.release_date ?? r.first_air_date ?? '').slice(0, 4), posterPath: safePath(r.poster_path),
        }));
      return json({ results, attribution: ATTRIBUTION }, 200, cors);
    }
    const trailer = data.videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer' && /^[A-Za-z0-9_-]{6,30}$/.test(v.key));
    return json({
      id: data.id, title: data.title ?? data.name, originalTitle: data.original_title ?? data.original_name,
      year: Number(String(data.release_date ?? data.first_air_date ?? '').slice(0, 4)) || undefined,
      description: data.overview || undefined, genres: data.genres?.map(g => g.name),
      runtimeMinutes: data.runtime || undefined, posterPath: safePath(data.poster_path),
      trailerUrl: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : undefined, attribution: ATTRIBUTION,
    }, 200, cors);
  },
};
const json = (body, status, cors) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' } });
```

Шаблон делает то же, что уже умеет `apps/server` (поиск фильмов и сериалов, детали с трейлером), и больше ничего. Никаких данных вашей коллекции Worker не получает — только текст поиска.

## 4. Безопасное добавление ключа в секреты Worker

1. В Worker: **Settings → Variables and Secrets → Add**.
2. **Type: Secret**, **Name:** `TMDB_TOKEN`, **Value:** ваш API Read Access Token из шага 1.
3. **Deploy**.

После этого Cloudflare значение **не показывает** ни вам, ни в журнале — только сам Worker читает его как `env.TMDB_TOKEN`.

Для сведения, вариант через терминал: `npx wrangler secret put TMDB_TOKEN`. Он спрашивает значение интерактивно, в историю команд оно не попадает. Для вас достаточно сайта, установка не нужна.

**Чего не делать:**
- не вставлять ключ в код Worker;
- не вставлять его в «Variables» (Text) — это не секрет;
- не добавлять в `.env`, `EXPO_PUBLIC_*`, GitHub, сообщения.

## 5. Связь Worker с LIFE OS на GitHub Pages

Это делаю я на подэтапе A2, после вашего подтверждения.

1. Вы присылаете **только адрес** Worker (`https://life-os-catalog.….workers.dev`). Это не секрет.
2. В приложении появляется настройка адреса каталога:
   - `EXPO_PUBLIC_CATALOG_URL` при сборке Pages;
   - адрес публичный, его можно хранить в конфиге.
   
   Без адреса поиск постеров просто не показывается, всё остальное работает как сейчас.
3. «Добавить фильм»:
   - поиск по мере ввода (после паузы 400 мс);
   - результаты: постер w92, название, оригинальное название, год, «фильм / сериал»;
   - выбор только вручную — даже при одном совпадении.
4. Сохраняется: `catalogId` (`movie:ID`), `posterUrl` (`https://image.tmdb.org/t/p/w500/…`), а также год, описание, жанры, трейлер — только если вы подтвердили этот фильм.
5. Существующие фильмы:
   - кнопка «Найти постер» на странице фильма без вашей обложки;
   - после подтверждения меняются **только** `posterUrl` и `catalogId`;
   - ваши название, год, оценка, заметка, статус и вложения не трогаются;
   - массовой замены нет.
6. Атрибуция TMDB — в «Профиль → О приложении» и под результатами поиска.

## 6. Проверка работы и отсутствия секретов

**Worker** (в браузере):
- `https://<адрес>/search?query=Интерстеллар&locale=ru` — JSON с результатами и `posterPath`;
- `https://<адрес>/movie/157336?locale=ru` — детали и `trailerUrl`;
- `https://<адрес>/search?query=` — `400 invalid_input`.

**Приложение:** поиск, выбор, сохранение; отключение сети — понятная ошибка и «Повторить». Это я сделаю автоматически в браузерных тестах.

**Секретов в коде нет.** Перед публикацией Pages я запускаю и показываю вам результат:
```sh
pnpm build:pages
# Токен TMDB — это JWT, он всегда начинается с eyJhbGciOi. Широкий шаблон eyJ… ложно срабатывает на встроенных картинках base64.
grep -rl "eyJhbGciOi" apps/mobile/dist-pages || echo "токенов нет"
grep -rlE "[0-9a-f]{32}" apps/mobile/dist-pages | xargs -r grep -l "api_key" || echo "api_key нет"
git grep -nE "eyJhbGciOi|TMDB_TOKEN=" || echo "в репозитории секретов нет"
```
В браузере (DevTools → Network) запросы идут на адрес Worker без заголовка `Authorization`.

Если ключ всё же утёк:
- TMDB → Settings → API → **Regenerate**;
- Cloudflare → обновить секрет `TMDB_TOKEN`.

## 7. Ограничения и возможные расходы

**Cloudflare Workers Free:**
- лимиты (https://developers.cloudflare.com/workers/platform/limits):
  - **100 000 запросов в сутки** (сброс в 00:00 UTC);
  - **10 мс CPU** на запрос — шаблон укладывается, ждёт ответа TMDB, а не считает;
  - 50 внешних запросов на вызов — нам нужен один.
- при превышении — ошибка 1027/1102, **без автоматических списаний**. Платный план ($5 в месяц) включается только вручную, нам он не нужен.

**TMDB:** бесплатно для некоммерческого использования, без дневного лимита. Около 40 запросов в секунду — защитная граница.

**Риски:**
- Адрес Worker публичный. Чужой браузерный сайт ответ не получит (CORS), но прямой запрос (curl) возможен. Худший случай — кто-то исчерпает 100 000 запросов в сутки, и поиск постеров до полуночи UTC вернёт ошибку. Ключ при этом не раскрывается, денег не списывается.
- Если понадобится, можно добавить правило ограничения частоты в Cloudflare. С бесплатным адресом `workers.dev` возможности ограничены, а со своим доменом есть «Rate limiting rules».

**Итог:**
- от вас: регистрация TMDB, принятие условий, учётная запись Cloudflare, вставка секрета, адрес Worker;
- от меня после вашего «да»: подключение в приложении, тесты, проверка отсутствия секретов, коммит.
