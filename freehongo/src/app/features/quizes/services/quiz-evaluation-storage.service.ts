import { Injectable } from '@angular/core';
import { QuizEvaluationResult } from '../../../shared/models/quizes/quizes.interface';

const STORAGE_KEY = 'freehongo.quiz.evaluations';

@Injectable({ providedIn: 'root' })
export class QuizEvaluationStorageService {
  save(result: QuizEvaluationResult): void {
    const results = this.getAll();
    results.push(result);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  }

  getAll(): QuizEvaluationResult[] {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    try {
      const results: unknown = JSON.parse(stored);
      return Array.isArray(results) ? (results as QuizEvaluationResult[]) : [];
    } catch {
      return [];
    }
  }
}
