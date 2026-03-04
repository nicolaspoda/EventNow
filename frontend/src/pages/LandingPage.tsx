import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" aria-hidden="true" />
            La billetterie nouvelle génération
          </div>

          <h1 className="hero-title">
            Vivez des moments
            <span className="hero-title-accent">inoubliables</span>
          </h1>

          <p className="hero-subtitle">
            Concerts, festivals, conférences et événements communautaires —
            réservez en quelques clics et créez des souvenirs durables.
          </p>

          <div className="hero-cta">
            <Link to="/events" className="btn-modern btn-accent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Explorer les événements
            </Link>
            <Link to="/register" className="btn-modern btn-glass">
              Créer un compte
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">500+</div>
              <div className="hero-stat-label">Événements</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">10K+</div>
              <div className="hero-stat-label">Participants</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">4.9★</div>
              <div className="hero-stat-label">Note moyenne</div>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0 hero-wave-wrap" aria-hidden="true">
          <svg viewBox="0 0 1440 60" className="w-full h-auto" preserveAspectRatio="none">
            <path
              className="hero-wave-fill"
              d="M0,32L80,37.3C160,43,320,53,480,48C640,43,800,21,960,16C1120,11,1280,21,1360,26.7L1440,32L1440,60L1360,60C1280,60,1120,60,960,60C800,60,640,60,480,60C320,60,160,60,80,60L0,60Z"
            />
          </svg>
        </div>
      </section>

      {/* ── Features ──────────────────────────────── */}
      <section className="landing-section">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="landing-section-title">Pourquoi EventNow ?</h2>
          <p className="landing-section-subtitle">
            Une plateforme pensée pour les organisateurs et les participants
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">Billetterie instantanée</h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Réservez vos places en quelques secondes, recevez vos billets par email avec QR code intégré.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">Tableau de bord complet</h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Organisateurs, suivez vos ventes en temps réel, gérez les participants et analysez vos performances.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">Événements communautaires</h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Créez et participez à des événements gratuits ouverts à tous. Construisez une communauté.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────── */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="cta-section">
            <h2 className="text-3xl font-bold mb-4 relative z-10">Prêt à commencer ?</h2>
            <p className="text-lg mb-8 relative z-10" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Rejoignez des milliers d'utilisateurs et découvrez les meilleurs événements près de chez vous.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap relative z-10">
              <Link to="/register" className="btn-modern btn-accent">
                S'inscrire gratuitement
              </Link>
              <Link to="/events" className="btn-modern btn-glass">
                Voir les événements
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
