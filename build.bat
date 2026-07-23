@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: NODE_PATH — set this env var before running, or edit here
if "%NODE_PATH%"=="" set NODE_PATH=C:\Users\jim_d\AppData\Local\nvm\v24.18.0
set PATH=%NODE_PATH%;%PATH%

:: AMO credentials — read from env vars (set WEB_EXT_API_KEY / WEB_EXT_API_SECRET before running)

if "%1"=="" (
    echo.
    echo Usage: build.bat [command]
    echo.
    echo Commands:
echo   chrome      Build Chrome
echo   firefox     Build Firefox
echo   sign        Build + sign Firefox via AMO
echo   publish     Build Chrome + publish to CWS -- trusted testers
echo   all         Chrome + Firefox + sign
echo   version     Show / bump / set version
    echo.
    exit /b 0
)

if "%1"=="chrome" goto :chrome
if "%1"=="firefox" goto :firefox
if "%1"=="sign" goto :sign
if "%1"=="publish" goto :publish
if "%1"=="all" goto :all
if "%1"=="version" goto :version

echo Unknown command: %1
exit /b 1

:getversion
for /f %%a in ('node -p "require('./package.json').version"') do set VERSION=%%a
exit /b 0

:version
if "%2"=="bump" goto :version_bump
if "%2"=="set" goto :version_set
call :getversion
echo Current version: %VERSION%
echo.
echo   version bump        Increment patch (20.7.8 -^> 20.7.9)
echo   version set X.Y.Z   Set specific version
exit /b 0

:version_bump
echo [VERSION] Bumping patch...
node -e "var fs=require('fs'),f='package.json',p=JSON.parse(fs.readFileSync(f,'utf8')),m=p.version.match(/^(\d+)\.(\d+)\.(\d+)$/),v=m[1]+'.'+m[2]+'.'+(+m[3]+1);p.version=v;fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');var l='package-lock.json',p2=JSON.parse(fs.readFileSync(l,'utf8'));p2.version=v;p2.packages[''].version=v;fs.writeFileSync(l,JSON.stringify(p2,null,2)+'\n');var b='src/shared/manifest/base.json',p3=JSON.parse(fs.readFileSync(b,'utf8'));p3.version=v;fs.writeFileSync(b,JSON.stringify(p3,null,2)+'\n');console.log(v)"
for /f %%a in ('node -p "require('./package.json').version"') do set VERSION=%%a
echo [DONE] Version bumped to %VERSION%
echo         package.json + package-lock.json + manifest/base.json
exit /b 0

:version_set
if "%3"=="" (
    echo Usage: build.bat version set X.Y.Z
    exit /b 1
)
echo [VERSION] Setting to %3...
node -e "var fs=require('fs'),v='%3',f='package.json',p=JSON.parse(fs.readFileSync(f,'utf8'));p.version=v;fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n');var l='package-lock.json',p2=JSON.parse(fs.readFileSync(l,'utf8'));p2.version=v;p2.packages[''].version=v;fs.writeFileSync(l,JSON.stringify(p2,null,2)+'\n');var b='src/shared/manifest/base.json',p3=JSON.parse(fs.readFileSync(b,'utf8'));p3.version=v;fs.writeFileSync(b,JSON.stringify(p3,null,2)+'\n')"
echo [DONE] Version set to %3
exit /b 0

:chrome
call :getversion
echo [BUILD] Chrome production...
set NODE_ENV=production
set BROWSER=chrome
call npx webpack --config webpack.config.js
if %errorlevel% neq 0 (
    echo [ERROR] Chrome build failed
    exit /b 1
)
echo [DONE] dist\chrome\prod\

echo [ZIP] Packaging Chrome extension…
if not exist "releases\chrome\" mkdir releases\chrome
powershell -Command "Compress-Archive -Path 'dist\chrome\prod\*' -DestinationPath 'releases\chrome\censortracker-chrome-v%VERSION%.zip' -Force"
echo [DONE] releases\chrome\censortracker-chrome-v%VERSION%.zip
exit /b 0

:firefox
call :getversion
echo [BUILD] Firefox production...
set NODE_ENV=production
set BROWSER=firefox
call npx webpack --config webpack.config.js
if %errorlevel% neq 0 (
    echo [ERROR] Firefox build failed
    exit /b 1
)
echo [DONE] dist\firefox\prod\

echo [ZIP] Packaging Firefox extension…
if not exist "releases\firefox\" mkdir releases\firefox
powershell -Command "Compress-Archive -Path 'dist\firefox\prod\*' -DestinationPath 'releases\firefox\censortracker-firefox-v%VERSION%.zip' -Force"
echo [DONE] releases\firefox\censortracker-firefox-v%VERSION%.zip
exit /b 0

:sign
call :getversion

echo [BUILD] Firefox...
call :firefox
if %errorlevel% neq 0 exit /b 1

echo [SIGN] Submitting to AMO...
call npx web-ext sign --channel=unlisted --source-dir=./dist/firefox/prod --artifacts-dir=./releases/firefox
if %errorlevel% neq 0 (
    echo [ERROR] Signing failed
    exit /b 1
)

echo [RENAME] Normalizing XPI filename...
if not exist "releases\firefox\" mkdir releases\firefox
for %%f in (releases\firefox\*.xpi) do (
    move "%%f" "releases\firefox\censortracker-firefox-v%VERSION%.xpi" >nul
)
echo [DONE] releases\firefox\censortracker-firefox-v%VERSION%.xpi
exit /b 0

:publish
echo [PUBLISH] Building Chrome + publishing to CWS (trusted testers)

:: Auto-setup on first run (if .cws-config.json missing)
if not exist ".cws-config.json" (
    echo [PUBLISH] First run — starting setup…
    echo [PUBLISH] You will need Item ID, Publisher ID and a Refresh token.
    echo [PUBLISH] Refresh token: https://developers.google.com/oauthplayground
    echo.
    call npx node scripts/cws-setup.mjs
    if %errorlevel% neq 0 (
        echo [ERROR] CWS setup failed
        exit /b 1
    )
)

call :chrome
if %errorlevel% neq 0 exit /b 1

echo [PUBLISH] Uploading & publishing to Chrome Web Store…
call npx node scripts/cws-publish.mjs --publish
if %errorlevel% neq 0 (
    echo [ERROR] CWS publish failed
    exit /b 1
)
echo [DONE] Chrome Web Store: trusted testers
exit /b 0

:all
call :getversion

echo [BUILD ALL] Chrome + Firefox + sign
call :chrome
if %errorlevel% neq 0 exit /b 1
call :sign
if %errorlevel% neq 0 exit /b 1
echo.
echo [ALL DONE]
echo   Chrome:  dist\chrome\prod\  +  releases\chrome\censortracker-chrome-v%VERSION%.zip
echo   Firefox: dist\firefox\prod\  +  releases\firefox\censortracker-firefox-v%VERSION%.xpi
exit /b 0
