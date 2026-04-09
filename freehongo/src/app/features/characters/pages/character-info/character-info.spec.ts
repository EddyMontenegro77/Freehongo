import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CharacterInfo } from './character-info';
import { CharacterInfoFacadeService } from '../../services/character-info.facade.service';

describe('CharacterInfo', () => {
  let component: CharacterInfo;
  let fixture: ComponentFixture<CharacterInfo>;

  const characterInfoFacadeServiceMock = {
    loadCharacterInfo: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CharacterInfo],
      providers: [
        provideRouter([]),
        {
          provide: CharacterInfoFacadeService,
          useValue: characterInfoFacadeServiceMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CharacterInfo);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    characterInfoFacadeServiceMock.loadCharacterInfo.mockReturnValue(of({
      kind: 'kana',
      unicode: '3042',
      literal: 'あ',
      type: 'hiragana',
      stroke_count: 3,
      reading: 'a',
    }));
    fixture.componentRef.setInput('type', 'kana');
    fixture.componentRef.setInput('unicode', '3042');
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should render loading and then character meta on success', () => {
    characterInfoFacadeServiceMock.loadCharacterInfo.mockReturnValue(of({
      kind: 'kanji',
      unicode: '65e5',
      literal: '日',
      stroke_count: 4,
      readings: { on: ['ニチ'] },
      meanings: { en: ['sun'] },
      nanori: ['hi'],
    }));

    fixture.componentRef.setInput('type', 'kanji');
    fixture.componentRef.setInput('unicode', '65e5');
    fixture.detectChanges();

    expect(characterInfoFacadeServiceMock.loadCharacterInfo).toHaveBeenCalledWith('65e5', 'kanji');
    expect(component.character()).toEqual({
      kind: 'kanji',
      unicode: '65e5',
      literal: '日',
      stroke_count: 4,
      readings: { on: ['ニチ'] },
      meanings: { en: ['sun'] },
      nanori: ['hi'],
    });
  });

  it('should set an error on load failure', () => {
    characterInfoFacadeServiceMock.loadCharacterInfo.mockReturnValue(
      throwError(() => new Error('boom')),
    );

    fixture.componentRef.setInput('type', 'kana');
    fixture.componentRef.setInput('unicode', '3042');
    fixture.detectChanges();

    expect(component.loadError()).toBe('Could not load character');
    expect(component.character()).toBeNull();
  });
});
