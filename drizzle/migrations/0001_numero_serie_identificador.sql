ALTER TABLE "contentores"
ADD CONSTRAINT "contentores_numero_serie_unique" UNIQUE("numero_serie");

ALTER TABLE "contentores"
DROP CONSTRAINT "contentores_codigo_unique";

ALTER TABLE "contentores"
DROP COLUMN "codigo";
