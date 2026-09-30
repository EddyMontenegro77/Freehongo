import { Injectable } from '@angular/core';
import { Character } from '../../../shared/models/japanese/character.model';
import {
  CharacterQuizQuestion,
  CharacterQuizType,
  QuizOption,
  QuizOrder,
} from '../../../shared/models/quizes/quizes.interface';

@Injectable({
  providedIn: 'root',
})
export class QuizQuestionService {
  createQuestions(
    characters: Character[],
    quizType: CharacterQuizType,
    order: QuizOrder,
  ): CharacterQuizQuestion[] {
    const questions = characters.flatMap((character) =>
      this.createQuestion(character, characters, quizType),
    );

    return order === 'random' ? this.shuffle(questions) : questions;
  }

  private createQuestion(
    character: Character,
    pool: Character[],
    quizType: CharacterQuizType,
  ): CharacterQuizQuestion[] {
    const answers = this.getAnswers(character, quizType);

    if (answers.length === 0) {
      return [];
    }

    const correctAnswer = answers[0];
    const promptValue = this.getPromptValue(character, quizType, correctAnswer);
    const distractors = this.getDistractors(pool, character, quizType, answers).slice(0, 3);
    const options: QuizOption[] = this.shuffle([
      { value: correctAnswer, label: correctAnswer },
      ...distractors.map((value) => ({ value, label: value })),
    ]);

    return [
      {
        prompt: this.createPrompt(character, promptValue, quizType),
        acceptedAnswers: answers,
        characterUnicode: character.unicode,
        options,
      },
    ];
  }

  /**
   * Returns all accepted answers for a character based on the quiz type.
   *
   * A character may have multiple accepted answers, such as multiple
   * readings or meanings for kanji.
   */
  private getAnswers(character: Character, quizType: CharacterQuizType): string[] {
    switch (quizType) {
      case 'characterToReading':
        return character.kind === 'kana'
          ? [character.reading]
          : Object.values(character.readings).flat();
      case 'readingToCharacter':
        return [character.literal];
      case 'characterToMeaning':
        return character.kind === 'kanji' ? Object.values(character.meanings).flat() : [];
      case 'meaningToCharacter':
        return [character.literal];
    }
  }

  /**
   * Returns unique incorrect answers from other characters in the pool.
   *
   * The current character and its accepted answers are excluded.
   * The remaining answers are shuffled before being returned.
   */
  private getDistractors(
    pool: Character[],
    current: Character,
    quizType: CharacterQuizType,
    acceptedAnswers: string[],
  ): string[] {
    return this.shuffle(
      pool
        .filter((character) => character.unicode !== current.unicode)
        .flatMap((character) => this.getAnswers(character, quizType))
        .filter(
          (answer, index, answers) =>
            !acceptedAnswers.includes(answer) && answers.indexOf(answer) === index,
        ),
    );
  }

  /**
   * Builds the prompt text based on the quiz type.
   */
  private createPrompt(
    character: Character,
    promptValue: string,
    quizType: CharacterQuizType,
  ): string {
    switch (quizType) {
      case 'characterToReading':
        return `What is the reading of ${character.literal}?`;
      case 'readingToCharacter':
        return `Which character matches ${promptValue}?`;
      case 'characterToMeaning':
        return `What is the meaning of ${character.literal}?`;
      case 'meaningToCharacter':
        return `Which character means ${promptValue}?`;
    }
  }

  /**
   * Gets the value to display in the question prompt.
   */
  private getPromptValue(
    character: Character,
    quizType: CharacterQuizType,
    fallback: string,
  ): string {
    if (quizType === 'readingToCharacter' && character.kind === 'kana') {
      return character.reading;
    }

    if (quizType === 'readingToCharacter' && character.kind === 'kanji') {
      return Object.values(character.readings).flat()[0] ?? fallback;
    }

    if (quizType === 'meaningToCharacter' && character.kind === 'kanji') {
      return Object.values(character.meanings).flat()[0] ?? fallback;
    }

    return fallback;
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];

    for (let index = result.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
    }

    return result;
  }
}
