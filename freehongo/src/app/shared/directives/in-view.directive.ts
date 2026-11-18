import { Directive, ElementRef, inject, OnDestroy, OnInit, output } from '@angular/core';

@Directive({ selector: '[appInView]' })
export class InViewDirective implements OnInit, OnDestroy {
  readonly inView = output<void>();

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        this.inView.emit();

        this.observer?.unobserve(this.element);
        requestAnimationFrame(() => this.observer?.observe(this.element));
      },
      { rootMargin: '200px' },
    );

    this.observer.observe(this.element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
