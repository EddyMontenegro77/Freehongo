package services

import (
	"context"

	"freehongo-api/internal/auth/models"
	"freehongo-api/internal/auth/repository"
	"freehongo-api/internal/auth/utils"
)

type GoogleSignInService struct {
	users *repository.UserRepository
}

func NewGoogleSignInService(users *repository.UserRepository) *GoogleSignInService {
	return &GoogleSignInService{users: users}
}

func (s *GoogleSignInService) SignIn(ctx context.Context, g models.GoogleIdentity) (models.SignInResult, error) {
	if !g.Verified || g.Subject == "" {
		return models.SignInResult{}, models.ErrInvalidGoogleClaims
	}
	g.Email = utils.NormalizeEmail(g.Email)
	if err := utils.IsValidEmail(g.Email); err != nil {
		return models.SignInResult{}, models.ErrInvalidGoogleClaims
	}
	result, err := s.signInOnce(ctx, g)

	if repository.IsUniqueViolation(err) {
		return s.signInOnce(ctx, g)
	}
	return result, err
}

func (s *GoogleSignInService) signInOnce(ctx context.Context, g models.GoogleIdentity) (models.SignInResult, error) {
	var result models.SignInResult
	err := s.users.InTx(ctx, "", func(q *repository.UserQueries) error {
		var err error
		result, err = resolveGoogleUser(ctx, q, g)
		return err
	})
	return result, err
}

func resolveGoogleUser(ctx context.Context, q *repository.UserQueries, g models.GoogleIdentity) (models.SignInResult, error) {
	if userID, found, err := q.FindUserIDByGoogleSub(ctx, g.Subject); err != nil {
		return models.SignInResult{}, err
	} else if found {
		if err := q.SetCurrentUserID(ctx, userID); err != nil {
			return models.SignInResult{}, err
		}
		return loginReturningUser(ctx, q, userID)
	}

	if user, found, err := q.FindActiveUserByEmailForUpdate(ctx, g.Email); err != nil {
		return models.SignInResult{}, err
	} else if found {
		if err := q.SetCurrentUserID(ctx, user.ID); err != nil {
			return models.SignInResult{}, err
		}
		return linkGoogleToExistingUser(ctx, q, user, g)
	}

	return registerNewGoogleUser(ctx, q, g)
}

func loginReturningUser(ctx context.Context, q *repository.UserQueries, userID string) (models.SignInResult, error) {
	if err := q.TouchLastLogin(ctx, userID); err != nil {
		return models.SignInResult{}, err
	}
	session, err := createSession(ctx, q, userID)
	if err != nil {
		return models.SignInResult{}, err
	}
	return models.SignInResult{UserID: userID, Outcome: models.OutcomeReturningUser, Session: &session}, nil
}

func linkGoogleToExistingUser(ctx context.Context, q *repository.UserQueries, user models.ExistingUser, g models.GoogleIdentity) (models.SignInResult, error) {
	if !user.EmailVerified {
		if err := q.MarkEmailVerifiedAndDropPassword(ctx, user.ID); err != nil {
			return models.SignInResult{}, err
		}
		if err := q.RevokeAllTokens(ctx, user.ID); err != nil {
			return models.SignInResult{}, err
		}
	}

	if err := q.InsertGoogleIdentity(ctx, user.ID, g.Subject); err != nil {
		return models.SignInResult{}, err
	}
	if err := q.TouchLastLogin(ctx, user.ID); err != nil {
		return models.SignInResult{}, err
	}
	session, err := createSession(ctx, q, user.ID)
	if err != nil {
		return models.SignInResult{}, err
	}
	return models.SignInResult{UserID: user.ID, Outcome: models.OutcomeLinkedToAccount, Session: &session}, nil
}

func registerNewGoogleUser(ctx context.Context, q *repository.UserQueries, g models.GoogleIdentity) (models.SignInResult, error) {
	username := g.Name
	if g.Name == "" {
		username = utils.GenerateUsername(g.Email)
	}
	userID, err := repository.NewUUIDv7()
	if err != nil {
		return models.SignInResult{}, err
	}
	if err := q.SetCurrentUserID(ctx, userID); err != nil {
		return models.SignInResult{}, err
	}
	userID, err = q.InsertVerifiedUser(ctx, userID, username, g.Email, g.PictureUrl)
	if err != nil {
		return models.SignInResult{}, err
	}
	if err := q.InsertGoogleIdentity(ctx, userID, g.Subject); err != nil {
		return models.SignInResult{}, err
	}
	session, err := createSession(ctx, q, userID)
	if err != nil {
		return models.SignInResult{}, err
	}
	return models.SignInResult{UserID: userID, Outcome: models.OutcomeNewAccount, Session: &session}, nil
}
