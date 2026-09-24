import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unicodeCharacter',
  standalone: true,
})
export class UnicodeCharacterPipe implements PipeTransform {
  transform(unicode: string): string {
    return String.fromCodePoint(parseInt(unicode, 16));
  }
}
