package handlers

import (
	"context"
	"freehongo-api/internal/auth/middleware"
	"freehongo-api/internal/quizes/models"
	"freehongo-api/internal/quizes/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type QuizService interface {
	SubmitQuizSession(ctx context.Context, userId string, req models.SubmitQuizRequest) error

	FetchUserQuizSessions(ctx context.Context, userId string, req models.FetchUserQuizSessionsRequest) (models.QuizSessionsGroup, error)
	FetchQuizSessionDetail(ctx context.Context, userId string, req models.FetchQuizSessionDetailRequest) (models.QuizSessionDetail, error)
	FetchCharacterStats(ctx context.Context, userId string, req models.FetchCharacterStatsRequest) (models.CharacterStatsGroup, error)
	FetchListStats(ctx context.Context, userId string, req models.FetchListStatsRequest) (models.ListStats, error)
	FetchWeakCharacters(ctx context.Context, userId string, req models.FetchWeakCharactersRequest) (models.CharacterStatsGroup, error)
}

func PostSubmitQuizSession(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.SubmitQuizRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
		}

		err := quizService.SubmitQuizSession(c.Request.Context(), userId, req)
		if err != nil {
			utils.HandleQuizError(c, err)
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message":"quiz_created"})
	}
}

func GetUserQuizSessions(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context){
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchUserQuizSessionsRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		lists, err := quizService.FetchUserQuizSessions(c.Request.Context(), userId, req)
		if err != nil{
			utils.HandleQuizError(c, err) 
			return
		}

		c.JSON(http.StatusOK, lists)
	}
}

func GetQuizSessionDetail(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context){
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchQuizSessionDetailRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		lists, err := quizService.FetchQuizSessionDetail(c.Request.Context(), userId, req)
		if err != nil{
			utils.HandleQuizError(c, err) 
			return
		}

		c.JSON(http.StatusOK, lists)
	}
}

func GetCharacterStats(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context){
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchCharacterStatsRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		lists, err := quizService.FetchCharacterStats(c.Request.Context(), userId, req)
		if err != nil{
			utils.HandleQuizError(c, err) 
			return
		}

		c.JSON(http.StatusOK, lists)
	}
}

func GetWeakCharacters(quizService QuizService) gin.HandlerFunc {
	return func(c *gin.Context){
		userId, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchWeakCharactersRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleQuizError(c, models.ErrBadRequest)
			return
		}

		lists, err := quizService.FetchWeakCharacters(c.Request.Context(), userId, req)
		if err != nil{
			utils.HandleQuizError(c, err) 
			return
		}

		c.JSON(http.StatusOK, lists)
	}
}