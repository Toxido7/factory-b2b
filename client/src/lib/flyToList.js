import { animate } from 'motion/react';
import { EASE } from './motion.js';

export const FLY_DURATION = 0.6;

export async function flyToList(fromElement, imageUrl) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const target = document.querySelector('[data-request-badge]');
  if (!target) return;

  const fromRect = fromElement.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const size = 56;
  const startX = fromRect.left + fromRect.width / 2 - size / 2;
  const startY = fromRect.top + fromRect.height / 2 - size / 2;
  const targetX = targetRect.left + targetRect.width / 2 - size / 2;
  const targetY = targetRect.top + targetRect.height / 2 - size / 2;
  const flying = document.createElement('div');

  flying.setAttribute('aria-hidden', 'true');
  flying.style.position = 'fixed';
  flying.style.left = '0';
  flying.style.top = '0';
  flying.style.width = `${size}px`;
  flying.style.height = `${size}px`;
  flying.style.border = '2px solid var(--color-accent)';
  flying.style.borderRadius = '9999px';
  flying.style.backgroundColor = 'var(--color-ink)';
  flying.style.overflow = 'hidden';
  flying.style.pointerEvents = 'none';
  flying.style.zIndex = '9999';

  if (imageUrl) {
    const image = document.createElement('img');
    image.src = imageUrl;
    image.alt = '';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';
    flying.appendChild(image);
  }

  document.body.appendChild(flying);

  try {
    await animate(
      flying,
      {
        x: [startX, targetX],
        y: [startY, targetY],
        scale: [1, 0.25],
        opacity: [1, 1, 0.4],
      },
      { duration: FLY_DURATION, ease: EASE, times: [0, 0.78, 1] },
    );
  } finally {
    flying.remove();
  }
}
