import { SQSHandler } from "aws-lambda";
import {
    GetObjectCommand,
    GetObjectCommandInput,
    S3Client,
} from "@aws-sdk/client-s3";

const s3 = new S3Client();

export const handler: SQSHandler = async (event) => {
    console.log("Event ", JSON.stringify(event));

    for (const record of event.Records) {
        try {
            // Parse the SQS message body
            const recordBody = JSON.parse(record.body);

            // Parse the SNS message inside the SQS message
            const snsMessage = JSON.parse(recordBody.Message);

            if (snsMessage.Records) {
                console.log("Record body ", JSON.stringify(snsMessage));

                for (const messageRecord of snsMessage.Records) {
                    const s3e = messageRecord.s3;
                    const srcBucket = s3e.bucket.name;

                    // Object key may have spaces or unicode non-ASCII characters
                    const srcKey = decodeURIComponent(
                        s3e.object.key.replace(/\+/g, " ")
                    );

                    let origimage = null;

                    try {
                        // Download the image from the S3 source bucket
                        const params: GetObjectCommandInput = {
                            Bucket: srcBucket,
                            Key: srcKey,
                        };

                        origimage = await s3.send(new GetObjectCommand(params));

                        console.log(`Successfully retrieved object: ${srcKey} from bucket: ${srcBucket}`);
                        // Add additional image processing logic here if necessary...

                    } catch (error) {
                        console.error(`Error processing S3 object: ${srcKey} from bucket: ${srcBucket}`);
                        console.error(error);
                    }
                }
            }
        } catch (error) {
            console.error("Error parsing SQS or SNS message", error);
        }
    }
};
