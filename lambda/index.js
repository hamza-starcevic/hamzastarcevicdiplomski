import { S3, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Sharp from 'sharp';

const s3 = new S3();

export const handler = async (event) => {
    // First check if event.body exists
    if (!event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ 
                message: 'Missing request body' 
            })
        };
    }

    let parsedBody;
    console.log('event.body', event.body);
    console.log('slijedi parsan', parsedBody)
    try {
        // Parse the body and handle potential JSON parsing errors
        parsedBody = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ 
                message: 'Invalid JSON in request body',
                error: error.message 
            })
        };
    }

    // Destructure after successful parsing
    const { height, width, image } = parsedBody;

    // Validate input
    if (!height || !width || !image) {
        return {
            statusCode: 400,
            body: JSON.stringify({ 
                message: 'Missing required parameters. Please provide height, width, and image.',
                received: { 
                    hasHeight: !!height, 
                    hasWidth: !!width, 
                    hasImage: !!image 
                }
            })
        };
    }

    const targetBucket = process.env.TARGET_BUCKET_NAME;
    if (!targetBucket) {
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'TARGET_BUCKET_NAME environment variable is not set' 
            })
        };
    }

    try {
        // Decode base64 image
        const base64Data = image.split(',')[1] || image; // Handle both with and without data URI
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Resize the image
        const resizedImage = await Sharp(imageBuffer)
            .resize(parseInt(width), parseInt(height))
            .toBuffer();

        // Generate a unique key for the resized image
        const resizedKey = `resized-${width}x${height}-${Date.now()}.jpg`;

        // Upload the resized image to the target bucket
        await s3.putObject({
            Bucket: targetBucket,
            Key: resizedKey,
            Body: resizedImage,
            ContentType: 'image/jpeg',
            ACL: 'public-read'
        });

        // Generate a pre-signed URL for the resized image
        const presignedUrl = await getSignedUrl(s3, new GetObjectCommand({
            Bucket: targetBucket,
            Key: resizedKey
        }), { expiresIn: 3600 });

        console.log(`Successfully resized image to ${width}x${height} and uploaded to ${targetBucket}/${resizedKey}`);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Add CORS if needed
            },
            body: JSON.stringify({
                message: 'Image resized successfully',
                downloadUrl: presignedUrl
            })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                message: 'Error processing image',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};