import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationBtn } from '../../../../shared/components/navigation-btn/navigation-btn';
import { gsap } from 'gsap';
import { revealOnScroll } from '../../../../shared/utils/animations.utils';

@Component({
  selector: 'app-home',
  imports: [NavigationBtn],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit, OnDestroy {
  @ViewChild('heroLogo')
  private heroLogo!: ElementRef<SVGSVGElement>;

  @ViewChild('charFlip')
  private charFlip!: ElementRef<HTMLElement>;

  @ViewChild('kanjiCount')
  private kanjiCount!: ElementRef<HTMLElement>;

  private animationContext?: gsap.Context;

  private readonly heroChars = ['あ', 'ア', '日', 'か', 'カ', '本', 'さ', 'サ', '水'];

  constructor(
    private router: Router,
    private el: ElementRef<HTMLElement>,
  ) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  ngAfterViewInit(): void {
    const paths = this.heroLogo.nativeElement.querySelectorAll<SVGPathElement>('path');
    const heroSection = this.el.nativeElement.querySelector<HTMLElement>('.hero');
    const heroText = this.el.nativeElement.querySelector<HTMLElement>('.hero-text');
    const heroInfo = this.el.nativeElement.querySelector<HTMLElement>('.hero-info-wrapper');
    const charsInfo = this.el.nativeElement.querySelector<HTMLElement>('.characters-info');
    const ctaSection = this.el.nativeElement.querySelector<HTMLElement>('.cta-section');

    this.animationContext = gsap.context(() => {
      paths.forEach((path) => {
        const length = path.getTotalLength();

        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
          opacity: 0,
        });
      });

      const drawTimeline = gsap.timeline();

      paths.forEach((path) => {
        drawTimeline
          .set(path, {
            opacity: 1,
          })
          .to(path, {
            strokeDashoffset: 0,
            duration: 0.2,
            ease: 'power1.inOut',
          });
      });

      if (heroSection) {
        const textEls = heroSection.querySelectorAll<HTMLElement>('h1, h2, p');

        const darkState = {
          '--grad-1': 'rgba(35, 49, 66, 0.78)',
          '--grad-2': 'rgba(165, 222, 241, 0.36)',
          '--grad-3': 'rgba(54, 80, 108, 1)',
        };

        const lightState = {
          '--grad-1': 'rgba(54, 80, 108, 0.85)',
          '--grad-2': 'rgba(35, 49, 66, 0.5)',
          '--grad-3': 'rgba(160, 200, 220, 0.55)',
        };

        gsap.set(textEls, {
          textShadow: '0 0 0 rgba(0, 0, 0, 0)',
        });

        gsap
          .timeline()
          .to(
            heroSection,
            {
              ...lightState,
              duration: 3,
              ease: 'sine.inOut',
            },
            0,
          )
          .to(
            textEls,
            {
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)',
              duration: 3,
            },
            0,
          )
          .to(
            {},
            {
              duration: 1,
            },
          )
          .to(heroSection, {
            ...darkState,
            duration: 4,
            ease: 'sine.inOut',
          })
          .to(
            textEls,
            {
              textShadow: '0 0 0 rgba(0, 0, 0, 0)',
              duration: 6,
            },
            '<',
          )
          .to(
            {},
            {
              duration: 3,
            },
          );

        if (charsInfo) {
          this.animateCounter(this.kanjiCount.nativeElement, 6400, charsInfo);

          this.cycleCharacter(this.charFlip.nativeElement, this.heroChars, charsInfo);
        }

        [heroInfo, charsInfo, ctaSection].forEach((section) => {
          if (section) {
            revealOnScroll(section);
          }
        });

        if (heroText) {
          const textItems = heroText.querySelectorAll<HTMLElement>('h1, h2, p, .cta-hero-section');

          gsap.set(textItems, { opacity: 0, y: 24 });

          gsap.to(textItems, {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: 'power2.out',
            delay: 0.2, // opcional: deja que el logo empiece a dibujarse primero
          });
        }
      }
    }, this.el.nativeElement);
  }

  private cycleCharacter(el: HTMLElement, characters: string[], trigger: HTMLElement) {
    let index = 0;

    gsap
      .timeline({
        repeat: -1,
        repeatDelay: 1.2,
        scrollTrigger: {
          trigger,
          start: 'top 80%',
          toggleActions: 'play pause resume pause',
        },
      })
      .to(el, {
        rotationX: 90,
        duration: 0.3,
        ease: 'power1.in',
        onComplete: () => {
          index = (index + 1) % characters.length;
          el.textContent = characters[index];
        },
      })
      .set(el, { rotationX: -90 })
      .to(el, {
        rotationX: 0,
        duration: 0.3,
        ease: 'power1.out',
      });
  }

  ngOnDestroy(): void {
    this.animationContext?.revert();
  }

  private animateCounter(el: HTMLElement, target: number, trigger: HTMLElement) {
    const counter = { value: 0 };

    gsap.to(counter, {
      value: target,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      onUpdate: () => {
        el.textContent = `+${Math.floor(counter.value).toLocaleString('en-US')}`;
      },
    });
  }
}
