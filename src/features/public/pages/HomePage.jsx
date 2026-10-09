import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ShieldCheck, SlidersHorizontal, FileText } from 'lucide-react';
import { useAuthStore } from '@features/auth/store/authStore';
import { ROUTES } from '@routes/routes';
import { ROLES } from '@utils/constants';

// Assets
import logoWhiteImg from '@/assets/logo-white.svg';
import heroBgImg from '@/assets/fill-6083c10ce26b1f66.png';

// How IET works
import step1Img from '@/assets/fill-77604a2f620686cf.png';
import step2Img from '@/assets/fill-d59e445fa2a1f480.png';
import step3Img from '@/assets/fill-406ed3d9d5a78387.png';

// Ride gallery
import ride1Img from '@/assets/fill-6a5de63d4cf58952.png';
import ride2Img from '@/assets/fill-45f9a8dd680fee1b.png';
import ride3Img from '@/assets/fill-1318a89663df9c97.png';
import ride4Img from '@/assets/fill-8c408b1d962a783e.png';
import ride5Img from '@/assets/fill-73bcb2f1a10d5e8e.png';

// Top cities
import cityWellington from '@/assets/fill-0067b455a61b6078.png';
import cityOcala from '@/assets/fill-b7eabae58c73bed5.png';
import cityLexington from '@/assets/fill-04b5ba89a1b4e0d9.png';
import cityAiken from '@/assets/fill-fa987d31b94e6495.png';
import citySaratoga from '@/assets/fill-50fd7dbe9bd3a9cb.png';
import cityScottsdale from '@/assets/fill-a4181649ceaaa512.png';

import styles from './HomePage.module.css';

/**
 * Trang chủ Landing Page hệ thống IET Racehorse Transport (Figma node 11:14).
 * @returns {JSX.Element}
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const handleLoginClick = () => {
    navigate(ROUTES.LOGIN);
  };

  const handleSignupClick = () => {
    navigate(ROUTES.REGISTER);
  };

  const handleAccountClick = () => {
    if (isAuthenticated) {
      const dashboardMap = {
        [ROLES.CUSTOMER]: ROUTES.CUSTOMER_DASHBOARD,
        [ROLES.MANAGER]: ROUTES.MANAGER_DASHBOARD,
        [ROLES.SPECIALIST]: ROUTES.SPECIALIST_DASHBOARD,
        [ROLES.COORDINATOR]: ROUTES.COORDINATOR_DASHBOARD,
        [ROLES.DRIVER]: ROUTES.DRIVER_DASHBOARD,
      };
      navigate(dashboardMap[user?.role] || ROUTES.CUSTOMER_DASHBOARD);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  const handleBookNowClick = () => {
    if (isAuthenticated) {
      if (user?.role === ROLES.CUSTOMER) {
        navigate(ROUTES.CUSTOMER_BOOKING_NEW);
      } else {
        handleAccountClick();
      }
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll(`.${styles.revealItem}`);
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles.homePage}>
      {/* 1. NAVBAR */}
      <nav className={styles.navbar}>
        <div className={styles.navLeft}>
          <div
            className={styles.logoContainer}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img
              src={logoWhiteImg}
              alt="International Equine Transport"
              className={styles.logoImage}
            />
          </div>

          <div className={styles.navLinks}>
            <button
              type="button"
              className={styles.navLink}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {t('landing.nav.home')}
            </button>
            <button
              type="button"
              className={styles.navLink}
              onClick={() => scrollToSection('gallery')}
            >
              {t('landing.nav.transport')}
            </button>
            <button
              type="button"
              className={styles.navLink}
              onClick={handleAccountClick}
            >
              {t('landing.nav.account')}
            </button>
            <button
              type="button"
              className={styles.navLink}
              onClick={() => scrollToSection('how-it-works')}
            >
              {t('landing.nav.more')}
            </button>
          </div>
        </div>

        <div className={styles.navRight}>
          <button
            type="button"
            className={styles.langBtn}
            onClick={toggleLanguage}
            aria-label="Toggle language"
          >
            {i18n.language === 'vi' ? 'EN' : 'VI'}
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              className={styles.signupBtn}
              onClick={handleAccountClick}
            >
              {user?.fullName || t('landing.nav.account')}
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.loginBtn}
                onClick={handleLoginClick}
              >
                {t('landing.nav.login')}
              </button>
              <button
                type="button"
                className={styles.signupBtn}
                onClick={handleSignupClick}
              >
                {t('landing.nav.signup')}
              </button>
            </>
          )}
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section
        className={styles.heroSection}
        style={{ backgroundImage: `url(${heroBgImg})` }}
      >
        <div className={styles.heroOverlay} />
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroHeading}>
              <span className={styles.heroHeadingWhite}>
                {t('landing.hero.booking')}
              </span>
              <span className={styles.heroHeadingGold}>
                {t('landing.hero.yourTransport')}
              </span>
            </h1>
            <p className={styles.heroSubtitle}>{t('landing.hero.subtitle')}</p>

            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.heroCtaPrimary}
                onClick={handleBookNowClick}
              >
                {t('landing.hero.bookNow')}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className={styles.heroCtaSecondary}
                onClick={() => scrollToSection('how-it-works')}
              >
                {t('landing.hero.learnMore')}
              </button>
            </div>

            <div className={styles.heroTagline}>{t('landing.hero.tagline')}</div>
          </div>
        </div>
      </section>

      {/* 3. HOW IET WORKS */}
      <section id="how-it-works" className={styles.howItWorksBg}>
        <div className={styles.sectionWrapper}>
          <div className={`${styles.sectionHeaderCenter} ${styles.revealItem}`}>
            <h2 className={styles.sectionTitle}>{t('landing.howItWorks.title')}</h2>
          </div>

          <div className={styles.howItWorksGrid}>
            {/* Step 1 */}
            <div className={`${styles.howItWorksCard} ${styles.revealItem} ${styles.delay1}`}>
              <div className={styles.howItWorksImgWrapper}>
                <img
                  src={step1Img}
                  alt={t('landing.howItWorks.step1Title')}
                  className={styles.howItWorksImg}
                />
              </div>
              <div className={styles.howItWorksBody}>
                <span className={styles.stepNumberBadge}>1</span>
                <h3 className={styles.howItWorksCardTitle}>
                  {t('landing.howItWorks.step1Title')}
                </h3>
                <p className={styles.howItWorksCardDesc}>
                  {t('landing.howItWorks.step1Desc')}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`${styles.howItWorksCard} ${styles.revealItem} ${styles.delay2}`}>
              <div className={styles.howItWorksImgWrapper}>
                <img
                  src={step2Img}
                  alt={t('landing.howItWorks.step2Title')}
                  className={styles.howItWorksImg}
                />
              </div>
              <div className={styles.howItWorksBody}>
                <span className={styles.stepNumberBadge}>2</span>
                <h3 className={styles.howItWorksCardTitle}>
                  {t('landing.howItWorks.step2Title')}
                </h3>
                <p className={styles.howItWorksCardDesc}>
                  {t('landing.howItWorks.step2Desc')}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`${styles.howItWorksCard} ${styles.revealItem} ${styles.delay3}`}>
              <div className={styles.howItWorksImgWrapper}>
                <img
                  src={step3Img}
                  alt={t('landing.howItWorks.step3Title')}
                  className={styles.howItWorksImg}
                />
              </div>
              <div className={styles.howItWorksBody}>
                <span className={styles.stepNumberBadge}>3</span>
                <h3 className={styles.howItWorksCardTitle}>
                  {t('landing.howItWorks.step3Title')}
                </h3>
                <p className={styles.howItWorksCardDesc}>
                  {t('landing.howItWorks.step3Desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RIDE GALLERY */}
      <section id="gallery" className={styles.gallerySection}>
        <div className={styles.sectionWrapper}>
          <div className={`${styles.sectionHeaderCenter} ${styles.revealItem}`}>
            <h2 className={styles.sectionTitle}>{t('landing.gallery.title')}</h2>
          </div>

          <div className={styles.galleryGrid}>
            <div className={`${styles.galleryCard} ${styles.revealItem} ${styles.delay1}`} onClick={handleBookNowClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleBookNowClick(); }}>
              <img src={ride1Img} alt="Short haul" className={styles.galleryImg} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryLabel}>
                  {t('landing.gallery.shortHaul')}
                </span>
              </div>
            </div>

            <div className={`${styles.galleryCard} ${styles.revealItem} ${styles.delay2}`} onClick={handleBookNowClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleBookNowClick(); }}>
              <img src={ride2Img} alt="Mare and foal" className={styles.galleryImg} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryLabel}>
                  {t('landing.gallery.mareAndFoal')}
                </span>
              </div>
            </div>

            <div className={`${styles.galleryCard} ${styles.revealItem} ${styles.delay3}`} onClick={handleBookNowClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleBookNowClick(); }}>
              <img src={ride3Img} alt="Commercial hauling" className={styles.galleryImg} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryLabel}>
                  {t('landing.gallery.commercial')}
                </span>
              </div>
            </div>

            <div className={`${styles.galleryCard} ${styles.revealItem} ${styles.delay4}`} onClick={handleBookNowClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleBookNowClick(); }}>
              <img src={ride4Img} alt="Medical transport" className={styles.galleryImg} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryLabel}>
                  {t('landing.gallery.medical')}
                </span>
              </div>
            </div>

            <div className={`${styles.galleryCard} ${styles.revealItem} ${styles.delay5}`} onClick={handleBookNowClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') handleBookNowClick(); }}>
              <img src={ride5Img} alt="Door-to-door" className={styles.galleryImg} />
              <div className={styles.galleryOverlay}>
                <span className={styles.galleryLabel}>
                  {t('landing.gallery.doorToDoor')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURES */}
      <section id="features" className={styles.featuresBg}>
        <div className={styles.sectionWrapper}>
          <div className={styles.featuresGrid}>
            {/* Gold Feature Card */}
            <div className={`${styles.featureCardGold} ${styles.revealItem} ${styles.delay1}`}>
              <div>
                <h3 className={styles.featureCardGoldTitle}>
                  {t('landing.features.card1Title')}
                </h3>
                <p className={styles.featureCardGoldDesc}>
                  {t('landing.features.card1Desc')}
                </p>
              </div>
            </div>

            {/* Slate Feature Card 2 */}
            <div className={`${styles.featureCardSlate} ${styles.revealItem} ${styles.delay2}`}>
              <div className={styles.featureIconCircle}>
                <ShieldCheck size={22} />
              </div>
              <h4 className={styles.featureCardSlateTitle}>
                {t('landing.features.card2Title')}
              </h4>
              <p className={styles.featureCardSlateDesc}>
                {t('landing.features.card2Desc')}
              </p>
            </div>

            {/* Slate Feature Card 3 */}
            <div className={`${styles.featureCardSlate} ${styles.revealItem} ${styles.delay3}`}>
              <div className={styles.featureIconCircle}>
                <SlidersHorizontal size={22} />
              </div>
              <h4 className={styles.featureCardSlateTitle}>
                {t('landing.features.card3Title')}
              </h4>
              <p className={styles.featureCardSlateDesc}>
                {t('landing.features.card3Desc')}
              </p>
            </div>

            {/* Slate Feature Card 4 */}
            <div className={`${styles.featureCardSlate} ${styles.revealItem} ${styles.delay4}`}>
              <div className={styles.featureIconCircle}>
                <FileText size={22} />
              </div>
              <h4 className={styles.featureCardSlateTitle}>
                {t('landing.features.card4Title')}
              </h4>
              <p className={styles.featureCardSlateDesc}>
                {t('landing.features.card4Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TOP CITIES */}
      <section id="top-cities" className={styles.citiesSection}>
        <div className={styles.sectionWrapper}>
          <div className={`${styles.citiesHeaderRow} ${styles.revealItem}`}>
            <div className={styles.citiesTitleWrap}>
              <h2 className={styles.sectionTitle}>{t('landing.cities.title')}</h2>
              <p className={styles.sectionSubtitle}>{t('landing.cities.subtitle')}</p>
            </div>
            <div className={styles.citiesBadgeRow}>
              <span className={styles.badgePill}>{t('landing.cities.topCities')}</span>
              <span className={styles.badgePillGold}>{t('landing.cities.badge')}</span>
              <button
                type="button"
                className={styles.badgePill}
                style={{ cursor: 'pointer', background: 'transparent' }}
                onClick={handleBookNowClick}
              >
                {t('landing.cities.viewAll')}
              </button>
            </div>
          </div>

          <div className={styles.citiesGrid}>
            {/* City 1 */}
            <div className={`${styles.cityCard} ${styles.revealItem} ${styles.delay1}`}>
              <div className={styles.cityImgWrapper}>
                <img
                  src={cityWellington}
                  alt={t('landing.cities.wellington')}
                  className={styles.cityImg}
                />
              </div>
              <div className={styles.cityBody}>
                <h3 className={styles.cityCardTitle}>
                  {t('landing.cities.wellington')}
                </h3>
                <p className={styles.cityCardDesc}>
                  {t('landing.cities.wellingtonDesc')}
                </p>
              </div>
            </div>

            {/* City 2 */}
            <div className={`${styles.cityCard} ${styles.revealItem} ${styles.delay2}`}>
              <div className={styles.cityImgWrapper}>
                <img
                  src={cityOcala}
                  alt={t('landing.cities.ocala')}
                  className={styles.cityImg}
                />
              </div>
              <div className={styles.cityBody}>
                <h3 className={styles.cityCardTitle}>{t('landing.cities.ocala')}</h3>
                <p className={styles.cityCardDesc}>{t('landing.cities.ocalaDesc')}</p>
              </div>
            </div>

            {/* City 3 */}
            <div className={`${styles.cityCard} ${styles.revealItem} ${styles.delay3}`}>
              <div className={styles.cityImgWrapper}>
                <img
                  src={cityLexington}
                  alt={t('landing.cities.lexington')}
                  className={styles.cityImg}
                />
              </div>
              <div className={styles.cityBody}>
                <h3 className={styles.cityCardTitle}>
                  {t('landing.cities.lexington')}
                </h3>
                <p className={styles.cityCardDesc}>
                  {t('landing.cities.lexingtonDesc')}
                </p>
              </div>
            </div>

            {/* City 4 */}
            <div className={`${styles.cityCard} ${styles.revealItem} ${styles.delay1}`}>
              <div className={styles.cityImgWrapper}>
                <img
                  src={cityAiken}
                  alt={t('landing.cities.aiken')}
                  className={styles.cityImg}
                />
              </div>
              <div className={styles.cityBody}>
                <h3 className={styles.cityCardTitle}>{t('landing.cities.aiken')}</h3>
                <p className={styles.cityCardDesc}>{t('landing.cities.aikenDesc')}</p>
              </div>
            </div>

            {/* City 5 */}
            <div className={`${styles.cityCard} ${styles.revealItem} ${styles.delay2}`}>
              <div className={styles.cityImgWrapper}>
                <img
                  src={citySaratoga}
                  alt={t('landing.cities.saratoga')}
                  className={styles.cityImg}
                />
              </div>
              <div className={styles.cityBody}>
                <h3 className={styles.cityCardTitle}>
                  {t('landing.cities.saratoga')}
                </h3>
                <p className={styles.cityCardDesc}>
                  {t('landing.cities.saratogaDesc')}
                </p>
              </div>
            </div>

            {/* City 6 */}
            <div className={`${styles.cityCard} ${styles.revealItem} ${styles.delay3}`}>
              <div className={styles.cityImgWrapper}>
                <img
                  src={cityScottsdale}
                  alt={t('landing.cities.scottsdale')}
                  className={styles.cityImg}
                />
              </div>
              <div className={styles.cityBody}>
                <h3 className={styles.cityCardTitle}>
                  {t('landing.cities.scottsdale')}
                </h3>
                <p className={styles.cityCardDesc}>
                  {t('landing.cities.scottsdaleDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={`${styles.footerColumns} ${styles.revealItem}`}>
            <div>
              <div className={styles.footerColTitle}>
                {t('landing.footer.aboutIet')}
              </div>
              <ul className={styles.footerLinks}>
                <li>
                  <button type="button" className={styles.footerLink} onClick={handleSignupClick}>
                    {t('landing.footer.becomeTransporter')}
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => scrollToSection('top-cities')}>
                    {t('landing.footer.contactUs')}
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    {t('landing.footer.termsOfUse')}
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    {t('landing.footer.privacyPolicy')}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div className={styles.footerColTitle}>
                {t('landing.footer.discover')}
              </div>
              <ul className={styles.footerLinks}>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => scrollToSection('how-it-works')}>
                    {t('landing.footer.howItWorksLink')}
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLink} onClick={handleBookNowClick}>
                    {t('landing.footer.bookTransportLink')}
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => scrollToSection('features')}>
                    {t('landing.footer.vettedNetwork')}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div className={styles.footerColTitle}>
                {t('landing.nav.account')}
              </div>
              <ul className={styles.footerLinks}>
                <li>
                  <button type="button" className={styles.footerLink} onClick={handleLoginClick}>
                    {t('landing.footer.signIn')}
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLink} onClick={handleSignupClick}>
                    {t('landing.footer.createAccount')}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div className={styles.footerColTitle}>
                {t('landing.footer.transportTypes')}
              </div>
              <ul className={styles.footerLinks}>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => scrollToSection('gallery')}>
                    {t('landing.footer.locations')}
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => scrollToSection('top-cities')}>
                    {t('landing.footer.allLocations')}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <div className={styles.footerColTitle}>
                {t('landing.footer.support')}
              </div>
              <ul className={styles.footerLinks}>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => scrollToSection('how-it-works')}>
                    {t('landing.footer.helpFaqs')}
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => scrollToSection('features')}>
                    {t('landing.footer.safetyInsurance')}
                  </button>
                </li>
                <li>
                  <button type="button" className={styles.footerLink} onClick={() => scrollToSection('features')}>
                    {t('landing.footer.trustSecurity')}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.footerDivider} />

          <div className={styles.footerBottom}>
            <div className={styles.footerBrandWrap}>
              <img
                src={logoWhiteImg}
                alt="International Equine Transport"
                className={styles.footerLogo}
              />
              <span className={styles.footerCopyright}>
                {t('landing.footer.copyright')}
              </span>
            </div>

            <div className={styles.footerLegalLinks}>
              <span className={styles.footerLegalLink}>
                {t('landing.footer.terms')}
              </span>
              <span className={styles.footerLegalLink}>
                {t('landing.footer.privacy')}
              </span>
              <span className={styles.footerLegalLink}>
                {t('landing.footer.cookies')}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
