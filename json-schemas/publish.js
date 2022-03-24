// A script to publish JSON schemas to https://schemas.ably.com
//
// Each schema in the src directory is expected to have an equivalent version
// in versions.json, and gets published as:
//
//     https://schemas.ably.com/json/${name}-${version}.json
//
// For example:
//
//     https://schemas.ably.com/json/app-stats-0.0.1.json
//
// This URL is also set as the $id field in the published schema.
//
// The SDK_S3_ACCESS_KEY_ID and SDK_S3_ACCESS_KEY environment variables must be
// set that have access to upload to the schemas.ably.com S3 bucket in the Ably
// SDK AWS account.

const { readdir } = require('fs/promises');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const srcDir = path.resolve(__dirname, 'src');

// eslint-disable-next-line import/no-dynamic-require
const versions = require(path.resolve(__dirname, 'versions.json'));

const baseUrl = 'https://schemas.ably.com/json';
const s3Bucket = 'schemas.ably.com';

const awsAccessKeyId = process.env.SDK_S3_ACCESS_KEY_ID;
if (typeof awsAccessKeyId !== 'string') {
  throw new Error('Missing SDK_S3_ACCESS_KEY_ID');
}

const awsSecretAccessKey = process.env.SDK_S3_ACCESS_KEY;
if (typeof awsSecretAccessKey !== 'string') {
  throw new Error('Missing SDK_S3_ACCESS_KEY');
}

const s3 = new S3Client({
  region: 'eu-west-2',
  credentials: {
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
  },
});

(async () => {
  const files = await readdir(srcDir);

  await Promise.all(files.map((file) => {
    console.log(`Checking JSON schema ${file}`);

    // check the schema has a version in versions.json
    const name = path.basename(file, '.json');
    if (!Object.prototype.hasOwnProperty.call(versions, name)) {
      throw new Error(`Missing version for JSON schema ${name}, please add ${name} to versions.json`);
    }
    const version = versions[name];

    // read the schema, and check it doesn't have an $id field
    // eslint-disable-next-line import/no-dynamic-require, global-require
    let schema = require(path.resolve(srcDir, file));
    if (Object.prototype.hasOwnProperty.call(schema, '$id')) {
      throw new Error(`Unexpected $id property in JSON schema ${name}, please remove`);
    }

    // generate the $id field and prepend it to the schema
    const id = `${baseUrl}/${name}-${version}.json`;
    schema = { $id: id, ...schema };

    // upload to the S3 bucket
    console.log(`Uploading JSON schema: ${id}...`);
    return s3.send(new PutObjectCommand({
      Bucket: s3Bucket,
      Key: `json/${path.basename(id)}`,
      Body: JSON.stringify(schema, null, 2),
      ContentType: 'application/json',
      ACL: 'public-read',
    }));
  }));

  console.log('Done!');
})();
