-- Одоо байгаа DB-д: лого data URL хадгалах (шинэ суулгалт schema.sql-той ижил).
ALTER TABLE `provider_onboarding_submissions`
  MODIFY `logo_url` MEDIUMTEXT NULL DEFAULT NULL COMMENT 'HTTPS URL эсвэл data:image/...;base64,...';
