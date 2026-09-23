---
name: person-information-skill
description: Search for personnel records in the internal registry CSV file. Get the name, city, country, or job title of individuals registered in the company system.
trigger_queries:
  - "Find job title for Lucas Dubois"
  - "Who lives in Tokyo?"
  - "Search registry for Software Engineers"
---

# Person Information Skill
This skill queries the local employee and personnel registry flat-file (`registry.csv`).

## Executable Tool Function
- Python Function: `person_search.query_person_registry(keyword, field)`
- Arguments:
  - `keyword` (string): The search query (e.g. "Lucas Dubois", "Software Engineer", "Canada").
  - `field` (string, optional): Specific field to search ('name', 'city', 'country', 'job_title', or 'all'). Default is 'all'.
