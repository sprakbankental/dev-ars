# Snapshots of the FLIC Hub IDE

## Putting code on the FLIC Hubs

FLIC does not publish the source code of its Hub IDE.
The only supported way to use it is via
FLIC’s web-hosted interface.

In practice, all runtime interaction between
the FLIC Hub and the IDE appears to be local:
communication with the hub itself takes place over the local network.
This, however, could change without users noticing.

The FLIC servers are involved only in:

- serving the IDE web application, and
- assisting with hub discovery on the local network (with limited reliability).

As an alternative to automatic discovery,
the IDE allows users to connect to
a hub by manually providing its IP address and password.

## Motivation for maintaining snapshots

This architecture implies a significant dependency risk.
If FLIC’s servers become unavailable
(temporarily, by vendor decision, or
due to FLIC discontinuing the service)
access to the IDE is lost.
In that case, hubs cannot be managed or updated, and
components running on them cannot be modified.

At the time of writing,
we have found no supported or documented way to access
FLIC hubs without the IDE being served from
FLIC-controlled infrastructure.

## Scope and non-goals

The purpose of the snapshots maintained here is
narrow and defensive.

They are intended to:

- preserve a locally servable copy of the FLIC Hub IDE,
- allow continued configuration and update of
FLIC hubs in the absence of FLIC-hosted infrastructure, and
- provide a stable reference for hub-side component development.

They are not intended to:

- reverse engineer or modify the IDE,
- bypass authentication or security mechanisms,
- replace the FLIC Hub SDK or its programming model, or
- provide a general-purpose development environment.

Snapshots are taken and used only to
the extent necessary to retain access to
hardware that is already owned and deployed.

## Snapshot contents

Each snapshot consists of a static capture of
the resources served by the FLIC Hub IDE web application, including:

- HTML, JavaScript, CSS, and image assets,
- WebAssembly components required by the IDE,
- bundled documentation and tutorial pages.

No hub-specific configuration, credentials, or
user code are included in the snapshot.

Snapshots are served locally using
a standard HTTP server and rely on
the same local-network communication paths as
the original IDE.

## Snapshot process

Snapshots are produced using a Docker-based workflow.

At a high level, the process is:

1. Fetch the IDE resources from the official FLIC endpoint.
2. Store the fetched resources in the repository working tree.
3. Serve the snapshot locally to verify basic functionality.
4. Perform manual verification against real FLIC hardware.
5. Commit the snapshot to version control.

The snapshot process is intentionally conservative.
No attempt is made to
infer or fabricate version numbers beyond what is observable in
the fetched resources themselves
(e.g. query parameters on asset URLs).

## Human-in-the-loop verification

Verification of a snapshot cannot be fully automated.

Because correct operation depends on communication with
physical FLIC hubs over the local network,
each snapshot requires manual testing by a human operator.

As part of verification, the operator must confirm that:

- the IDE loads correctly when served locally,
- a FLIC hub can be connected to,
- hub-side code can be deployed or updated, and
- runtime output is visible in the IDE console and terminal.

Only after successful verification is a snapshot committed.

## Logging and provenance

Each snapshot produces a log entry recording:

- the time of the snapshot,
- the source URL used for fetching,
- basic success or failure indicators, and
- the outcome of manual verification.

After committing a verified snapshot,
the corresponding Git commit identifier is recorded in
the log by the human operator.

The log is append-only and is intended to serve as
human-readable evidence of
what was fetched, tested, and endorsed at a given point in time.

## Limitations and forward compatibility

These snapshots rely on the assumption that:

- the IDE can be served as static web content, and
- communication between
the IDE and the hub remains local and unchanged.

If future versions of the FLIC Hub IDE introduce
new external dependencies or server-side requirements,
the snapshot approach described here may no longer be sufficient.

For this reason, snapshots should be
updated periodically and tested against
current hub firmware versions.

At some point in time, it may be necessary to version lock
the IDE and the Hub firmware, in which case it is likely that
FLIC button firmware must be version locked as well.

## Directory layout

The snapshot-related files are contained in
a dedicated subtree within the repository.

The layout is intentionally simple:

flic-hub-sdk/
├── Dockerfile
├── README.md
├── logs/
│   └── snapshot.log
├── snapshot
    └── css/
    └── js/
    └── static/
    └── index.html

The snapshot content (HTML, JavaScript, CSS, WASM, images)
is committed directly to version control.
Each commit therefore represents
a complete, self-contained IDE snapshot.

Logs are append-only and record
when a snapshot was taken,
what was fetched, and
how it was verified.
They intentionally duplicate information that could be
reconstructed from Git history,
in order to remain readable without Git tooling.

No attempt is made to
maintain multiple snapshots in parallel within the working tree.
Historical snapshots are accessed by checking out
the corresponding Git commit.
