import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Home } from './home';
import { ActivatedRoute, Router } from '@angular/router';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let router: any;

  beforeEach(async () => {
    router = {
      navigate: vi.fn(),
      createUrlTree: vi.fn().mockReturnValue({}),
      serializeUrl: vi.fn().mockReturnValue('/'),
    };

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: {} },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to the given route', () => {
    component.navigateTo('characters/picker/');
    expect(router.navigate).toHaveBeenCalledWith(['characters/picker/']);
  });
});
