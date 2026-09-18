import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function revealOnScroll(
  target: Element | Element[] | NodeListOf<Element>,
  options: { trigger?: Element; y?: number; duration?: number; stagger?: number } = {},
): gsap.core.Tween {
  const { trigger, y = 40, duration = 0.6, stagger = 0.1 } = options;

  return gsap.from(target, {
    y,
    opacity: 0,
    duration,
    stagger,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: trigger ?? (target as Element),
      start: 'top 85%',
      toggleActions: 'play none none reverse',
    },
  });
}
