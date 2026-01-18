# syntax=docker/dockerfile:1
# tag::front-matter[]
#---------------------------------------------------------------------#
# Copyright 2025 Språkbanken Tal
# Apache License Version 2.0
#---------------------------------------------------------------------#
# Application image for SBTal: snapshot and serve FLIC SDK <1>
#
# This Dockerfile implements two public build targets:
# (1) snapshot
# (2) serve
#
# `snapshot` creates a snapshot of FLIC's Hub SDK IDE
# `serve`serves such a asnapshot locally
#
# The reason for this is to safeguard against changes from FLIC,
# since they've show a pretty chevalier attitude to user concerns,
# and we're making a sizeable investment into their hardware.
#---------------------------------------------------------------------#
# This Dockerfile uses a multistage build sequence that adheres
# to Språkbanken Tal's OCI build policy for Docker. <2>
#
# Base image setup stage: base-setup
#---------------------------------------------------------------------#
# <3> NB! This ought to use SBT's standard base OS and also its
# Hadolint validation - fix for final version.
#---------------------------------------------------------------------#
# end::front-matter[]
# tag::base-setup[]
#- Begin stage: base image setup -------------------------------------# # <1>
# 1. OS and shell setup
ARG SBT_OS=ubuntu
ARG SBT_OS_VERSION=24.04
FROM ${SBT_OS}:${SBT_OS_VERSION} AS base-setup

# Set shell and shell options
# tag::pattern-shell-setup[]
SHELL ["/bin/bash", "-euxo", "pipefail", "-c"]
# end::pattern-shell-setup[]

# Local build arguments and environment variables <4>
ENV BUILDSTAGE="base-setup"
ARG SHOW_BUILD_STATS=none
ENV SHOW_BUILD_STATS=${SHOW_BUILD_STATS}


# Snapshot-only Dockerfile for Flic Hub SDK IDE
# Base: Ubuntu 24.04 LTS (policy-compliant)

FROM base-setup AS snapshot-base

ENV DEBIAN_FRONTEND=noninteractive

# 4. Essential tools installation <5>
RUN <<"END_ESSENTIAL"
#	exit 0
	echo "Installing essential packages (shell: $0)"
	apt-get update
	apt-get install --yes --no-install-recommends \
	wget \
	ca-certificates \
	;
	apt-get clean
	rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
END_ESSENTIAL

WORKDIR /snapshot

FROM snapshot-base AS snapshot

RUN <<"END_SNAPSHOT"
# Mirror the Hub SDK IDE
	set +e
	wget \
		--mirror \
		--convert-links \
		--adjust-extension \
		--page-requisites \
		--no-parent \
		--execute robots=off \
		--content-on-error \
		https://hubsdk.flic.io/
	rc=$?
	set -e
	case "$rc" in
		0|8)
			echo "wget completed with acceptable exit code: $rc"
			;;
		*)
			echo "wget failed with unacceptable exit code: $rc" >&2
			exit "$rc"
			;;
	esac
END_SNAPSHOT

RUN <<"END_WASM"
	# Explicitly fetch WASM required by jssdkauth.js
	mkdir -p hubsdk.flic.io/js
	wget \
		-O hubsdk.flic.io/js/jssdkauth.wasm \
		https://hubsdk.flic.io/js/jssdkauth.wasm
END_WASM

RUN <<"END_TOOLS_JS"
	# Explicitly fetch dynamically loaded tools.js
	mkdir -p hubsdk.flic.io/js
	wget \
		-O hubsdk.flic.io/js/tools.js \
		https://hubsdk.flic.io/js/tools.js
END_TOOLS_JS

# tag::serve-base[]
#- Begin stage: serve-base --------------------------------------------#
FROM base-setup AS serve-base

ENV DEBIAN_FRONTEND=noninteractive

# Install nginx (and nothing else)
RUN <<"END_SERVE_BASE"
	echo "Installing nginx for static serving"
	apt-get update
	apt-get install --yes --no-install-recommends \
		nginx \
	;
	apt-get clean
	rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
END_SERVE_BASE
# end::serve-base[]

# tag::nginx-config[]
RUN <<"END_NGINX_CONF"
cat >/etc/nginx/nginx.conf <<'EOF'
worker_processes  1;

events {
	worker_connections  1024;
}

http {
	include       mime.types;
	default_type  application/octet-stream;

	sendfile        on;
	keepalive_timeout  65;

	server {
		listen 8000;
		server_name localhost;

		root /snapshot/hubsdk.flic.io;
		index index.html;

		location / {
			try_files $uri $uri/ =404;
		}
	}
}
EOF
END_NGINX_CONF
# end::nginx-config[]

# tag::serve[]
#- Begin stage: serve --------------------------------------------------#
FROM serve-base AS serve

ENV BUILDSTAGE="serve"

# Copy snapshot artefacts
COPY --from=snapshot /snapshot /snapshot

EXPOSE 8000

# Run nginx in foreground (OCI-correct)
CMD ["nginx", "-g", "daemon off;"]
# end::serve[]
