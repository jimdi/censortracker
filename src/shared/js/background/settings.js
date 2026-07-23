import browser from './browser-api'

class Settings {
  getName () {
    return 'Censor Tracker'
  }

  getDangerIcon () {
    return browser.runtime.getURL('images/icons/128x128/danger.png')
  }

  changePageIcon (tabId, filename) {
    const title = this.getName()
    const path = browser.runtime.getURL(`images/icons/128x128/${filename}.png`)

    if (browser.isFirefox) {
      browser.browserAction.setIcon({ tabId, path })
      browser.browserAction.setTitle({ title, tabId })
    } else {
      browser.action.setIcon({ tabId, path })
      browser.action.setTitle({ title, tabId })
    }
  }

  async showInstalledPage (_tabId) {
    await browser.tabs.create({ url: 'installed.html' })
  }

  setDisableIcon (tabId) {
    this.changePageIcon(tabId, 'disabled')
  }

  setDefaultIcon (tabId) {
    this.changePageIcon(tabId, 'default')
  }

  setDangerIcon (tabId) {
    this.changePageIcon(tabId, 'danger')
  }

  setBlockedIcon (tabId) {
    this.changePageIcon(tabId, 'blocked')
  }

  async extensionEnabled () {
    const { enableExtension } =
      await browser.storage.local.get({ enableExtension: false })

    return enableExtension
  }

  async enableExtension () {
    await browser.storage.local.set({ enableExtension: true })
    console.log('Settings.enableExtension()')
  }

  async disableExtension () {
    await browser.storage.local.set({
      useProxy: false,
      enableExtension: false,
      showNotifications: false,
    })

    if (browser.isFirefox) {
      await browser.browserAction.setBadgeText({ text: '' })
    }

    console.log('Settings.disableExtension()')
  }

  async enableNotifications () {
    await browser.storage.local.set({ showNotifications: true })
  }

  async disableNotifications () {
    await browser.storage.local.set({ showNotifications: false })
  }

  async exportSettings () {
    const settings = await browser.storage.local.get(null)

    settings.domains = []
    settings.disseminators = []

    if (Array.isArray(settings.customProxies)) {
      settings.customProxies = settings.customProxies.map(
        (proxy) => {
          const rest = { ...proxy }

          delete rest.credentials
          return rest
        },
      )
    }

    return settings
  }

  async importSettings (settings) {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      throw new Error('Invalid settings: must be a plain object')
    }

    const ALLOWED_KEYS = [
      'enableExtension',
      'useProxy',
      'showNotifications',
      'customProxiedDomains',
      'ignoredHosts',
      'customRegistryUrl',
      'useCustomRegistry',
      'currentRegionCode',
      'proxyAllTraffic',
      'useLocalProxy',
      'activeProxyConfigName',
      'proxySourcesEnabled',
      'proxySourcesIntervalMinutes',
      'proxySourcesUseProxy',
      'proxySourcesAutoTest',
      'proxySourcesList',
    ]

    const sanitized = {}

    for (const key of ALLOWED_KEYS) {
      if (Object.prototype.hasOwnProperty.call(settings, key)) {
        sanitized[key] = settings[key]
      }
    }

    await browser.storage.local.clear()
    await browser.storage.local.set(sanitized)
  }
}

export default new Settings()
