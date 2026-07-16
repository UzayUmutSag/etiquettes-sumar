-- CreateTable
CREATE TABLE "EtiquetteAtelier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notionCommandeId" TEXT NOT NULL,
    "numeroCommande" TEXT NOT NULL,
    "numeroDevis" TEXT,
    "client" TEXT NOT NULL,
    "dateReception" DATETIME,
    "dateLivraison" DATETIME,
    "avancement" TEXT,
    "marque" TEXT,
    "reference" TEXT,
    "clientFinal" TEXT,
    "nbCarreaux" INTEGER,
    "dimOriginale" TEXT,
    "dimFaconnage" TEXT,
    "finition" TEXT,
    "quantite" INTEGER,
    "observation" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nbImpressions" INTEGER NOT NULL DEFAULT 0,
    "derniereImpression" DATETIME
);
