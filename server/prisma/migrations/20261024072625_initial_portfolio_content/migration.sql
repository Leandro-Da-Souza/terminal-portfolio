-- CreateTable
CREATE TABLE "ContentSection" (
    "key" VARCHAR(32) NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentSection_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "FeaturedProject" (
    "id" TEXT NOT NULL,
    "owner" VARCHAR(39) NOT NULL,
    "repo" VARCHAR(100) NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSON NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "admin_session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedProject_position_key" ON "FeaturedProject"("position");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturedProject_owner_repo_key" ON "FeaturedProject"("owner", "repo");

-- CreateIndex
CREATE INDEX "admin_session_expire_idx" ON "admin_session"("expire");

-- Application rules are also enforced in PostgreSQL, including writes outside AdminJS.
ALTER TABLE "ContentSection"
  ADD CONSTRAINT "ContentSection_known_key" CHECK ("key" IN ('about', 'skills', 'experience', 'contact', 'interests')),
  ADD CONSTRAINT "ContentSection_body_length" CHECK (char_length(btrim("body")) > 0 AND char_length("body") <= 20000);

ALTER TABLE "FeaturedProject"
  ADD CONSTRAINT "FeaturedProject_positive_position" CHECK ("position" > 0),
  ADD CONSTRAINT "FeaturedProject_owner_format" CHECK ("owner" = lower("owner") AND "owner" ~ '^[a-z0-9]([a-z0-9-]{0,37}[a-z0-9])?$' AND "owner" NOT LIKE '%--%'),
  ADD CONSTRAINT "FeaturedProject_repo_format" CHECK ("repo" = lower("repo") AND "repo" ~ '^[a-z0-9_.-]{1,100}$' AND "repo" !~ '^\.+$'),
  ADD CONSTRAINT "FeaturedProject_display_name" CHECK (char_length(btrim("displayName")) > 0 AND "displayName" !~ '[[:cntrl:]]');
