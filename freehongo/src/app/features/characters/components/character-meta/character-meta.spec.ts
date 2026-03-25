import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterMeta } from './character-meta';

describe('CharacterMeta', () => {
  let component: CharacterMeta;
  let fixture: ComponentFixture<CharacterMeta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterMeta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterMeta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
