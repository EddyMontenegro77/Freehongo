import { Pipe, PipeTransform } from '@angular/core';
import { CharacterQuizType } from '../models/quizes/quizes.interface';

@Pipe({
  name: 'characterQuizTypeLabel',
  standalone: true,
})
export class CharacterQuizTypePipe implements PipeTransform {
  transform(value: CharacterQuizType | null | undefined): string {
    if (!value) return 'Stroke Writing';

    const labels: Record<CharacterQuizType, string> = {
      characterToReading: 'Character to Reading',
      readingToCharacter: 'Reading to Character',
      characterToMeaning: 'Character to Meaning',
      meaningToCharacter: 'Meaning to Character',
    };

    return value ? labels[value] : 'Unknown';
  }
}
