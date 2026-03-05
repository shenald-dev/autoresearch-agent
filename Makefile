.PHONY: build test install docker-build clean

build:
	npm run build

test:
	npm test

install:
	npm link

docker-build:
	docker build -t your-username/autoresearch-agent:0.1.0 .

clean:
	rm -rf node_modules dist

