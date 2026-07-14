const SOURCE = 'docuseal'

export function isEmbedded () {
  try {
    const params = new URLSearchParams(window.location.search)

    if (params.get('embed') === '1') {
      return true
    }

    return Boolean(window.parent && window.parent !== window)
  } catch (error) {
    return true
  }
}

export function postToParent (type, payload = {}) {
  if (!isEmbedded()) {
    return
  }

  window.parent.postMessage({ source: SOURCE, type, payload }, '*')
}

export function postCompleted (submitter = {}) {
  postToParent('completed', {
    uuid: submitter.uuid,
    slug: submitter.slug,
    email: submitter.email,
    name: submitter.name,
    phone: submitter.phone,
    completed_at: new Date().toISOString()
  })
}

export function postDeclined (submitter = {}) {
  postToParent('declined', {
    uuid: submitter.uuid,
    slug: submitter.slug,
    email: submitter.email,
    name: submitter.name,
    phone: submitter.phone,
    declined_at: submitter.declined_at || new Date().toISOString()
  })
}

function reportHeight () {
  const height = Math.max(
    document.body?.scrollHeight || 0,
    document.documentElement?.scrollHeight || 0,
    document.getElementById('scrollbox')?.scrollHeight || 0
  )

  if (height > 0) {
    postToParent('resize', { height })
  }
}

export function startEmbedBridge () {
  if (!isEmbedded()) {
    return
  }

  const declinedEl = document.getElementById('form_declined')

  if (declinedEl) {
    postDeclined({
      uuid: declinedEl.dataset.submitterUuid,
      slug: declinedEl.dataset.submitterSlug,
      email: declinedEl.dataset.submitterEmail,
      name: declinedEl.dataset.submitterName,
      phone: declinedEl.dataset.submitterPhone,
      declined_at: declinedEl.dataset.declinedAt
    })
  } else {
    postToParent('load', { path: window.location.pathname })
  }

  reportHeight()

  if (typeof ResizeObserver === 'function') {
    const observer = new ResizeObserver(() => reportHeight())

    if (document.body) {
      observer.observe(document.body)
    }
  } else {
    window.setInterval(reportHeight, 500)
  }

  window.addEventListener('load', reportHeight)
}
