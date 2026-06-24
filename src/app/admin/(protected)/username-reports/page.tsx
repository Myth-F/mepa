import type { Metadata } from "next";
import { Breadcrumb } from "@/shared/ui/breadcrumb";
import { requireStaffRole } from "@/shared/auth/staff-session";
import { prisma } from "@/shared/db/prisma";
import { reviewUsernameReportAction } from "./actions";

export const metadata: Metadata = { title: "Signalements de pseudonymes" };

export default async function UsernameReportsPage() {
  await requireStaffRole(["ADMIN"]);
  const reports = await prisma.usernameReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="container">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Espace équipe", href: "/admin" },
          { label: "Signalements" },
        ]}
      />
      <div className="page-heading">
        <p className="eyebrow">Modération</p>
        <h1>Signalements de pseudonymes</h1>
        <p>Une action retire immédiatement le pseudonyme concerné du classement.</p>
      </div>
      {reports.length === 0 ? (
        <div className="empty-state">
          <h2>Aucun signalement</h2>
          <p>Les nouveaux signalements apparaîtront ici.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="leaderboard-table">
            <caption>
              {reports.length} signalement{reports.length === 1 ? "" : "s"}
            </caption>
            <thead>
              <tr>
                <th scope="col">Pseudonyme</th>
                <th scope="col">Motif</th>
                <th scope="col">Statut</th>
                <th scope="col">Date</th>
                <th scope="col">Décision</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <th scope="row">{report.reportedName}</th>
                  <td>{report.reason}</td>
                  <td>{report.status}</td>
                  <td>{report.createdAt.toLocaleDateString("fr-FR")}</td>
                  <td>
                    {report.status === "PENDING" ? (
                      <form className="admin-actions" action={reviewUsernameReportAction}>
                        <input type="hidden" name="id" value={report.id} />
                        <button className="text-link" name="decision" value="DISMISSED">
                          Classer sans suite
                        </button>
                        <button className="btn btn--danger" name="decision" value="ACTIONED">
                          Retirer du classement
                        </button>
                      </form>
                    ) : (
                      "Traité"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
