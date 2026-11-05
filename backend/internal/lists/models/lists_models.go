package models

type ListInfo struct {
	ListId     string   `json:"listId"`
	UserId     string   `json:"userId"`
	Name       string   `json:"name"`
	CreatedAt  string   `json:"createdAt"`
	UpdatedAt  string   `json:"updatedAt"`
	IsPublic   bool     `json:"isPublic"`
	ListType   string   `json:"listType"`
	CharUnicodes []string `json:"charUnicodes"`
}

type ListsGroup struct {
	Lists []ListInfo `json:"lists"`
}

type FetchListInfoRequest struct {
	ListId string `form:"listId" binding:"required,uuid"`
}

type FetchUserListsRequest struct {
	UserId   string  `form:"userId" binding:"required,uuid"`
	Name     *string `form:"name" binding:"omitempty,max=100"`
	ListType *string `form:"listType"`
	IsPublic *bool   `form:"isPublic"`
	Limit    int     `form:"limit" binding:"omitempty,min=1,max=100"`
	Offset   int     `form:"offset" binding:"omitempty,min=0"`
}

type CreateListRequest struct {
	ListId    string `json:"listId" binding:"required,uuid"`
	UserId    string `json:"userId" binding:"required,uuid"`
	Name      string `json:"name" binding:"required,min=1,max=100"`
	CreatedAt string `json:"createdAt" binding:"required"`
	UpdatedAt string `json:"updatedAt" binding:"required"`
	IsPublic  *bool  `json:"isPublic" binding:"required"`
	ListType  string `json:"listType" binding:"required"`
}

type DeleteListRequest struct {
	ListId string `json:"listId" binding:"required,uuid"`
}

type UpdateListRequest struct {
	ListId   string `json:"listId" binding:"required,uuid"`
	Name     string `json:"name" binding:"required,min=1,max=100"`
	IsPublic *bool   `json:"isPublic" binding:"required"`
	ListType string `json:"listType" binding:"required"`
}

type FetchListCharactersRequest struct {
	ListId string `form:"listId" binding:"required,uuid"`
}

type AddListCharsRequest struct {
	ListId       string   `json:"listId" binding:"required,uuid"`
	CharUnicodes []string `json:"charUnicodes" binding:"required,min=1,dive,required"`
}

type DeleteListCharsRequest struct {
	ListId       string   `json:"listId" binding:"required,uuid"`
	CharUnicodes []string `json:"charUnicodes" binding:"required,min=1,dive,required"`
}

type UpdateListCharsRequest struct {
	ListId       string   `json:"listId" binding:"required,uuid"`
	CharUnicodes []string `json:"charUnicodes" binding:"required,min=1,dive,required"`
}