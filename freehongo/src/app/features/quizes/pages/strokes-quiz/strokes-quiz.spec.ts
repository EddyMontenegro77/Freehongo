import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { StrokesQuiz } from './strokes-quiz';
import { ListService } from '../../../lists/services/list.service';

describe('StrokesQuiz', () => {
  let component: StrokesQuiz;
  let fixture: ComponentFixture<StrokesQuiz>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrokesQuiz],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: vi.fn(),
              },
              queryParamMap: {
                get: vi.fn(),
              },
            },
          },
        },
        {
          provide: ListService,
          useValue: {
            getListById: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StrokesQuiz);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
