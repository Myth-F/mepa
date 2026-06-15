import { env } from "@/shared/config/env";

/**
 * The tutor is disabled by default. It is only considered active when BOTH the
 * feature flag is on AND a provider adapter has been configured. The default
 * build ships no provider, so this is always false out of the box.
 */
export function isTutorEnabled(hasConfiguredProvider: boolean): boolean {
  return env.TUTOR_ENABLED && hasConfiguredProvider;
}

/** The default deployment configures no provider adapter. */
export function getConfiguredTutorProvider(): null {
  return null;
}
