const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const campaigns = await prisma.$queryRaw(
            Prisma.sql`
        SELECT
          "id",
          "slug",
          "title",
          "objective",
          "sponsorName",
          "sponsorNamespace",
          "tier",
          "ownerType",
          "contractType",
          "prizePoolUsdc"::text AS "prizePoolUsdc",
          "keyTakeaways",
          "coverImageUrl",
          "modules",
          "status",
          "isPublished",
          "startAt",
          "endAt",
          "escrowAddress",
          "escrowId",
          "onChainCampaignId",
          "requestId",
          "createdAt",
          "updatedAt"
        FROM "Campaign"
        ORDER BY "createdAt" DESC
      `,
        );
        console.log("Success! Returned rows: " + campaigns.length);
    } catch (error) {
        console.error("Failed to fetch:", error);
    }
}

main().finally(() => prisma.$disconnect());
