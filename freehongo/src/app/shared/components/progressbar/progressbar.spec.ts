import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Progressbar, Milestone } from './progressbar';

describe('Progressbar', () => {
  let component: Progressbar;
  let fixture: ComponentFixture<Progressbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Progressbar],
    }).compileComponents();

    fixture = TestBed.createComponent(Progressbar);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Default values
  describe('Default values', () => {
    it('should have default input values', () => {
      expect(component.value()).toBe(0);
      expect(component.max()).toBe(100);
      expect(component.milestones()).toEqual([]);
      expect(component.barAriaLabel()).toBe('Progress bar');
    });

    it('should calculate 0 percent by default', () => {
      expect(component.percent()).toBe(0);
    });

    it('should generate the default ARIA label', () => {
      expect(component.progressAriaLabel()).toBe('Progress bar: 0%');
    });
  });

  // Percent calculation
  describe('percent', () => {
    it('should calculate the correct percentage', () => {
      fixture.componentRef.setInput('value', 50);
      fixture.detectChanges();

      expect(component.percent()).toBe(50);
    });

    it('should calculate percentage with a custom max', () => {
      fixture.componentRef.setInput('value', 25);
      fixture.componentRef.setInput('max', 50);
      fixture.detectChanges();

      expect(component.percent()).toBe(50);
    });

    it('should support decimal percentages', () => {
      fixture.componentRef.setInput('value', 1);
      fixture.componentRef.setInput('max', 3);
      fixture.detectChanges();

      expect(component.percent()).toBeCloseTo(33.3333, 3);
    });

    it('should not exceed 100 percent', () => {
      fixture.componentRef.setInput('value', 150);
      fixture.detectChanges();

      expect(component.percent()).toBe(100);
    });

    it('should not return a negative percentage', () => {
      fixture.componentRef.setInput('value', -20);
      fixture.detectChanges();

      expect(component.percent()).toBe(0);
    });

    it('should return 0 when max is zero', () => {
      fixture.componentRef.setInput('max', 0);
      fixture.componentRef.setInput('value', 50);
      fixture.detectChanges();

      expect(component.percent()).toBe(0);
    });

    it('should return 0 when max is negative', () => {
      fixture.componentRef.setInput('max', -100);
      fixture.componentRef.setInput('value', 50);
      fixture.detectChanges();

      expect(component.percent()).toBe(0);
    });

    it('should return 0 when max is not finite', () => {
      fixture.componentRef.setInput('max', Infinity);
      fixture.detectChanges();

      expect(component.percent()).toBe(0);
    });

    it('should return 0 when value is not finite', () => {
      fixture.componentRef.setInput('value', NaN);
      fixture.detectChanges();

      expect(component.percent()).toBe(0);
    });
  });

  // ARIA label
  describe('progressAriaLabel', () => {
    it('should use a custom ARIA label', () => {
      fixture.componentRef.setInput('barAriaLabel', 'Download progress');
      fixture.componentRef.setInput('value', 75);
      fixture.detectChanges();

      expect(component.progressAriaLabel()).toBe('Download progress: 75%');
    });

    it('should update when the percentage changes', () => {
      fixture.componentRef.setInput('value', 25);
      fixture.detectChanges();

      expect(component.progressAriaLabel()).toBe('Progress bar: 25%');

      fixture.componentRef.setInput('value', 80);
      fixture.detectChanges();

      expect(component.progressAriaLabel()).toBe('Progress bar: 80%');
    });
  });

  // Milestone position
  describe('position', () => {
    it('should calculate the correct milestone position', () => {
      fixture.componentRef.setInput('max', 100);

      const milestone: Milestone = {
        value: 50,
        label: 'Halfway',
      };

      expect(component.position(milestone)).toBe(50);
    });

    it('should calculate position with a custom max', () => {
      fixture.componentRef.setInput('max', 200);

      const milestone: Milestone = {
        value: 50,
        label: 'Quarter',
      };

      expect(component.position(milestone)).toBe(25);
    });

    it('should not exceed 100 percent', () => {
      const milestone: Milestone = {
        value: 150,
        label: 'Beyond max',
      };

      expect(component.position(milestone)).toBe(100);
    });

    it('should not return a negative position', () => {
      const milestone: Milestone = {
        value: -20,
        label: 'Negative',
      };

      expect(component.position(milestone)).toBe(0);
    });

    it('should return 0 when max is zero', () => {
      fixture.componentRef.setInput('max', 0);

      const milestone: Milestone = {
        value: 50,
        label: 'Test',
      };

      expect(component.position(milestone)).toBe(0);
    });

    it('should return 0 when max is negative', () => {
      fixture.componentRef.setInput('max', -100);

      const milestone: Milestone = {
        value: 50,
        label: 'Test',
      };

      expect(component.position(milestone)).toBe(0);
    });

    it('should return 0 when milestone value is not finite', () => {
      const milestone: Milestone = {
        value: NaN,
        label: 'Invalid',
      };

      expect(component.position(milestone)).toBe(0);
    });

    it('should return 0 when max is not finite', () => {
      fixture.componentRef.setInput('max', Infinity);

      const milestone: Milestone = {
        value: 50,
        label: 'Test',
      };

      expect(component.position(milestone)).toBe(0);
    });
  });

  // Milestone reached
  describe('reached', () => {
    it('should return true when value is equal to milestone', () => {
      fixture.componentRef.setInput('value', 50);

      const milestone: Milestone = {
        value: 50,
        label: 'Halfway',
      };

      expect(component.reached(milestone)).toBe(true);
    });

    it('should return true when value exceeds milestone', () => {
      fixture.componentRef.setInput('value', 75);

      const milestone: Milestone = {
        value: 50,
        label: 'Halfway',
      };

      expect(component.reached(milestone)).toBe(true);
    });

    it('should return false when value is below milestone', () => {
      fixture.componentRef.setInput('value', 25);

      const milestone: Milestone = {
        value: 50,
        label: 'Halfway',
      };

      expect(component.reached(milestone)).toBe(false);
    });
  });
});
