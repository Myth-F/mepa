/**
 * One-shot creation of the initial staff administrator (task 2.2). There is no
 * public staff registration; this is the only provisioning path for the first
 * ADMIN. Usage:
 *
 *   npm run staff:create -- --email admin@example.org --name "Admin" --password '...'
 *
 * In production, run inside the app container:
 *   docker compose exec app node node_modules/.bin/tsx scripts/create-admin.ts ...
 */
import { prisma } from "../src/shared/db/prisma";
import { hashPassword } from "../src/modules/identity/crypto";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const email = arg("email") ?? process.env.ADMIN_EMAIL;
  const name = arg("name") ?? process.env.ADMIN_NAME ?? "Administrateur";
  const password = arg("password") ?? process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("Required: --email <email> --password <password> [--name <name>]");
    process.exit(2);
  }
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(2);
  }

  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) {
    console.error(`A staff user already exists for ${email}.`);
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const staff = await prisma.staffUser.create({
    data: { email, name, passwordHash, role: "ADMIN", active: true },
  });
  console.log(`Created ADMIN staff user ${staff.email} (${staff.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
