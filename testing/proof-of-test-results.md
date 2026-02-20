# Backend — Proof of Test Results

This document records the output of running the full SnacKompare backend test suite and maps each test to its result. All tests were executed locally against a fresh in-memory database with no external network calls.

**Source file:** `backend/api/tests/test_comprehensive.py`
**Run command:** `python manage.py test api.tests.test_comprehensive --verbosity=2`
**Date:** 2026-02-20

---

## Terminal Output

```
Creating test database for alias 'default' ('file:memorydb_default?mode=memory&cache=shared')...
Found 47 test(s).
Operations to perform:
  Synchronize unmigrated apps: messages, rest_framework, staticfiles
  Apply all migrations: admin, api, auth, authtoken, contenttypes, sessions
Synchronizing apps without migrations:
  Creating tables...
    Running deferred SQL...
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  Applying admin.0001_initial... OK
  Applying admin.0002_logentry_remove_auto_add... OK
  Applying admin.0003_logentry_add_action_flag_choices... OK
  Applying api.0001_initial... OK
  Applying api.0002_userprofile... OK
  Applying api.0003_remove_userprofile_diet_remove_userprofile_filters_and_more... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0002_alter_permission_name_max_length... OK
  Applying auth.0003_alter_user_email_max_length... OK
  Applying auth.0004_alter_user_username_opts... OK
  Applying auth.0005_alter_user_last_login_null... OK
  Applying auth.0006_require_contenttypes_0002... OK
  Applying auth.0007_alter_validators_add_error_messages... OK
  Applying auth.0008_alter_user_username_max_length... OK
  Applying auth.0009_alter_user_last_name_max_length... OK
  Applying auth.0010_alter_group_name_max_length... OK
  Applying auth.0011_update_proxy_permissions... OK
  Applying auth.0012_alter_user_first_name_max_length... OK
  Applying authtoken.0001_initial... OK
  Applying authtoken.0002_auto_20160226_1747... OK
  Applying authtoken.0003_tokenproxy... OK
  Applying authtoken.0004_alter_tokenproxy_options... OK
  Applying sessions.0001_initial... OK
System check identified no issues (0 silenced).

test_login_with_wrong_password_returns_401 (api.tests.test_comprehensive.TestAuthEndpoints) ... ok
test_register_without_email_returns_400 (api.tests.test_comprehensive.TestAuthEndpoints) ... ok
test_register_without_password_returns_400 (api.tests.test_comprehensive.TestAuthEndpoints) ... ok
test_returns_serialized_product (api.tests.test_comprehensive.TestBarcodeEndpoint) ... ok
test_chat_empty_prompt (api.tests.test_comprehensive.TestChatEndpoint) ... ok
test_chat_spam_multiple_requests (api.tests.test_comprehensive.TestChatEndpoint) ... ok
test_chat_too_long_message (api.tests.test_comprehensive.TestChatEndpoint) ... ok
test_energy_fallback_key (api.tests.test_comprehensive.TestCleanNutriments) ... ok
test_maps_openfoodfacts_keys_to_standard_keys (api.tests.test_comprehensive.TestCleanNutriments) ... ok
test_missing_keys_return_none (api.tests.test_comprehensive.TestCleanNutriments) ... ok
test_extracts_name_brand_and_code (api.tests.test_comprehensive.TestCleanProduct) ... ok
test_health_score_is_computed (api.tests.test_comprehensive.TestCleanProduct) ... ok
test_missing_product_name_defaults_to_unknown (api.tests.test_comprehensive.TestCleanProduct) ... ok
test_missing_alternative_returns_400 (api.tests.test_comprehensive.TestExplainEndpoint) ... ok
test_missing_base_returns_400 (api.tests.test_comprehensive.TestExplainEndpoint) ... ok
test_cascade_delete_removes_favourite (api.tests.test_comprehensive.TestFavoriteModel) ... ok
test_unique_together_prevents_duplicates (api.tests.test_comprehensive.TestFavoriteModel) ... ok
test_delete_nonexistent_favourite_returns_200 (api.tests.test_comprehensive.TestFavouriteEndpoint) ... ok
test_different_users_see_only_their_own_favourites (api.tests.test_comprehensive.TestFavouriteEndpoint) ... ok
test_favourites_crud_flow (api.tests.test_comprehensive.TestFavouriteEndpoint) ... ok
test_get_without_user_id_returns_400 (api.tests.test_comprehensive.TestFavouriteEndpoint) ... ok
test_post_with_nonexistent_code_returns_404 (api.tests.test_comprehensive.TestFavouriteEndpoint) ... ok
test_post_without_code_returns_400 (api.tests.test_comprehensive.TestFavouriteEndpoint) ... ok
test_calculates_positive_deltas (api.tests.test_comprehensive.TestHealthDelta) ... ok
test_missing_keys_treated_as_zero (api.tests.test_comprehensive.TestHealthDelta) ... ok
test_meal_photo_no_items_recognised (api.tests.test_comprehensive.TestMealPhotoEndpoint) ... ok
test_meal_photo_rejects_large_image (api.tests.test_comprehensive.TestMealPhotoEndpoint) ... ok
test_meal_photo_requires_image (api.tests.test_comprehensive.TestMealPhotoEndpoint) ... ok
test_duplicate_code_raises_integrity_error (api.tests.test_comprehensive.TestProductModel) ... ok
test_str_representation (api.tests.test_comprehensive.TestProductModel) ... ok
test_get_without_user_id_returns_400 (api.tests.test_comprehensive.TestProfileEndpoint) ... ok
test_profile_get_default_when_missing (api.tests.test_comprehensive.TestProfileEndpoint) ... ok
test_put_accepts_legacy_diet_field_and_converts_it (api.tests.test_comprehensive.TestProfileEndpoint) ... ok
test_put_creates_profile_with_camelcase_fields (api.tests.test_comprehensive.TestProfileEndpoint) ... ok
test_allergen_exclusion_filters_matching_products (api.tests.test_comprehensive.TestSearchEndpoint) ... ok
test_products_without_name_are_skipped (api.tests.test_comprehensive.TestSearchEndpoint) ... ok
test_search_persists_products_to_database (api.tests.test_comprehensive.TestSearchEndpoint) ... ok
test_vegan_filter_excludes_non_vegan_products (api.tests.test_comprehensive.TestSearchEndpoint) ... ok
test_vegetarian_filter_excludes_non_vegetarian_products (api.tests.test_comprehensive.TestSearchEndpoint) ... ok
test_chat_with_profile_context_sanitized (api.tests.test_comprehensive.TestSystemChatValidation) ... ok
test_explain_returns_fallback_text_without_openai (api.tests.test_comprehensive.TestSystemExplainFallback) ... ok
test_adding_same_favourite_twice_is_idempotent (api.tests.test_comprehensive.TestSystemFavouritesLifecycle) ... ok
test_full_add_list_delete_cycle (api.tests.test_comprehensive.TestSystemFavouritesLifecycle) ... ok
test_create_then_update_then_retrieve_profile (api.tests.test_comprehensive.TestSystemProfileLifecycle) ... ok
test_new_user_gets_default_profile (api.tests.test_comprehensive.TestSystemProfileLifecycle) ... ok
test_defaults_are_applied (api.tests.test_comprehensive.TestUserProfileModel) ... ok
test_str_representation (api.tests.test_comprehensive.TestUserProfileModel) ... ok

----------------------------------------------------------------------
Ran 47 tests in 0.431s

OK
Destroying test database for alias 'default' ('file:memorydb_default?mode=memory&cache=shared')...
```

---

## Results by Test Class

### Unit Tests — `TestCleanNutriments`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_U_01 | `test_maps_openfoodfacts_keys_to_standard_keys` | Pass |
| TC_B_U_02 | `test_missing_keys_return_none` | Pass |
| TC_B_U_03 | `test_energy_fallback_key` | Pass |

### Unit Tests — `TestCleanProduct`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_U_04 | `test_extracts_name_brand_and_code` | Pass |
| TC_B_U_05 | `test_missing_product_name_defaults_to_unknown` | Pass |
| TC_B_U_06 | `test_health_score_is_computed` | Pass |

### Unit Tests — `TestHealthDelta`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_U_07 | `test_calculates_positive_deltas` | Pass |
| TC_B_U_08 | `test_missing_keys_treated_as_zero` | Pass |

### Unit Tests — `TestProductModel`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_U_09 | `test_str_representation` | Pass |
| TC_B_U_10 | `test_duplicate_code_raises_integrity_error` | Pass |

### Unit Tests — `TestFavoriteModel`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_U_11 | `test_cascade_delete_removes_favourite` | Pass |
| TC_B_U_12 | `test_unique_together_prevents_duplicates` | Pass |

### Unit Tests — `TestUserProfileModel`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_U_13 | `test_defaults_are_applied` | Pass |
| TC_B_U_14 | `test_str_representation` | Pass |

---

### Integration Tests — `TestSearchEndpoint`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_I_04 | `test_vegan_filter_excludes_non_vegan_products` | Pass |
| TC_B_I_05 | `test_vegetarian_filter_excludes_non_vegetarian_products` | Pass |
| TC_B_I_06 | `test_allergen_exclusion_filters_matching_products` | Pass |
| TC_B_I_07 | `test_search_persists_products_to_database` | Pass |
| TC_B_I_08 | `test_products_without_name_are_skipped` | Pass |

### Integration Tests — `TestChatEndpoint`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_I_24 | `test_chat_empty_prompt` | Pass |
| TC_B_I_25 | `test_chat_too_long_message` | Pass |
| TC_B_I_26 | `test_chat_spam_multiple_requests` | Pass |

### Integration Tests — `TestMealPhotoEndpoint`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_I_27 | `test_meal_photo_requires_image` | Pass |
| TC_B_I_28 | `test_meal_photo_rejects_large_image` | Pass |
| TC_B_I_29 | `test_meal_photo_no_items_recognised` | Pass |

### Integration Tests — `TestBarcodeEndpoint`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_I_10 | `test_returns_serialized_product` | Pass |

### Integration Tests — `TestFavouriteEndpoint`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_I_11 | `test_get_without_user_id_returns_400` | Pass |
| TC_B_I_12 | `test_post_without_code_returns_400` | Pass |
| TC_B_I_13 | `test_post_with_nonexistent_code_returns_404` | Pass |
| TC_B_I_14 | `test_delete_nonexistent_favourite_returns_200` | Pass |
| TC_B_I_15 | `test_different_users_see_only_their_own_favourites` | Pass |
| TC_B_I_16 | `test_favourites_crud_flow` | Pass |

### Integration Tests — `TestProfileEndpoint`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_I_17 | `test_get_without_user_id_returns_400` | Pass |
| TC_B_I_18 | `test_profile_get_default_when_missing` | Pass |
| TC_B_I_19 | `test_put_creates_profile_with_camelcase_fields` | Pass |
| TC_B_I_20 | `test_put_accepts_legacy_diet_field_and_converts_it` | Pass |

### Integration Tests — `TestAuthEndpoints`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_I_21 | `test_register_without_email_returns_400` | Pass |
| TC_B_I_22 | `test_register_without_password_returns_400` | Pass |
| TC_B_I_23 | `test_login_with_wrong_password_returns_401` | Pass |

### Integration Tests — `TestExplainEndpoint`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_I_30 | `test_missing_base_returns_400` | Pass |
| TC_B_I_31 | `test_missing_alternative_returns_400` | Pass |

---

### System Tests — `TestSystemProfileLifecycle`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_S_03 | `test_new_user_gets_default_profile` | Pass |
| TC_B_S_04 | `test_create_then_update_then_retrieve_profile` | Pass |

### System Tests — `TestSystemFavouritesLifecycle`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_S_05 | `test_full_add_list_delete_cycle` | Pass |
| TC_B_S_06 | `test_adding_same_favourite_twice_is_idempotent` | Pass |

### System Tests — `TestSystemExplainFallback`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_S_07 | `test_explain_returns_fallback_text_without_openai` | Pass |

### System Tests — `TestSystemChatValidation`

| Test Case ID | Test Name | Status |
|---|---|---|
| TC_B_S_10 | `test_chat_with_profile_context_sanitized` | Pass |

---

## Summary

| Test Layer | Tests Run | Passed | Failed |
|---|---|---|---|
| Unit | 14 | 14 | 0 |
| Integration | 27 | 27 | 0 |
| System | 6 | 6 | 0 |
| **Total** | **47** | **47** | **0** |
