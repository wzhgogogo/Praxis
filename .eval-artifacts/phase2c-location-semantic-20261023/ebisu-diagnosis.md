# Ebisu: bounded diagnosis before repair

All three exposed Phase2b h03/h09/h15 runs record one named-location Google request, no returned places, and no browser runtime calls. [Exact saved events and SHA](ebisu-diagnosis.json). The request can be deterministically reconstructed as Text Search POST with textQuery=Ebisu and pageSize10, without locationBias, regionCode or languageCode: no task coordinates were supplied, and the named NEAR request does not use the nearby-only fallback. This is code-based reconstruction, not a preserved raw wire request.

The Google client does not swallow ordinary HTTP rejection, timeout, network or JSON errors into []. Its successful parser returns response.places or []; an omitted places field and an explicit empty array therefore become indistinguishable in the saved record. Original HTTP status and body were not captured, so the upstream reason for the empty/missing-field result is UNKNOWN. No supported claim of VPN, spelling, coverage or request-construction failure can be made. No guessed fix is applied to this request.

The authorized30-name check is an independent Google-only control with the pre-existing explicit Tokyo evaluation context, frozen in google-30-inputs.json. It cannot retroactively explain the un-biased historical calls.
