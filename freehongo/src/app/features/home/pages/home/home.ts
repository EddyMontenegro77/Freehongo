import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { NavigationBtn } from '../../../../shared/components/navigation-btn/navigation-btn';
import { Progressbar } from '../../../../shared/components/progressbar/progressbar';

interface HomeFeature {
  icon: string;
  title: string;
  description: string;
  route: string[];
  action: string;
}

@Component({
  selector: 'app-home',
  imports: [NavigationBtn, Progressbar],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);
  private animationContext?: gsap.Context;

  readonly currentYear = new Date().getFullYear();

  readonly heroChars = ['あ', 'ア', '日', 'か', 'カ', '本', 'さ', 'サ', '水'];

  readonly features: HomeFeature[] = [
    {
      icon: 'readings_icon.svg',
      title: 'Explore characters',
      description: 'Search readings, meanings, levels and usage details.',
      route: ['/characters/picker'],
      action: 'Open character picker',
    },
    {
      icon: 'edit.svg',
      title: 'Practice writing',
      description: 'Follow stroke order and get immediate feedback as you write.',
      route: ['/writing', 'kanji', '4e00'],
      action: 'Try writing',
    },
    {
      icon: 'play.svg',
      title: 'Take a quiz',
      description: 'Train readings, meanings, characters and stroke writing.',
      route: ['/quizzes'],
      action: 'Start a quiz',
    },
    {
      icon: 'create_list_icon.svg',
      title: 'Build your lists',
      description: 'Create private lists or discover public and official collections.',
      route: ['/lists'],
      action: 'Manage lists',
    },
    {
      icon: 'levels_icon.svg',
      title: 'Track your progress',
      description: 'Review accuracy, weak characters, trends and quiz history in your dashboard.',
      route: ['/dashboard'],
      action: 'Open dashboard',
    },
    {
      icon: 'sync.svg',
      title: 'Keep learning anywhere',
      description: 'Work locally with your lists and synchronize your practice when you are ready.',
      route: ['/lists'],
      action: 'See your lists',
    },
  ];

  navigateTo(route: string): void {
    void this.router.navigate([route]);
  }

  ngAfterViewInit(): void {
    if (typeof window.matchMedia !== 'function') return;

    gsap.registerPlugin(ScrollTrigger);
    const root = this.host.nativeElement as HTMLElement;

    this.animationContext = gsap.context(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const heroItems = root.querySelectorAll<HTMLElement>('.hero__content > *');
      const logo = root.querySelector<HTMLElement>('.hero__logo');
      const floatingChars = root.querySelectorAll<HTMLElement>('.hero__character');
      const revealItems = root.querySelectorAll<HTMLElement>('[data-reveal]');
      const practiceCharacter = root.querySelector<HTMLElement>('.practice-demo__character');
      const kanjiCount = root.querySelector<HTMLElement>('.progress-demo__kanji-count span');
      const progressSection = root.querySelector<HTMLElement>('.progress-section');

      if (reduceMotion) {
        gsap.set(heroItems, { opacity: 1, clearProps: 'transform' });
        gsap.set(revealItems, { opacity: 1, clearProps: 'transform' });
        if (kanjiCount) kanjiCount.textContent = '6,400';
        return;
      }

      gsap.fromTo(heroItems, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      });

      if (logo) {
        gsap.fromTo(logo, { opacity: 0, scale: 0.82, rotation: -8 }, {
          opacity: 1, scale: 1, rotation: 0, duration: 1.1, ease: 'back.out(1.6)', delay: 0.15,
        });
      }

      floatingChars.forEach((character, index) => {
        gsap.to(character, {
          y: index % 2 === 0 ? -14 : 14,
          rotation: index % 2 === 0 ? 4 : -4,
          duration: 2.8 + index * 0.35,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.2,
        });
      });

      if (practiceCharacter) {
        let index = 0;

        gsap.timeline({ repeat: -1, repeatDelay: 1.1 }).to(practiceCharacter, {
          rotationX: 90,
          duration: 0.3,
          ease: 'power1.in',
          onComplete: () => {
            index = (index + 1) % this.heroChars.length;
            practiceCharacter.textContent = this.heroChars[index];
          },
        }).set(practiceCharacter, { rotationX: -90 }).to(practiceCharacter, {
          rotationX: 0,
          duration: 0.3,
          ease: 'power1.out',
        });
      }

      if (kanjiCount && progressSection) {
        const counter = { value: 0 };

        gsap.to(counter, {
          value: 6400,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: progressSection,
            start: 'top 78%',
            toggleActions: 'play none none none',
          },
          onUpdate: () => {
            kanjiCount.textContent = Math.floor(counter.value).toLocaleString('en-US');
          },
        });
      }

      revealItems.forEach((section) => {
        gsap.fromTo(section, { opacity: 0, y: 42 }, {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 82%',
            toggleActions: 'play none none reverse',
          },
        });
      });

      gsap.fromTo(root.querySelectorAll<HTMLElement>('.feature-card'), { opacity: 0, y: 24 }, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.features-grid',
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
      });
    }, root);
  }

  ngOnDestroy(): void {
    this.animationContext?.revert();
  }
}
