import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CharacterPicker } from './character-picker';
import { characterPickerFacadeService } from '../../services/character-picker.facade.service';

describe('CharacterPicker', () => {
  let component: CharacterPicker;
  let fixture: ComponentFixture<CharacterPicker>;
  const characterPickerFacadeServiceMock = {
    loadCharacters: vi.fn().mockReturnValue(of({ items: [], totalCount: 0 })),
  };

  beforeEach(async () => {
    characterPickerFacadeServiceMock.loadCharacters.mockClear();

    await TestBed.configureTestingModule({
      imports: [CharacterPicker],
      providers: [
        {
          provide: characterPickerFacadeService,
          useValue: characterPickerFacadeServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterPicker);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load characters on init', () => {
    expect(characterPickerFacadeServiceMock.loadCharacters).toHaveBeenCalled();
    expect(component.characters()).toEqual([]);
  });

  it('should reset filters and reload characters', () => {
    component.unicode.setValue('3042');
    component.literal.setValue('あ');
    component.characterType.setValue('kana');
    component.kanaType.setValue('hiragana');
    component.kanaReading.setValue('a');
    component.radicalName.setValue('water');
    component.jlptLevel.setValue('1');
    component.gradeLevel.setValue('g1');
    component.sortBy.setValue('frequency_of_use');
    component.kanjiReading.setValue('にち');
    component.kanjiMeaning.setValue('sun');
    component.kanjiNanori.setValue('hi');
    component.currentPage = 3;

    component.resetFilters();

    expect(component.unicode.value).toBe('');
    expect(component.literal.value).toBe('');
    expect(component.characterType.value).toBe('kanji');
    expect(component.kanaType.value).toBe('all');
    expect(component.kanaReading.value).toBe('');
    expect(component.radicalName.value).toBe('');
    expect(component.jlptLevel.value).toBe('');
    expect(component.gradeLevel.value).toBe('');
    expect(component.sortBy.value).toBe('literal');
    expect(component.kanjiReading.value).toBe('');
    expect(component.kanjiMeaning.value).toBe('');
    expect(component.kanjiNanori.value).toBe('');
    expect(component.currentPage).toBe(1);
    expect(characterPickerFacadeServiceMock.loadCharacters).toHaveBeenCalledTimes(4);
  });
});
