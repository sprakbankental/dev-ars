# Snapshots of FLIC's Hub IDE

FLIC does not share its Hub IDE code openly, and
the only way to use it is cloud-based, through their web.

Currently, all interactions between the FLIC Hub and
the IDE are local, and the FLIC servers are only involved
in

- serving the IDE page and
- doing FLIC Hub discovery (poorly) on the local network.

An alterantive to rthe automatic discovery is provided:
users can simply type in IP and password.

What this means, however, is that if
the FLIC servers go down
(temporarily, through a decision by FLIC, or by FLIC going defunct)
we lose access to the FLIC Hubs and cannot update
the components we run on them.
We have found no other way to access the Hubs.


