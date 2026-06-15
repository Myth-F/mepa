// Provider-neutral storage contract. Authoring and learner rendering depend only
// on this port; swapping MinIO for any other S3-compatible service is a matter of
// environment configuration and a different adapter, with no domain-model change.

export interface SignedUpload {
  /** Short-lived URL the browser PUTs the file to. */
  url: string;
  /** Server-generated object key the client must not alter. */
  objectKey: string;
  /** Headers the client must echo on the PUT request. */
  requiredHeaders: Record<string, string>;
  expiresInSeconds: number;
}

export interface MediaStoragePort {
  /** Create a short-lived signed PUT request for a server-generated key. */
  createSignedUpload(input: {
    objectKey: string;
    mimeType: string;
    maxSizeBytes: number;
  }): Promise<SignedUpload>;

  /** Create a short-lived signed GET URL for an existing object. */
  createSignedDownload(objectKey: string, expiresInSeconds?: number): Promise<string>;

  deleteObject(objectKey: string): Promise<void>;
}
