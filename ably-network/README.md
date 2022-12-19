# Intro

Ably's network data basically encompasses two datasets: a list of datacenters locations and a list of edge PoPs location.

There's are three tasks involved in the process of all up-to-date which are explained in detail afterwards:

- Update datacenters list, by updating its datacenter-locations.csv file
- Update edge locations list, by updating aws-edge-locations.json
- On the ably.com website, update the network map illustration, as consequence of any update to the abovementioned datasets, to reflect added/remove pins (see ably.com README in `/data/network`)

## Updating datacenter locations

This is just a spreadsheet where each row corresponds to a location: as long as you keep the format you can perform CRUD operations (edit, remove, add) on it by direct file manipulation or opening with your .csv editor of choice (excel/libreOffice). The csv will be imported and website will reflect the changes.

**Note**: If you **add/remove** a datacenter location, you need to update the public website ably.com network map illustration accordingly

**Note**: The lat/long for AWS datacenters came from cities listed in https://dgtlinfra.com/amazon-web-services-aws-data-center-locations. Where a datacenter spans multiple cities (AZs), a random city was chosen. [Find out how to use Google Maps to return lat/long](https://support.google.com/maps/answer/18539?hl=en&co=GENIE.Platform%3DDesktop).

## Updating edge locations

We use the [`aws-edge-locations.json`](https://github.com/tobilg/aws-edge-locations/blob/master/dist/aws-edge-locations.json) file from [tobilg/aws-edge-locations](https://github.com/tobilg/aws-edge-locations) as our source of edge locations. We don't don't depend on the package in any way as it doesn't provide anything meaningful to us.

Simply download the file, and if the data has the same shape as the current version, replace it. Then proceed with the instructions below to find any missing/stale nodes on the map.

## Finding missing/stale edge locations for the ably.com website

Please see the ably.com README in `/data/network` for further instructions.
