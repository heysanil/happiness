---
"happiness": patch
---

Correct the OpenAPI spec to match actual API inputs and outputs: add missing `organizerPicture`/`showRelatedPages` page fields and `tipAmount`/`refunded` donation fields, fix the donation schema description, exclude server-generated fields from required create/update properties, add the shared 404 error response, and document `include` relations on the donation and donor read operations.
