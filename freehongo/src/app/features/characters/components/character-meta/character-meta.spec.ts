import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { CharacterMeta } from './character-meta';

describe('CharacterMeta', () => {
  let component: CharacterMeta;
  let fixture: ComponentFixture<CharacterMeta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterMeta],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterMeta);
    component = fixture.componentInstance;
  });

  it('should render kana reading and expected preview', () => {
    fixture.componentRef.setInput('character', {
      kind: 'kana',
      unicode: '3042',
      literal: 'あ',
      type: 'hiragana',
      stroke_count: 3,
      reading: 'a',
    });
    fixture.componentRef.setInput(
      'expectedUrl',
      'https://supabaseMockUrl/storage/v1/object/public/japanese-characters/kana/3042.svg',
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('あ');
    expect(fixture.nativeElement.textContent).toContain('Reading');
    expect(fixture.nativeElement.textContent).toContain('a');
    expect(fixture.nativeElement.textContent).toContain('Type');
    expect(fixture.nativeElement.querySelector('.stroke-guide')).toBeTruthy();
  });

  it('should render kanji groups, expected preview and navigate to practice', () => {
    fixture.componentRef.setInput('character', {
      kind: 'kanji',
      unicode: '65e5',
      literal: '日',
      stroke_count: 4,
      radical_name: 'sun',
      frequency_of_use: 1,
      jlpt_level: 4,
      grade_level: 'g1',
      readings: { on: ['ニチ'], kun: ['ひ'] },
      meanings: { en: ['sun', 'day'] },
      nanori: ['hi'],
    });
    fixture.componentRef.setInput(
      'expectedUrl',
      'https://supabaseMockUrl/storage/v1/object/public/japanese-characters/kanji/65e5.svg',
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Summary');
    expect(fixture.nativeElement.textContent).toContain('Readings');
    expect(fixture.nativeElement.textContent).toContain('Meanings');
    expect(fixture.nativeElement.textContent).toContain('Nanori');
    expect(fixture.nativeElement.textContent).toContain('Radical: sun');
    expect(fixture.nativeElement.textContent).toContain('JLPT: N4');
    expect(fixture.nativeElement.textContent).toContain('Grade: g1');
    expect(fixture.nativeElement.textContent).toContain('ニチ');
    expect(fixture.nativeElement.textContent).toContain('ひ');
    expect(fixture.nativeElement.textContent).toContain('sun');
    expect(fixture.nativeElement.textContent).toContain('day');
    expect(fixture.nativeElement.querySelector('.stroke-guide')).toBeTruthy();

    const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.openPractice();

    expect(navigateSpy).toHaveBeenCalledWith(['writing', 'kanji', '65e5']);
  });
});
