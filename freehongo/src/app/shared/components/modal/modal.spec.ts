import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modal } from './modal';
import { ThemeService } from '../../services/theme/theme.service';

describe('Modal', () => {
  let component: Modal;
  let fixture: ComponentFixture<Modal>;
  const themeServiceMock = {
    getTheme: vi.fn().mockReturnValue('light'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modal],
      providers: [{ provide: ThemeService, useValue: themeServiceMock }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Modal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test modal');
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    (dialog as any).showModal = vi.fn();
    (dialog as any).close = vi.fn();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close dialog', () => {
    const dialog = fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;

    component.open();
    expect((dialog as any).showModal).toHaveBeenCalled();

    component.close();
    expect((dialog as any).close).toHaveBeenCalled();
  });
});
