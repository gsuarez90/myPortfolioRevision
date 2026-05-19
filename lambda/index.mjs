import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { randomUUID } from "crypto";

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3     = new S3Client({});
const ses    = new SESClient({});

const TABLE_NAME  = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;
const RESUME_KEY  = process.env.RESUME_KEY  ?? "private/resume.pdf";
const SENDER      = process.env.SENDER_EMAIL;
const SITE_BASE   = process.env.SITE_BASE;
const TTL_SECONDS = 86400; // 24 hours

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

// POST /api/request-resume
async function handleRequest(event) {
  let email;
  try {
    ({ email } = JSON.parse(event.body ?? "{}"));
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { error: "Invalid email address" });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const token     = randomUUID();

  // Write email dedup item + token item atomically.
  // ConditionExpression on the email item rejects if a request was already made
  // within the 24h TTL window.
  try {
    await dynamo.send(new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: TABLE_NAME,
            Item: { PK: `email#${email}`, SK: "REQUEST", expires_at: expiresAt },
            ConditionExpression: "attribute_not_exists(PK)"
          }
        },
        {
          Put: {
            TableName: TABLE_NAME,
            Item: { PK: `token#${token}`, SK: "LOOKUP", email, expires_at: expiresAt }
          }
        }
      ]
    }));
  } catch (err) {
    if (err.name === "TransactionCanceledException") {
      return json(429, { error: "A link was already sent to this address. Please check your inbox." });
    }
    throw err;
  }

  const link = `${SITE_BASE}/api/get-resume?token=${token}`;

  await ses.send(new SendEmailCommand({
    Source:      SENDER,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: "Your resume download link" },
      Body: {
        Text: {
          Data: [
            `Here is your resume download link (single-use, expires 15 minutes after clicking):`,
            ``,
            link,
            ``,
            `If the link has already been used or expired, you can request a new one at ${SITE_BASE}.`,
            ``,
            `— George J. Suarez`
          ].join("\n")
        }
      }
    }
  }));

  return json(200, { message: "Check your inbox for the download link." });
}

// GET /api/get-resume?token=<uuid>
async function handleDownload(event) {
  const token = event.queryStringParameters?.token;

  if (!token) {
    return json(400, { error: "Missing token" });
  }

  // Delete the token atomically — if it doesn't exist the condition fails,
  // meaning the link was already used or never existed.
  try {
    await dynamo.send(new DeleteCommand({
      TableName:           TABLE_NAME,
      Key:                 { PK: `token#${token}`, SK: "LOOKUP" },
      ConditionExpression: "attribute_exists(PK)"
    }));
  } catch (err) {
    if (err.name === "ConditionalCheckFailedException") {
      return json(404, { error: "Link not found or already used." });
    }
    throw err;
  }

  const presignedUrl = await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket:                     BUCKET_NAME,
      Key:                        RESUME_KEY,
      ResponseContentDisposition: 'attachment; filename="George_Suarez_Resume.pdf"'
    }),
    { expiresIn: 900 } // 15 minutes
  );

  return {
    statusCode: 302,
    headers:    { Location: presignedUrl },
    body:       ""
  };
}

export const handler = async (event) => {
  // Support both HTTP API (v2) and REST API (v1) event shapes
  const method = event.requestContext?.http?.method ?? event.httpMethod;
  const path   = event.requestContext?.http?.path   ?? event.path ?? "";

  try {
    if (method === "POST" && path.includes("request-resume")) return await handleRequest(event);
    if (method === "GET"  && path.includes("get-resume"))     return await handleDownload(event);
    return json(404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    return json(500, { error: "Internal server error" });
  }
};
