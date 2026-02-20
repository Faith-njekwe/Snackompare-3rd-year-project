# Backend System Tests

System tests (also called end-to-end tests) verify complete multi-step user flows across the full backend stack. Each test exercises several API endpoints in sequence to confirm that features work together correctly as a whole.

**Source file:** `backend/api/tests/test_comprehensive.py`
**Run with:** `python manage.py test api.tests.test_comprehensive`
**Total system tests:** 8

---

## Authentication Flow

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_S_01 | Register then login returns a consistent token | None | Step 1: POST `/api/auth/register/` with email="sys_auth@example.com", password="securepass". Step 2: POST `/api/auth/login/` with same credentials | Both return HTTP 200; login token matches registration token | Pass |
| TC_B_S_02 | Duplicate registration is rejected | None | Step 1: POST `/api/auth/register/` with email="dupe@example.com". Step 2: POST `/api/auth/register/` again with same email | First returns HTTP 200; second returns HTTP 400 | Pass |

---

## Profile Lifecycle

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_S_03 | New user automatically receives a default profile | None | GET `/api/profile/?user_id=new-user` for a user that doesn't exist yet | HTTP 200, profile returned with goal="maintain" | Pass |
| TC_B_S_04 | Full profile lifecycle — create, update, retrieve | None | Step 1: PUT `/api/profile/` with user_id="sys-profile-user", name="Bob", goal="lose". Step 2: PUT same user_id with name="Bob Updated", goal="gain". Step 3: GET `/api/profile/?user_id=sys-profile-user` | GET returns HTTP 200 with name="Bob Updated" and goal="gain" | Pass |

---

## Favourites Lifecycle

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_S_05 | Full add, list, delete, verify empty cycle | Product SYS-P1 created in DB | Step 1: POST `/api/favourites/` to add SYS-P1 for user. Step 2: GET `/api/favourites/` — expect 1 item. Step 3: DELETE `/api/favourites/` for SYS-P1. Step 4: GET `/api/favourites/` again | Add/delete return HTTP 200; first list shows 1 item; second list shows 0 items | Pass |
| TC_B_S_06 | Adding the same favourite twice is idempotent | Product created in DB | Step 1: POST `/api/favourites/` with same user_id and code. Step 2: POST again with same user_id and code. Step 3: GET `/api/favourites/` | Both POSTs return HTTP 200; GET shows exactly 1 favourite, not 2 | Pass |

---

## Explain Fallback

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_S_07 | Explain endpoint returns deterministic fallback without OpenAI | OPENAI_API_KEY removed from environment | POST `/api/explain/` with base product "Crisps" (sugar=2, salt=1.5, saturatedFat=5) and alternative "Rice Cakes" (lower nutrients) | HTTP 200, response contains "explanation" field | Pass |

---

## Chat Validation

| Test Case ID | Test Description | Prerequisites | Test Steps | Expected Result | Status |
|---|---|---|---|---|---|
| TC_B_S_10 | Chat endpoint strips injected profile fields (XSS prevention) | Mocked OpenAI client | POST `/api/chat/` with prompt="What should I eat?" and profileContext containing injected_field="<script>alert(1)</script>" | HTTP 200, injected_field is stripped and not passed to the model | Pass |
