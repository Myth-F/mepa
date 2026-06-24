import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { prisma } from "@/shared/db/prisma";
import { labelForLevel } from "@/modules/gamification/rules";
import { Prisma } from "@/generated/prisma";
import { getCurrentLearner } from "@/shared/auth/learner-session";
import { reportUsernameAction } from "./actions";

export const metadata: Metadata = { title: "Classement facultatif" };
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
const PAGE_SIZE = 20;
interface LeaderboardRow {
  learnerId: string;
  displayName: string;
  level: number;
  totalPoints: number;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; report?: string }>;
}) {
  await connection();
  const [{ page: rawPage, report }, currentLearner] = await Promise.all([
    searchParams,
    getCurrentLearner(),
  ]);
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const [counts, scores] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      FROM "learner_score" score
      JOIN "learner" learner ON learner.id = score."learnerId"
      WHERE score."leaderboardOptIn" = true AND learner."deletedAt" IS NULL
    `),
    prisma.$queryRaw<LeaderboardRow[]>(Prisma.sql`
      SELECT score."learnerId", learner."displayName", score.level, score."totalPoints"
      FROM "learner_score" score
      JOIN "learner" learner ON learner.id = score."learnerId"
      WHERE score."leaderboardOptIn" = true AND learner."deletedAt" IS NULL
      ORDER BY score."totalPoints" DESC, score."firstReachedAt" ASC, score."learnerId" ASC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
  ]);
  const total = Number(counts[0]?.count ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="container">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Classement" }]} />
      <div className="page-heading">
        <p className="eyebrow">Participation facultative</p>
        <h1>Classement des personnes apprenantes</h1>
        <p>
          Seules les personnes ayant choisi de participer apparaissent ici. Aucun e-mail n’est
          affiché.
        </p>
        <p>
          <Link href="/account/settings">Gérer mon pseudonyme et ma participation</Link>
        </p>
      </div>
      {report === "sent" && (
        <div className="alert alert--success" role="status">
          Merci. Le signalement a été transmis à l’équipe.
        </div>
      )}
      {report === "invalid" && (
        <div className="alert alert--error" role="alert">
          Ce signalement n’a pas pu être enregistré.
        </div>
      )}
      {scores.length === 0 ? (
        <div className="empty-state">
          <h2>Le classement est encore vide</h2>
          <p>Les personnes apprenantes choisissent elles-mêmes si elles souhaitent apparaître.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="leaderboard-table">
            <caption>
              Classement global, page {page} sur {pages}
            </caption>
            <thead>
              <tr>
                <th scope="col">Rang</th>
                <th scope="col">Pseudonyme</th>
                <th scope="col">Niveau</th>
                <th scope="col">Points</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, index) => (
                <tr key={score.learnerId}>
                  <td>Rang {(page - 1) * PAGE_SIZE + index + 1}</td>
                  <th scope="row">{score.displayName}</th>
                  <td>
                    Niveau {score.level} · {labelForLevel(score.level)}
                  </td>
                  <td>{score.totalPoints}</td>
                  <td>
                    {currentLearner?.id !== score.learnerId && (
                      <details className="report-username">
                        <summary>Signaler ce pseudonyme</summary>
                        <form action={reportUsernameAction}>
                          <input type="hidden" name="learnerId" value={score.learnerId} />
                          <label htmlFor={`reason-${score.learnerId}`}>Motif</label>
                          <select
                            id={`reason-${score.learnerId}`}
                            name="reason"
                            required
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Choisir
                            </option>
                            <option value="injurieux">Injurieux</option>
                            <option value="discriminatoire">Discriminatoire</option>
                            <option value="usurpation">Usurpation</option>
                            <option value="autre">Autre</option>
                          </select>
                          <button className="text-link" type="submit">
                            Envoyer
                          </button>
                        </form>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <nav className="pagination" aria-label="Pages du classement">
        {page > 1 && <Link href={`/leaderboard?page=${page - 1}`}>Page précédente</Link>}
        <span>
          Page {page} sur {pages}
        </span>
        {page < pages && <Link href={`/leaderboard?page=${page + 1}`}>Page suivante</Link>}
      </nav>
    </div>
  );
}
