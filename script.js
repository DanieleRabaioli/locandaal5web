const sliderImages = {
  singola: [
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1200&auto=format&fit=crop'
  ],
  doppia: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1200&auto=format&fit=crop'
  ],
  matrimoniale: [
    'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=1200&auto=format&fit=crop'
  ],
  cocktail: [
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=1400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1481391032119-d89fee407e44?q=80&w=1400&auto=format&fit=crop'
  ]
};

const CONSENT_KEY = 'locanda_cookie_consent';
const CONSENT_TS_KEY = 'locanda_cookie_consent_ts';
const ANALYTICS_CONSENT_KEY = 'locanda_analytics_consent';

function safeStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // no-op: private mode or blocked storage
  }
}

function setupSliders() {
  document.querySelectorAll('[data-slider]').forEach((slider) => {
    const key = slider.dataset.slider;
    const images = sliderImages[key] || [];
    const img = slider.querySelector('img');
    const nextBtn = slider.querySelector('.next');
    const prevBtn = slider.querySelector('.prev');
    let idx = 0;

    const render = () => {
      if (!img || images.length === 0) return;
      img.src = images[idx];
    };

    nextBtn?.addEventListener('click', () => {
      idx = (idx + 1) % images.length;
      render();
    });

    prevBtn?.addEventListener('click', () => {
      idx = (idx - 1 + images.length) % images.length;
      render();
    });

    render();
  });
}

function setupMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('#nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    menu.classList.toggle('open');
  });

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

function saveConsent(value) {
  safeStorageSet(CONSENT_KEY, value);
  safeStorageSet(CONSENT_TS_KEY, new Date().toISOString());
  localStorage.setItem(CONSENT_KEY, value);
  localStorage.setItem(CONSENT_TS_KEY, new Date().toISOString());
  window.dispatchEvent(new CustomEvent('consent-changed', { detail: value }));
}

function setupCookies() {
  const banner = document.querySelector('#cookie-banner');
  const acceptBtn = document.querySelector('#accept-cookies');
  const rejectBtn = document.querySelector('#reject-cookies');
  const customizeBtn = document.querySelector('#customize-cookies');
  const preferencesBox = document.querySelector('#cookie-preferences');
  const analyticsCheckbox = document.querySelector('#analytics-consent');
  const savePreferencesBtn = document.querySelector('#save-cookie-preferences');
  const openSettingsBtn = document.querySelector('#open-cookie-settings');
  const saved = safeStorageGet(CONSENT_KEY);
  const analyticsSaved = safeStorageGet(ANALYTICS_CONSENT_KEY) === 'true';

  const showBanner = () => {
    banner?.classList.add('show');
    banner?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };
  const hideBanner = () => {
    preferencesBox?.setAttribute('hidden', '');
    banner?.classList.remove('show');
  };

  if (analyticsCheckbox) analyticsCheckbox.checked = analyticsSaved;

  if (!saved) showBanner();

  acceptBtn?.addEventListener('click', () => {
    saveConsent('accepted');
    safeStorageSet(ANALYTICS_CONSENT_KEY, 'true');
    hideBanner();
  });

  rejectBtn?.addEventListener('click', () => {
    saveConsent('rejected');
    safeStorageSet(ANALYTICS_CONSENT_KEY, 'false');
    hideBanner();
  });

  customizeBtn?.addEventListener('click', () => {
    if (!preferencesBox) return;
    if (preferencesBox.hasAttribute('hidden')) preferencesBox.removeAttribute('hidden');
    else preferencesBox.setAttribute('hidden', '');
  });

  savePreferencesBtn?.addEventListener('click', () => {
    const analyticsEnabled = Boolean(analyticsCheckbox?.checked);
    safeStorageSet(ANALYTICS_CONSENT_KEY, analyticsEnabled ? 'true' : 'false');
    saveConsent(analyticsEnabled ? 'accepted' : 'rejected');
    hideBanner();
  });

  openSettingsBtn?.addEventListener('click', () => {
    showBanner();
    preferencesBox?.removeAttribute('hidden');
  });
  openSettingsBtn?.addEventListener('click', showBanner);
}

function starsFromRating(rating = 0) {
  const full = Math.max(0, Math.round(Number(rating)));
  return '★'.repeat(full).padEnd(5, '☆');
}

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function loadReviews() {
  const status = document.querySelector('#reviews-status');
  const list = document.querySelector('#reviews-list');

  try {
    const response = await fetch('/api/reviews', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Unable to load reviews');
    const data = await response.json();
    const reviews = Array.isArray(data.reviews) ? data.reviews : [];

    if (reviews.length === 0) {
      status.textContent = 'Nessuna recensione disponibile al momento.';
      return;
    }

    status.textContent = '';
    list.innerHTML = reviews
      .slice(0, 6)
      .map((review) => {
        const author = escapeHTML(review.author_name || 'Ospite');
        const text = escapeHTML(review.text || 'Recensione disponibile su Google.');
        const relDate = escapeHTML(review.relative_time_description || '');
        const rating = Number(review.rating) || 0;

        return `<article class="review-card">
          <div class="review-head">
            <strong>${author}</strong>
            <span class="stars" aria-label="Valutazione ${rating} su 5">${starsFromRating(rating)}</span>
          </div>
          <p>${text}</p>
          <small>${relDate}</small>
        </article>`;
      })
      .join('');
  } catch {
    status.innerHTML =
      'Impossibile caricare le recensioni in questo momento. <a href="https://www.google.com/search?q=Locanda+Al+5+Lainate" target="_blank" rel="noopener noreferrer">Leggi su Google</a>.';
  }
}

setupSliders();
setupMenu();
setupCookies();
loadReviews();
