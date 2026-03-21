.PHONY: backend frontend

backend:
	cd backend && air

frontend:
	cd ./Freehongo && ng serve