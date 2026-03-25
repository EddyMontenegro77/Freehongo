import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { CharacterCard } from './character-card';

describe('CharacterCard', () => {
  let component: CharacterCard;
  let fixture: ComponentFixture<CharacterCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterCard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('literal', 'あ');
    fixture.componentRef.setInput('unicode', '3024');
    fixture.componentRef.setInput('type', 'kana');
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should navigate to writing practice with resolved signal values', async () => {
    fixture.componentRef.setInput('literal', 'あ');
    fixture.componentRef.setInput('unicode', '3024');
    fixture.componentRef.setInput('type', 'kana');
    fixture.detectChanges();

    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    component.openWritingPractice();

    expect(navigateSpy).toHaveBeenCalledWith(['writing', 'kana', '3024']);
  });
});
