.PHONY: up be down logs deploy

COMPOSE=docker compose --env-file .env.ngrok

up:
	$(COMPOSE) --profile tunnel up --build -d

be:
	$(COMPOSE) up --build -d backend db

down:
	$(COMPOSE) --profile tunnel down

logs:
	$(COMPOSE) --profile tunnel logs -f

deploy:
	bash scripts/deploy.sh
