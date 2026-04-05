// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";

// WAJIB: Muat file .env secara manual
dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL tidak ditemukan di .env");
  }

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Menghubungkan ke database...");

  try {
    // 1. Bersihkan data lama (Urutan penting: Transaction dulu karena ada FK ke Event)
    await prisma.transaction.deleteMany();
    await prisma.event.deleteMany();

    // 2. Isi data baru
    await prisma.event.createMany({
      data: [
        {
          title: "Nuxt 3 Masterclass",
          description:
            "Belajar Fullstack modern dengan Nuxt, Prisma, dan Supabase.",
          price: 150000,
          total_slots: 20,
          remaining_slots: 20,
        },
        {
          title: "JavaScript Logic & DSA",
          description:
            "Menguatkan fundamental logic sebelum terjun ke framework.",
          price: 75000,
          total_slots: 10,
          remaining_slots: 10,
        },
      ],
    });

    console.log("✅ Seed berhasil! Database sudah terisi.");
  } catch (err) {
    console.error("❌ Gagal saat seeding:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
