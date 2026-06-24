export function ModuleProgressBar({ activeStep, total }: { activeStep: number; total: number }) {
  const safeStep = total === 0 ? 0 : Math.min(activeStep + 1, total);
  const percentage = total > 0 ? Math.round((safeStep / total) * 100) : 0;
  return (
    <div className="module-progress-bar">
      <p className="reader-progress__label">
        Étape visible <strong>{safeStep}</strong> sur {total}
      </p>
      <div
        className="reader-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-valuetext={`Étape ${safeStep} sur ${total}`}
        aria-label="Avancement dans le module"
      >
        <span className="reader-progress__fill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
