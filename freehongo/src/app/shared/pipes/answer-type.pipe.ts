import { Pipe, PipeTransform } from '@angular/core';
import { AnswerType } from '../models/quizes/quizes.interface';

@Pipe({
  name: 'answerTypeLabel',
  standalone: true,
})
export class AnswerTypePipe implements PipeTransform {
  transform(value: AnswerType | null): string {
    const labels: Record<AnswerType, string> = {
      multiple: 'Multiple Choice',
      open: 'Open Answer',
      strokeWriting: 'Stroke Writing',
    };

    return value ? labels[value] : 'Unknown';
  }
}
