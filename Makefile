.PHONY: backend frontend

backend:
	cd backend && air

frontend:
	cd ./freehongo && ng serve
