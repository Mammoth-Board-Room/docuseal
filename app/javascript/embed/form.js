(function () {
  const MESSAGE_SOURCE = 'docuseal'
  const OBSERVED_ATTRS = ['data-src', 'data-email', 'data-name', 'data-role', 'data-language']
  const DEFAULT_MIN_HEIGHT = 800

  function buildIframeSrc (element) {
    const src = element.getAttribute('data-src')

    if (!src) {
      return null
    }

    let url

    try {
      url = new URL(src, window.location.href)
    } catch (error) {
      console.error('[docuseal-form] Invalid data-src:', src, error)

      return null
    }

    const params = {
      email: element.getAttribute('data-email'),
      name: element.getAttribute('data-name'),
      role: element.getAttribute('data-role'),
      lang: element.getAttribute('data-language'),
      embed: '1'
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') {
        url.searchParams.set(key, value)
      }
    })

    return url.toString()
  }

  class DocusealForm extends HTMLElement {
    static get observedAttributes () {
      return OBSERVED_ATTRS
    }

    connectedCallback () {
      if (this._connected) {
        return
      }

      this._connected = true
      this.style.display = 'block'
      this.style.width = '100%'

      this.iframe = document.createElement('iframe')
      this.iframe.setAttribute('title', 'DocuSeal')
      this.iframe.setAttribute('allow', 'geolocation; microphone; camera; midi; encrypted-media')
      this.iframe.style.cssText = 'border:0;width:100%;display:block;min-height:' + DEFAULT_MIN_HEIGHT + 'px;'
      this.iframe.height = String(DEFAULT_MIN_HEIGHT)

      this.appendChild(this.iframe)
      this._onMessage = this.onMessage.bind(this)
      window.addEventListener('message', this._onMessage)

      this.reloadIframe()
      this.dispatchEvent(new CustomEvent('init', { bubbles: true }))
    }

    disconnectedCallback () {
      window.removeEventListener('message', this._onMessage)
      this._connected = false
    }

    attributeChangedCallback (name, oldValue, newValue) {
      if (!this._connected || oldValue === newValue) {
        return
      }

      this.reloadIframe()
    }

    reloadIframe () {
      const src = buildIframeSrc(this)

      if (!src) {
        this.iframe.removeAttribute('src')
        this.iframe.srcdoc = '<p style="font-family:sans-serif;padding:20px;text-align:center;">Missing data-src for docuseal-form</p>'

        return
      }

      this.iframe.removeAttribute('srcdoc')
      this.iframe.src = src
    }

    onMessage (event) {
      const data = event.data

      if (!data || data.source !== MESSAGE_SOURCE || !this.iframe) {
        return
      }

      if (event.source !== this.iframe.contentWindow) {
        return
      }

      if (data.type === 'resize' && data.payload && data.payload.height) {
        const height = Math.max(DEFAULT_MIN_HEIGHT, Math.ceil(Number(data.payload.height)))

        this.iframe.style.minHeight = height + 'px'
        this.iframe.height = String(height)

        return
      }

      if (['load', 'completed', 'declined'].includes(data.type)) {
        this.dispatchEvent(new CustomEvent(data.type, {
          bubbles: true,
          detail: data.payload || {}
        }))
      }
    }
  }

  class DocusealBuilder extends HTMLElement {
    connectedCallback () {
      this.innerHTML = `
        <div style="text-align:center;padding:20px;font-family:sans-serif;">
          <h2>Builder embed unavailable</h2>
          <p>The document builder embed is not available in this build. Use the admin UI to create templates.</p>
        </div>
      `
    }
  }

  if (!window.customElements.get('docuseal-form')) {
    window.customElements.define('docuseal-form', DocusealForm)
  }

  if (!window.customElements.get('docuseal-builder')) {
    window.customElements.define('docuseal-builder', DocusealBuilder)
  }
})()
