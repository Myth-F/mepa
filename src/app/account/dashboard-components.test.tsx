import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ModuleProgressList } from "./module-progress-list";
import { ProgressSummary } from "./progress-summary";

describe("dashboard components", () => {
  it("shows module statuses and scores", () => {
    const html = renderToStaticMarkup(
      <ModuleProgressList
        modules={[
          { id: "1", slug: "module", title: "Comprendre", status: "completed", quizScore: 80 },
        ]}
      />,
    );
    expect(html).toContain("Terminé");
    expect(html).toContain("Meilleur score : 80 %");
  });

  it("shows an educational empty state", () => {
    const html = renderToStaticMarkup(
      <ModuleProgressList
        modules={[
          { id: "1", slug: "module", title: "Comprendre", status: "not_started", quizScore: null },
        ]}
      />,
    );
    expect(html).toContain("Votre parcours commence ici");
    expect(html).toContain("Découvrir les modules");
  });

  it("shows rank only after leaderboard opt-in", () => {
    const base = {
      points: 20,
      level: 1,
      levelLabel: "Curieux",
      rank: null,
      modulesStarted: 0,
      modulesCompleted: 0,
      modules: [],
    };
    expect(
      renderToStaticMarkup(<ProgressSummary progress={{ ...base, leaderboardOptIn: false }} />),
    ).not.toContain("Rang au classement");
    expect(
      renderToStaticMarkup(
        <ProgressSummary progress={{ ...base, leaderboardOptIn: true, rank: 5 }} />,
      ),
    ).toContain("#5");
  });
});
