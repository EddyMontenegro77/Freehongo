package models

type EmailRequest struct {
	From    string
	To      []string
	Subject string
	Html    string
}

func NewEmailReq(to []string, subject string, html string) EmailRequest {
	const freeHongoEmailEmitter = "FreeHongo <account@freehongo.edmondev.com>"
	return EmailRequest{
		From:    freeHongoEmailEmitter,
		To:      to,
		Subject: subject,
		Html:    html,
	}
}