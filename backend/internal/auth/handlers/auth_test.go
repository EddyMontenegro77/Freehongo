package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"freehongo-api/internal/auth/models"

	"github.com/gin-gonic/gin"
)

type handlerPasswordAuth struct {
	signUpErr error
}

func (h *handlerPasswordAuth) SignUp(context.Context, models.RegisterRequest) error {
	return h.signUpErr
}

func (h *handlerPasswordAuth) SignIn(context.Context, models.LoginRequest) (models.Session, error) {
	return models.Session{}, nil
}

func (h *handlerPasswordAuth) Logout(context.Context, string) error { return nil }

type handlerEmailFlows struct {
	verificationEmail string
	verifySession     models.Session
	verifyErr         error
}

func (h *handlerEmailFlows) RequestVerification(context.Context, string) error { return nil }

func (h *handlerEmailFlows) RequestVerificationByEmail(_ context.Context, email string) error {
	h.verificationEmail = email
	return nil
}

func (h *handlerEmailFlows) VerifyEmail(context.Context, string) (models.Session, error) {
	return h.verifySession, h.verifyErr
}

func (h *handlerEmailFlows) RequestPasswordReset(context.Context, string) error { return nil }

func (h *handlerEmailFlows) RequestPasswordResetForUser(context.Context, string) error {
	return nil
}

func (h *handlerEmailFlows) ResetPassword(context.Context, string, string) error { return nil }

func TestPostSignUpDoesNotSetSessionAndRequestsVerification(t *testing.T) {
	gin.SetMode(gin.TestMode)
	flows := &handlerEmailFlows{}
	router := gin.New()
	router.POST("/signup", PostSignUp(&handlerPasswordAuth{}, flows))

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/signup", strings.NewReader(`{
		"name":"User","email":"user@example.com","password":"password123"
	}`))
	request.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", recorder.Code)
	}
	if recorder.Header().Get("Set-Cookie") != "" {
		t.Fatal("signup must not create a session cookie")
	}
	if flows.verificationEmail != "user@example.com" {
		t.Fatalf("verification requested for %q", flows.verificationEmail)
	}
}

func TestGetVerifyEmailSetsSessionCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)
	flows := &handlerEmailFlows{
		verifySession: models.Session{Token: "session-token", ExpiresAt: time.Now().Add(time.Hour)},
	}
	router := gin.New()
	router.GET("/verify", GetVerifyEmail(flows))

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/verify?token=verification-token", nil))

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
	if !strings.Contains(recorder.Header().Get("Set-Cookie"), "freehongo_session=session-token") {
		t.Fatal("verification must set the session cookie")
	}
}

func TestPostRequestVerificationByEmailReturnsGenericSuccess(t *testing.T) {
	gin.SetMode(gin.TestMode)
	flows := &handlerEmailFlows{}
	router := gin.New()
	router.POST("/verify", PostRequestVerificationByEmail(flows))

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPost, "/verify", strings.NewReader(`{"email":"unknown@example.com"}`))
	request.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", recorder.Code)
	}
}

func TestGetVerifyEmailPropagatesVerificationError(t *testing.T) {
	gin.SetMode(gin.TestMode)
	flows := &handlerEmailFlows{verifyErr: models.ErrInvalidActionToken}
	router := gin.New()
	router.GET("/verify", GetVerifyEmail(flows))

	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, httptest.NewRequest(http.MethodGet, "/verify?token=bad", nil))

	if recorder.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", recorder.Code)
	}
}
