import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterInfo } from './character-info';

describe('CharacterInfo', () => {
  let component: CharacterInfo;
  let fixture: ComponentFixture<CharacterInfo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterInfo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterInfo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
