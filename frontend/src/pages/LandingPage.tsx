import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" aria-hidden="true" />
            Votre réseau social et votre billetterie au même endroit
          </div>

          <h1 className="hero-title">
            Découvrez et réservez avec
            <span className="hero-title-accent">vos amis</span>
          </h1>

          <p className="hero-subtitle">
            Suivez les sorties de votre réseau, trouvez les meilleurs événements et achetez vos billets
            facilement pour partager l'expérience ensemble.
          </p>

          <div className="hero-cta">
            <Link to="/events" className="btn-modern btn-accent">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Explorer et réserver des événements
            </Link>
            <Link to="/register" className="btn-modern btn-glass">
              Rejoindre la communauté
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
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
          <h2 className="landing-section-title">Sortez avec votre réseau</h2>
          <p className="landing-section-subtitle">
            Tout le social et la billetterie événementielle sur une seule plateforme
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">Suivez vos amis</h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Voyez en temps réel les événements auxquels vos amis participent et rejoignez-les facilement.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">Billetterie simplifiée</h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Réservez vos places rapidement, centralisez vos billets et accédez à vos événements en un clic.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon" aria-hidden="true">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">Découverte et recommandations</h3>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Explorez les événements populaires autour de vous et dans votre réseau pour ne rien manquer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────── */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="cta-section">
            <h2 className="text-3xl font-bold mb-4 relative z-10">Vivez vos événements de A à Z</h2>
            <p className="text-lg mb-8 relative z-10" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Du partage social à la réservation de billets, tout est pensé pour sortir plus simplement.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap relative z-10">
              <Link to="/register" className="btn-modern btn-accent">
                Créer mon compte
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
