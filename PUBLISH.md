# Публикация Censor Tracker

---

## Chrome Web Store

### Переменные окружения

Для публикации нужны всего две переменные (можно не ставить — скрипт спросит сам):

| Переменная | Описание |
|---|---|
| `CWS_ITEM_ID` | ID расширения в Chrome Web Store |
| `PUBLISHER_ID` | ID издателя (число из URL консоли CWS) |

### 1. Собрать расширение

```cmd
build.bat chrome
```

Билд: `dist\chrome\prod\`
ZIP: `releases\chrome\censortracker-chrome-v{VERSION}.zip`

### 2. Создать листинг в CWS

https://chrome.google.com/webstore/devconsole/

**New item** → загрузить ZIP. После создания CWS присвоит **Item ID**.

**Publisher ID** — число из URL:
`https://chrome.google.com/webstore/devconsole/`**`XXXXXXXXXXXX`**`/publisher/dashboard`

### 3. Настроить OAuth 2.0

**Проект** — https://console.cloud.google.com/ → проект `censor-tracker-fork`

**OAuth consent screen** — https://console.cloud.google.com/apis/credentials/consent
- User Type: **External** → **Create**
- Заполнить обязательные поля
- Scopes: **Add or Remove Scopes** → `.../auth/chromewebstore` → **Update**
- Test users: **Add Users** → добавить свою почту (владельца листинга)
- Статус `Testing` — это и есть режим тестирования

**Credentials** — https://console.cloud.google.com/apis/credentials
- **Create Credentials** → **OAuth client ID**
- Application type: **Desktop app**
- **Create** → скачать JSON

Положить JSON в корень проекта. Имя должно начинаться с `client_secret_` и заканчиваться `.json`.

---

### 4. Автоматическая публикация

#### Первый запуск

```cmd
build.bat publish
```

Если нет `.cws-config.json`, скрипт предложит запустить настройку:

```cmd
node scripts/cws-setup.mjs
```

В процессе нужно будет ввести **Item ID**, **Publisher ID** и **Refresh token**.

Refresh token получается один раз через OAuth Playground:

1. https://developers.google.com/oauthplayground
2. ⚙️ → **Use your own OAuth credentials** → вставить client_id / client_secret из `client_secret_*.json`
3. Справа в поле Scopes: `https://www.googleapis.com/auth/chromewebstore`
4. **Authorize APIs** → авторизоваться под своим аккаунтом
5. **Exchange authorization code for tokens**
6. Скопировать **Refresh token** → вставить в скрипт

После этого `build.bat publish` будет работать полностью автоматически.

#### Последующие запуски

```cmd
build.bat publish
```

Повторная настройка не нужна. Скрипт читает `.cws-config.json`.

#### Если нужно обновить данные

```cmd
node scripts/cws-setup.mjs
```

Скрипт покажет текущие значения, предложит ввести новые.

---

### 5. Получение REFRESH_TOKEN вручную (без скрипта)

Создать `.cws-config.json` в корне проекта:

```json
{
  "extensionId": "ваш_item_id",
  "publisherId": "ваш_publisher_id",
  "refreshToken": "1//скопированный_refresh_token"
}
```

Refresh token получить через OAuth Playground:

1. https://developers.google.com/oauthplayground
2. ⚙️ → **Use your own OAuth credentials** → вставить client_id / client_secret из `client_secret_*.json`
3. Scopes: `https://www.googleapis.com/auth/chromewebstore` → **Authorize APIs**
4. Авторизоваться → **Exchange authorization code for tokens**
5. Скопировать **Refresh token**

---

### 6. Заполнение формы листинга (Store Listing / Privacy)

Зайти на страницу редактирования расширения, перейти на вкладку **Store listing**:

#### Detailed description

```
Censor Tracker helps you access blocked websites by automatically routing traffic through available proxy servers. It maintains an up-to-date registry of working proxies, tests their speed and availability, and seamlessly switches between them to ensure uninterrupted access to information. The extension supports custom proxy lists, auto-fetch from remote sources, and works with SOCKS4/5, HTTP, and HTTPS protocols. All proxy testing and switching happens in the background without disrupting your browsing experience.
```

#### Single purpose description (вкладка Privacy)

```
Circumvent internet censorship by automatically managing and routing traffic through proxy servers.
```

#### Permission justifications (тоже вкладка Privacy)

| Permission | Justification |
|---|---|
| `activeTab` | Used to temporarily access the active tab when user opens the popup to check or change proxy settings for the current site. |
| `alarms` | Used to schedule periodic proxy source fetching, background proxy testing, and automatic registry updates at configurable intervals. |
| `clipboardRead` | Used when user pastes a proxy list from clipboard into the custom proxy editor in the options page. |
| `clipboardWrite` | Used when user copies proxy list or debug information to clipboard from the settings interface. |
| `host_permissions` (`<all_urls>`) | Required to route traffic through the selected proxy server for any website the user visits, which is the core functionality of the extension. |
| `management` | Used to detect other installed extensions that may have taken control of proxy settings, to notify the user and offer to disable the conflicting extension. |
| `notifications` | Used to alert the user when the current proxy server becomes unavailable, when a new version is available, or when background operations (like registry update) complete. |
| `proxy` | Core permission — used to configure Chrome's proxy settings to route traffic through the chosen proxy server for censorship circumvention. |
| `scripting` | Used to inject content scripts that handle proxy-related UI elements and communication between the popup and web pages. |
| `storage` | Used to store extension settings, user preferences, proxy list, and registry configuration locally. |
| `unlimitedStorage` | Required because the proxy registry database and custom proxy lists can exceed the default 5 MB storage quota. |
| `webNavigation` | Used to detect navigation events and apply proxy routing rules based on the user's configured registry of blocked websites. |
| Remote code | Not used. All code is bundled with the extension. The warning appears due to the Content Security Policy configuration; the extension does not execute any remote code. |

После заполнения — **Save Draft**. Затем на вкладке **Testing** → **Publish to test accounts**.

---

### 7. Ручная публикация (без автоматизации)

1. `build.bat chrome` — собрать и упаковать
2. ZIP: `releases\chrome\censortracker-chrome-v{VERSION}.zip`
3. https://chrome.google.com/webstore/devconsole/ → открыть расширение
4. **Package** → **Upload new package** → выбрать ZIP → **Upload**
5. **Store listing** → заполнить/обновить как указано выше
6. **Testing** → **Publish to test accounts**

---

## Firefox AMO

```env
WEB_EXT_API_KEY=user:...
WEB_EXT_API_SECRET=...
```

Где взять: https://addons.mozilla.org/en-US/developers/addon/api/key/

```cmd
build.bat sign
```

Результат: `releases\firefox\censortracker-firefox-v{VERSION}.xpi`

---

## Полный цикл

```cmd
build.bat publish && build.bat sign
```
