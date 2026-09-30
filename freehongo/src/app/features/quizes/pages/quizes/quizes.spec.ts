import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { Quizes } from './quizes';

describe('Quizes', () => {
  let component: Quizes;
  let fixture: ComponentFixture<Quizes>;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    routerMock = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [Quizes],
      providers: [{ provide: Router, useValue: routerMock }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Quizes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the lists section', () => {
    expect(fixture.nativeElement.querySelector('app-lists-display')).toBeTruthy();
  });

  it('navigates to a practice quiz for the selected list', async () => {
    await component.takeQuiz('list-1');

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/quizes', 'practice', 'list-1'],
      {
        queryParams: {
          type: 'characterToReading',
          answerType: 'multiple',
          order: 'random',
        },
      },
    );
  });
});
