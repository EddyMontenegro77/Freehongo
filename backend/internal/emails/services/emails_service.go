package services

import (
	"context"
	"errors"
	"fmt"
	"freehongo-api/internal/emails/models"

	"github.com/resend/resend-go/v4"
)

type Mailer struct {
	client *resend.Client
}

type Sender interface {
	Send(ctx context.Context, req models.EmailRequest) (string, error)
}

func NewMailer(apiKey string) (*Mailer, error) {
	if apiKey == "" {
		return nil, errors.New("RESEND_API_KEY not configured")
	}
	return &Mailer{client: resend.NewClient(apiKey)}, nil
}

func (m *Mailer) Send(ctx context.Context, req models.EmailRequest) (string, error) {

	params := &resend.SendEmailRequest{
		From:    req.From,
		To:      req.To,
		Subject: req.Subject,
		Html:    req.Html,
	}

	sent, err := m.client.Emails.SendWithContext(ctx, params)
	if err != nil {
		return "", fmt.Errorf("sending  email: %w", err)
	}
	return sent.Id, nil
}
