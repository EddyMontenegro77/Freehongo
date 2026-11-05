package handlers

import (
	"context"
	"freehongo-api/internal/auth/middleware"
	"freehongo-api/internal/lists/models"
	"freehongo-api/internal/lists/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ListService interface {
	FetchListInfo(ctx context.Context, req models.FetchListInfoRequest) (models.ListInfo, error)
	FetchUserLists(ctx context.Context, req models.FetchUserListsRequest) (models.ListsGroup, error)
	CreateList(ctx context.Context, req models.CreateListRequest) (error)
	DeleteList(ctx context.Context, req models.DeleteListRequest) (error)
	UpdateList(ctx context.Context, req models.UpdateListRequest) (error)

	FetchListCharacters(ctx context.Context, req models.FetchListCharactersRequest) (models.ListCharacters, error)
	AddListCharacters(ctx context.Context, req models.AddListCharsRequest) (error)
	DeleteListCharacters(ctx context.Context, req models.DeleteListCharsRequest) (error)
	UpdateListCharacters(ctx context.Context, req models.UpdateListCharsRequest) (error)
}

func GetListInfo(listService ListService) gin.HandlerFunc {
	return func(c *gin.Context){
		_, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchListInfoRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleListError(c, models.ErrBadRequest)
			return
		}

		listInfo, err := listService.FetchListInfo(c.Request.Context(), req)
		if err != nil{
			utils.HandleListError(c, err) // PENDING
			return
		}

		c.JSON(http.StatusOK, listInfo)
	}
}

func GetUserLists(listService ListService) gin.HandlerFunc {
	return func(c *gin.Context){
		_, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchUserListsRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleListError(c, models.ErrBadRequest)
			return
		}

		lists, err := listService.FetchUserLists(c.Request.Context(), req)
		if err != nil{
			utils.HandleListError(c, err) // PENDING
			return
		}

		c.JSON(http.StatusOK, lists)
	}
}

func GetListCharacters(listService ListService) gin.HandlerFunc {
	return func(c *gin.Context){
		_, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.FetchListCharactersRequest;
		if err := c.ShouldBindQuery(&req); err != nil {
			utils.HandleListError(c, models.ErrBadRequest)
			return
		}

		charUnicodes, err := listService.FetchListCharacters(c.Request.Context(), req)
		if err != nil{
			utils.HandleListError(c, err) // PENDING
			return
		}

		c.JSON(http.StatusOK, charUnicodes)
	}
}	


func PostCreateList(listService ListService) gin.HandlerFunc {
	return func(c *gin.Context){
		_, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.CreateListRequest;
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleListError(c, models.ErrBadRequest)
			return
		}

		err := listService.CreateList(c.Request.Context(), req)
		if err != nil{
			utils.HandleListError(c, err) // PENDING
			return
		}

		c.JSON(http.StatusCreated, gin.H{"message":"list_created"})
	}
}

func DeleteList(listService ListService) gin.HandlerFunc {
	return func(c *gin.Context){
		_, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.DeleteListRequest;
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleListError(c, models.ErrBadRequest)
			return
		}

		err := listService.DeleteList(c.Request.Context(), req)
		if err != nil{
			utils.HandleListError(c, err) // PENDING
			return
		}

		c.JSON(http.StatusOK, gin.H{"message":"list_deleted"})
	}
}

func PutUpdateList(listService ListService) gin.HandlerFunc {
	return func(c *gin.Context){
		_, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.UpdateListRequest;
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleListError(c, models.ErrBadRequest)
			return
		}

		err := listService.UpdateList(c.Request.Context(), req)
		if err != nil{
			utils.HandleListError(c, err) // PENDING
			return
		}

		c.JSON(http.StatusOK, gin.H{"message":"list_updated"})
	}
}

func PostAddListCharacters(listService ListService) gin.HandlerFunc {
	return func(c *gin.Context){
		_, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.AddListCharsRequest;
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleListError(c, models.ErrBadRequest)
			return
		}

		err := listService.AddListCharacters(c.Request.Context(), req)
		if err != nil{
			utils.HandleListError(c, err) // PENDING
			return 
		}

		c.JSON(http.StatusOK, gin.H{"message":"character_added"})
	}
}

func DeleteListCharacters(listService ListService) gin.HandlerFunc {
	return func(c *gin.Context){
		_, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.DeleteListCharsRequest;
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleListError(c, models.ErrBadRequest)
			return
		}

		err := listService.DeleteListCharacters(c.Request.Context(), req)
		if err != nil{
			utils.HandleListError(c, err) // PENDING
			return
		}

		c.JSON(http.StatusOK, gin.H{"message":"character_removed"})
	}
}

func PutUpdateListCharacters(listService ListService) gin.HandlerFunc {
	return func(c *gin.Context){
		_, ok := middleware.UserID(c)
		if !ok {
			middleware.AbortUnauthorized(c)
			return
		}

		var req models.UpdateListCharsRequest;
		if err := c.ShouldBindJSON(&req); err != nil {
			utils.HandleListError(c, models.ErrBadRequest)
			return
		}

		err := listService.UpdateListCharacters(c.Request.Context(), req)
		if err != nil{
			utils.HandleListError(c, err) // PENDING
			return
		}

		c.JSON(http.StatusOK, gin.H{"message":"characters_updated"})
	}
}