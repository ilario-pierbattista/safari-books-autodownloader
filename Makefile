.PHONY: setup
setup: .env
	npm i

.env:
	cp .env.dist .env
