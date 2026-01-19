# syntax=docker/dockerfile:1
# tag::front-matter[]
#---------------------------------------------------------------------#
# Copyright 2025 Språkbanken Tal
# Apache License Version 2.0
#---------------------------------------------------------------------#
# Application image for SBTal: snapshot and serve FLIC SDK <1>
#
# This Dockerfile implements three public build targets:
# (1) serve (default, snapshots and serves)
# (2) snapshot (snapshot only)
# (3) serve-mounted (serve existing snapshot, mounted)
#
# `snapshot` creates a snapshot of FLIC's Hub SDK IDE
# `serve` additionally includes a web server that
# 	serves the asnapshot locally
# 	(this can also be used to serve an existing snapshot)
#
# The reason for this is to safeguard against changes from FLIC,
# since they've show a pretty chevalier attitude to user concerns,
# and we're making a sizeable investment into their hardware.
#---------------------------------------------------------------------#
# This Dockerfile uses a multistage build sequence that adheres
# to Språkbanken Tal's OCI build policy for Docker.
#
# base-setup:    Base image setup stage; should be swapped for SBT OS
# snapshot-base: Essential installations; should be swapped for SBT OS
# snapshot-dl:   Image with current snapshot downloaded
# aggr:          Scratch image with current snapshot
# snapshot:      Clean image with current snapshot
# serve-base:    Clean web server installation, no snapshot
# serve-mounted: Web server expecting /snapshot to be mounted
# serve:         Web server running off internal /snapshot
#
#---------------------------------------------------------------------#
# <3> NB! This ought to use SBT's standard base OS and also its
# Hadolint validation - fix for final version.
#---------------------------------------------------------------------#
# end::front-matter[]
# tag::base-setup[]
#- Begin stage: base image setup -------------------------------------#
# OS and shell setup
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

# Versioning
ARG SBT_CA_CERTIFICATES_VERSION=20240203
ENV SBT_CA_CERTIFICATES_VERSION=${SBT_CA_CERTIFICATES_VERSION}

# Essential tools installation
RUN <<"END_ESSENTIAL"
#	exit 0
	echo "Installing essential packages (shell: $0)"
	apt-get update
	apt-get install --yes --no-install-recommends \
	ca-certificates="${SBT_CA_CERTIFICATES_VERSION}" \
	;
	apt-get clean
	rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
END_ESSENTIAL
# end::base-setup[]

# tag::snapshot-base[]
#- Begin stage: snapshot base image setup ----------------------------#
FROM base-setup AS snapshot-base

# We're breaking policy and use wget instead of curl here
# because we need the page cache functionality.
ARG SBT_WGET_VERSION=1.21.4-1ubuntu4.1
ENV SBT_WGET_VERSION=${SBT_WGET_VERSION}

RUN <<"END_ESSENTIAL"
#	exit 0
	echo "Installing essential packages (shell: $0)"
	apt-get update
	apt-get install --yes --no-install-recommends \
	wget="${SBT_WGET_VERSION}" \
	ca-certificates \
	;
	apt-get clean
	rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
END_ESSENTIAL
# end::snapshot-base[]

# tag::snapshot-dl[]
#- Begin stage: snapshot dl image setup ------------------------------#
FROM snapshot-base AS snapshot-dl

ARG SBT_SNAPSHOT_ROOT=/artifacts/snapshot
ARG SBT_SNAPSHOT_URL=https://hubsdk.flic.io/

RUN <<"END_SNAPSHOT"
# Mirror the Hub SDK IDE
	mkdir -p "${SBT_SNAPSHOT_ROOT}"
	mkdir -p "${SBT_SNAPSHOT_ROOT}/hubsdk.flic.io/js"

# There will be a few 404s that aren't important,
# so we need to block early exit temporarily
	set +e
	wget \
		--mirror \
		--convert-links \
		--adjust-extension \
		--page-requisites \
		--no-parent \
		--execute robots=off \
		--content-on-error \
		--directory-prefix "${SBT_SNAPSHOT_ROOT}" \
		"${SBT_SNAPSHOT_URL}"
	rc=$?
	# Reinstate early exit
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

	# Explicitly fetch WASM required by jssdkauth.js
	# Explicitly fetch dynamically loaded tools.js
	wget \
		--directory-prefix "${SBT_SNAPSHOT_ROOT}/hubsdk.flic.io/js" \
		https://hubsdk.flic.io/js/jssdkauth.wasm \
		https://hubsdk.flic.io/js/tools.js

END_SNAPSHOT
# end::snapshot-dl[]

# tag::aggr[]
#- Begin stage: aggregation scratch image setup ----------------------#
# This is a clean slate stage.
# The use of these is good practice and aligned with
# SBT best practices for Docker builds
FROM scratch AS aggr

COPY --from=snapshot-dl /artifacts/ /artifacts/
# end::aggr[]

# tag::snapshot[]
#- Begin stage: snapshot ---------------------------------------------#
FROM base-setup AS snapshot

ENV BUILDSTAGE="snapshot"

RUN <<"END_SNAPSHOT_GUARD"
if mountpoint -q /snapshot; then
	echo "ERROR: /snapshot is mounted during snapshot build." >&2
	echo "The snapshot target must exclusively own /snapshot." >&2
	exit 1
fi
END_SNAPSHOT_GUARD

# Copy snapshot artefacts
RUN --mount=type=bind,from=aggr,source=/artifacts,target=/artifacts \
	mkdir -p /snapshot && \
	rm -rf /snapshot/* && \
  cp -a /artifacts/. /
# end::snapshot[]


# tag::serve-base[]
#- Begin stage: serve-base -------------------------------------------#
FROM base-setup AS serve-base

# NB! We should use SBT standard web server here
# NB! Fix in next version

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
		listen 80;
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
# end::serve-base[]

# tag::serve-mounted[]
#- Begin stage: serve-mounted -----------------------------------------#
FROM serve-base AS serve-mounted

ENV BUILDSTAGE="serve-mounted"

EXPOSE 80

# Run nginx in foreground (OCI-correct)
CMD ["/bin/bash", "-c", "test -d /snapshot/hubsdk.flic.io || { echo 'ERROR: snapshot missing' >&2; exit 1; }; exec nginx -g 'daemon off;'"]

#CMD ["/bin/bash", "-c", "\
#	test -d /snapshot/hubsdk.flic.io \
#	|| { echo 'ERROR: /snapshot/hubsdk.flic.io not found (did you forget to mount a snapshot?)' >&2; exit 1; }; \
#	exec nginx -g 'daemon off;' \
#"]
# end::serve-mounted[]

# tag::serve[]
#- Begin stage: serve --------------------------------------------------#
FROM serve-base AS serve

ENV BUILDSTAGE="serve"

RUN <<"END_SNAPSHOT_GUARD"
# Ensure /snapshot is not externally mounted
# serve embeds its own snapshot and refuses overrides
if mountpoint -q /snapshot; then
	echo "ERROR: /snapshot is mounted, but this image embeds its own snapshot." >&2
	echo "Use the serve-mounted target instead." >&2
	exit 1
fi
END_SNAPSHOT_GUARD

# Copy snapshot artefacts
RUN --mount=type=bind,from=aggr,source=/artifacts,target=/artifacts \
	mkdir -p /snapshot && \
	rm -rf /snapshot/* && \
  cp -a /artifacts/. /

EXPOSE 80

# Run nginx in foreground (OCI-correct)

CMD ["nginx", "-g", "daemon off;"]
# end::serve[]
