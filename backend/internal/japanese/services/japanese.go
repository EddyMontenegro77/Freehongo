package services

import (
	"freehongo-api/internal/japanese/models"
	"freehongo-api/internal/japanese/repository"
)

type JapaneseService struct {
	kana  *repository.KanaRepository
	kanji *repository.KanjiRepository
}

func NewJapaneseService(kana *repository.KanaRepository, kanji *repository.KanjiRepository) *JapaneseService {
	return &JapaneseService{kana: kana, kanji: kanji}
}

func (s *JapaneseService) GetKana(unicode string) (*models.Kana, error) {
	return s.kana.Find(unicode)
}

func (s *JapaneseService) GetKanaWriting(unicode string) (*models.KanaWriting, error) {
	return s.kana.FindWriting(unicode)
}

func (s *JapaneseService) GetKanaDisplay(search *models.KanaSearch, offset int) (*models.KanaDisplayPage, error) {
	return s.kana.FindDisplay(search, offset)
}

func (s *JapaneseService) GetKanji(unicode string) (*models.Kanji, error) {
	return s.kanji.Find(unicode)
}

func (s *JapaneseService) GetKanjiWriting(unicode string) (*models.KanjiWriting, error) {
	return s.kanji.FindWriting(unicode)
}

func (s *JapaneseService) GetKanjiDisplay(search *models.KanjiSearch, offset int) (*models.KanjiDisplayPage, error) {
	return s.kanji.FindDisplay(search, offset)
}
