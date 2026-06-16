/**
 * Create or reset a staff account. Useful for provisioning an editor on a
 * deployed environment without editing the database by hand.
 *
 * Usage:
 *   npm run staff:upsert -- --email editor@example.org --name "Éditeur" \
 *     --password 'change-me-please' --role EDITOR
 */
import { prisma } from "../src/shared/db/prisma";
import { hashPassword } from "../src/modules/identity/crypto";
import type { StaffRole } from "../src/generated/prisma";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function parseRole(value: string | undefined): StaffRole {
  if (value === "ADMIN" || value === "EDITOR") return value;
  throw new Error("Role must be ADMIN or EDITOR.");
}

async function main() {
  const email = (arg("email") ?? process.env.STAFF_EMAIL)?.trim().toLowerCase();
  const name = arg("name") ?? process.env.STAFF_NAME ?? "Éditeur";
  const password = arg("password") ?? process.env.STAFF_PASSWORD;
  const role = parseRole(arg("role") ?? process.env.STAFF_ROLE ?? "EDITOR");

  if (!email || !password) {
    console.error(
      "Required: --email <email> --password <password> [--name <name>] [--role ADMIN|EDITOR]",
    );
    process.exit(2);
  }
  if (!email.includes("@")) {
    console.error("Email must be valid.");
    process.exit(2);
  }
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(2);
  }

  const passwordHash = await hashPassword(password);
  const staff = await prisma.staffUser.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role,
      active: true,
    },
    create: {
      email,
      name,
      passwordHash,
      role,
      active: true,
    },
  });

  console.log(`Upserted ${staff.role} staff user ${staff.email} (${staff.id}).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
