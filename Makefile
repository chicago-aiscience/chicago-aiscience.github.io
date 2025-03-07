# Configuration
IMAGE_NAME := jekyll
COMMON_DOCKER_ARGS := -v $(PWD):/site -v jekyll_bundle_cache:/usr/local/bundle
COMMON_PORT := -p 4000:4000
JEKYLL_CMD := bundle exec jekyll serve --config _config.yml,_config_local.yml --livereload --host 0.0.0.0

.PHONY: build reload server trace

# Build the Docker image
build: 
	docker build . -t $(IMAGE_NAME)

# Run with live reload
reload: build
	docker run $(COMMON_DOCKER_ARGS) $(COMMON_PORT) $(IMAGE_NAME) $(JEKYLL_CMD)

# Run server (same as reload but with a different name)
serve: build
	docker run $(COMMON_DOCKER_ARGS) $(COMMON_PORT) $(IMAGE_NAME) $(JEKYLL_CMD)

inter: build
	docker run -it $(COMMON_DOCKER_ARGS) $(IMAGE_NAME) /bin/bash

# Run server with trace option for debugging
trace: build
	docker run $(COMMON_DOCKER_ARGS) $(COMMON_PORT) $(IMAGE_NAME) $(JEKYLL_CMD) --trace

clean:
	docker volume rm jekyll_bundle_cache || true

rebuild: clean build serve