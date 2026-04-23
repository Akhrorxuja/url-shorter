CREATE TABLE "urls" (
    "id"          TEXT NOT NULL,
    "shortCode"   TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "title"       TEXT,
    "clicks"      INTEGER NOT NULL DEFAULT 0,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "expiresAt"   TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "urls_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "urls_shortCode_key" ON "urls"("shortCode");

CREATE TABLE "click_events" (
    "id"        TEXT NOT NULL,
    "urlId"     TEXT NOT NULL,
    "ip"        TEXT,
    "country"   TEXT,
    "city"      TEXT,
    "device"    TEXT,
    "browser"   TEXT,
    "os"        TEXT,
    "referer"   TEXT,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "click_events" ADD CONSTRAINT "click_events_urlId_fkey"
  FOREIGN KEY ("urlId") REFERENCES "urls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
