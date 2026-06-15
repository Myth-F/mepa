import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/shared/config/env";
import type { MediaStoragePort, SignedUpload } from "./port";

const UPLOAD_TTL_SECONDS = 300;
const DOWNLOAD_TTL_SECONDS = 300;

/** S3-compatible adapter (MinIO by default). The only file that knows S3 SDK details. */
export class S3MediaStorage implements MediaStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;
    this.client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async createSignedUpload(input: {
    objectKey: string;
    mimeType: string;
    maxSizeBytes: number;
  }): Promise<SignedUpload> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.objectKey,
      ContentType: input.mimeType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: UPLOAD_TTL_SECONDS });
    return {
      url,
      objectKey: input.objectKey,
      requiredHeaders: { "Content-Type": input.mimeType },
      expiresInSeconds: UPLOAD_TTL_SECONDS,
    };
  }

  async createSignedDownload(objectKey: string, expiresInSeconds = DOWNLOAD_TTL_SECONDS): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: objectKey });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(objectKey: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: objectKey }));
  }
}

let cached: S3MediaStorage | undefined;
export function getMediaStorage(): MediaStoragePort {
  cached ??= new S3MediaStorage();
  return cached;
}
