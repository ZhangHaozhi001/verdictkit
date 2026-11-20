# Steering — Citation Format

Every verdict citation carries exactly these fields (the citation-lint gate
checks the same list — keep the two in sync):

| field | meaning |
|---|---|
| evidenceId | stable id of the evidence item |
| sourceId | independent-source identity |
| sourceLabel | human-readable source name |
| excerpt | verbatim excerpt, never rewritten |
| publishedAt | ISO-8601 publication/observation time |
| authority | 1, 2 or 3 |
| stance | support / refute / context |
| contribution | numeric score contribution (authority x freshness x corroboration) |

A verdict object missing any citation field is invalid and must fail the
gate in `src/core/verdict.ts` (`assertCitationComplete`) before rendering.
