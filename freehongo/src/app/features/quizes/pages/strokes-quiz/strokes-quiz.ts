import { Component, inject, signal, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { WritingPractice } from '../../../writing/components/writing-practice/writing-practice';
import { ListService } from '../../../lists/services/list.service';

import {
  QuizMode,
  WritingValidationEvent,
} from '../../../../shared/models/quizes/quizes.interface';
import { CharacterType } from '../../../../shared/models/japanese/character.type';
import { getCharacterTypeFromUnicode } from '../../../../shared/models/japanese/character.helper';
import { shuffleCharacters } from '../../../../shared/models/lists/list.model';
import { expandUuid } from '../../../../shared/utils/urls.utils';

@Component({
  selector: 'app-strokes-quiz',
  imports: [WritingPractice],
  templateUrl: './strokes-quiz.html',
  styleUrl: './strokes-quiz.scss',
})
export class StrokesQuiz {
  @ViewChild(WritingPractice)
  private writingPractice!: WritingPractice;

  private readonly route = inject(ActivatedRoute);
  private readonly listService = inject(ListService);

  readonly mode = signal<QuizMode>('practice');
  readonly currentCharacter = signal<string>('');
  readonly type = signal<CharacterType>('kana');

  private characters: string[] = [];
  private currentIndex = 0;

  async ngOnInit(): Promise<void> {
    const mode = this.route.snapshot.paramMap.get('mode');
    const shortenListId = this.route.snapshot.paramMap.get('listId');
    const order = this.route.snapshot.queryParamMap.get('order');

    if (mode !== 'practice' && mode !== 'evaluation') {
      console.warn('mode inválido', mode);
      return;
    }

    if (!shortenListId) {
      console.warn('sin listId');
      return;
    }
    const listId = expandUuid(shortenListId);
    const list = await this.listService.getListById(listId);

    if (!list || list.characters.length < 2) {
      console.warn('lista inválida o con menos de 2 caracteres', list);
      return;
    }
    this.mode.set(mode);

    if (order === 'random') {
      this.characters = order === 'random' ? shuffleCharacters(list.characters) : list.characters;
    }
    this.setCurrentCharacter();
  }

  nextCharacter(): void {
    if (this.currentIndex >= this.characters.length - 1) {
      return;
    }

    this.currentIndex++;
    this.setCurrentCharacter();
    this.writingPractice.reset();
  }

  private setCurrentCharacter(): void {
    const character = this.characters[this.currentIndex];

    if (!character) {
      return;
    }

    const type = getCharacterTypeFromUnicode(character);

    if (type === 'unknown') {
      console.error(`Unknown character type for: ${character}`);
      return;
    }

    this.currentCharacter.set(character);
    this.type.set(type);
  }

  onValidationCompleted(validation: WritingValidationEvent): void {
    if (validation) {
      console.log(validation);
    }
  }
}
