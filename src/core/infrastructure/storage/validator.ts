import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { env } from '../../config/env.config';

export async function testS3Connection(): Promise<void> {
  const client = new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    ...(env.AWS_ENDPOINT && { endpoint: env.AWS_ENDPOINT }),
    forcePathStyle: true, // Necesario para S3 compatible como MinIO/RustFS
  });

  try {
    console.log('🔄 Testing S3 connection...');

    // Check if bucket exists
    try {
      await client.send(
        new HeadBucketCommand({
          Bucket: env.AWS_S3_BUCKET,
        }),
      );
    } catch (error: any) {
      // Bucket doesn't exist, try to create it
      if (
        error.name === 'NotFound' ||
        error.$metadata?.httpStatusCode === 404
      ) {
        console.log(`📦 Creating bucket '${env.AWS_S3_BUCKET}'...`);
        await client.send(
          new CreateBucketCommand({
            Bucket: env.AWS_S3_BUCKET,
          }),
        );
        console.log(`✅ Bucket '${env.AWS_S3_BUCKET}' created`);
      } else {
        throw error;
      }
    }

    // Try to write a test file
    const testKey = `.health-check/${Date.now()}`;
    await client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: testKey,
        Body: 'health-check',
      }),
    );

    console.log(`✅ S3 bucket '${env.AWS_S3_BUCKET}' is accessible`);
  } catch (error) {
    console.error('❌ S3 connection failed:', (error as Error).message);
    console.log('   ❌ Cannot continue without S3 - storage is required');
    throw error;
  }
}
