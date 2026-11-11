import { Link } from 'react-router';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import logo256 from '../../assets/logo-256.webp';
import logo512 from '../../assets/logo-512.webp';
import logo1024 from '../../assets/logo-1024.webp';
import Button from '../../components/Button.jsx';
import Parallax from '../../components/motion/Parallax.jsx';
import { DURATION, EASE, STAGGER, riseVariants } from '../../lib/motion.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { useSiteContent } from '../content/useSiteContent.js';

function MinimumIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6.5h16M4 12h16M4 17.5h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function HeroSection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { text } = useSiteContent();
  const heroContentVariants = {
    hidden: {},
    show: { transition: { staggerChildren: STAGGER } },
  };
  const logoVariants = {
    hidden: { opacity: 0, x: 24 },
    show: { opacity: 1, x: 0, transition: { duration: DURATION, ease: EASE } },
  };
  const floatingVariants = {
    ...riseVariants,
    show: {
      ...riseVariants.show,
      transition: { ...riseVariants.show.transition, delay: DURATION + 0.3 },
    },
  };

  return (
    <section className="bg-ink py-20 text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-8 lg:grid-cols-2">
        <motion.div initial="hidden" animate="show" variants={heroContentVariants}>
          <motion.div
            variants={riseVariants}
            className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent"
          >
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            {t('home.badge')}
          </motion.div>
          <motion.h1 variants={riseVariants} className="mt-6 max-w-2xl font-display text-5xl font-bold leading-tight text-white md:text-6xl">
            {text('home.title', t('home.title'))}
          </motion.h1>
          <motion.p variants={riseVariants} className="mt-6 max-w-xl whitespace-pre-line text-lg leading-8 text-white/70">
            {text('home.text', t('home.text'))}
          </motion.p>
          <motion.div variants={riseVariants} className="mt-8 flex flex-wrap gap-4">
            <Button as={Link} to="/products">
              {t('home.browse')}
            </Button>
            {!user && (
              <Button as={Link} to="/register" variant="light">
                {t('home.createAccount')}
              </Button>
            )}
          </motion.div>
        </motion.div>

        <div className="relative min-h-[440px]">
          <Parallax strength={12}>
            <motion.div
              initial="hidden"
              animate="show"
              variants={logoVariants}
              className="flex h-[440px] items-center justify-center rounded-3xl bg-black p-8 shadow-2xl ring-1 ring-accent/30"
            >
              <img
                src={logo512}
                srcSet={`${logo256} 256w, ${logo512} 512w, ${logo1024} 1024w`}
                sizes="(max-width: 1023px) calc(100vw - 64px), 376px"
                alt={t('home.photo')}
                width={1254}
                height={1254}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-contain"
              />
            </motion.div>
          </Parallax>
          <Parallax strength={18}>
            <motion.div
              initial="hidden"
              animate="show"
              variants={floatingVariants}
              className="lift static mt-6 flex max-w-[230px] items-center gap-3 rounded-2xl bg-white p-4 shadow-xl lg:absolute lg:-left-4 lg:top-8 lg:mt-0"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-ink">
                <CheckIcon />
              </span>
              <span>
                <strong className="block text-sm text-ink">{t('home.floatOfferTitle')}</strong>
                <span className="text-xs text-muted">{t('home.floatOfferText')}</span>
              </span>
            </motion.div>
          </Parallax>
          <Parallax strength={8}>
            <motion.div
              initial="hidden"
              animate="show"
              variants={floatingVariants}
              className="lift static mt-4 flex max-w-[230px] items-center gap-3 rounded-2xl bg-white p-4 shadow-xl lg:absolute lg:-bottom-6 lg:-right-4 lg:mt-0"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-ink">
                <MinimumIcon />
              </span>
              <span>
                <strong className="block text-sm text-ink">{t('home.floatMinTitle')}</strong>
                <span className="text-xs text-muted">{t('home.floatMinText')}</span>
              </span>
            </motion.div>
          </Parallax>
        </div>
      </div>
    </section>
  );
}
