import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

import { Construct } from 'constructs';
import { AllowedMethods, OriginSslPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess } from 'aws-cdk-lib/aws-s3';

export class RyanMichaelMusicStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const basePath: string = this.node.tryGetContext("base_directory");
    const songFiles: [string] = this.node.tryGetContext("music_files");
    const fullSongPaths  = songFiles.map((songName) => {
      `${basePath}${songName}`
    });


    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      //websiteIndexDocument: 'index.html'
    });

    // We need access to ListObjectsV2 on the assets/ endpoint to see all the song names
    // we have available
    websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:ListBucket',
        's3:PutBucketPolicy'
      ],
      resources: [
        websiteBucket.bucketArn
      ],
      principals: [new iam.AnyPrincipal()]
    }));

    websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject'
      ],
      resources: [websiteBucket.arnForObjects("*")],
      principals: [new iam.AnyPrincipal()]
    }));

    // Add a cloudfront endpoint to cache/proxy/throttle s3 requests
    // TODO: ADD THROTTLING/RATE LIMITING WITH WAF
    // TODO: ADD QUERY STRING FORWARDING 
    const webDistribution = new cloudfront.Distribution(this, 'cdnDistribution', {
      defaultBehavior: { 
        origin: new origins.S3Origin(websiteBucket),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        // TODO: use lambda@edge to enable HSTS
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
        cachePolicy: new cloudfront.CachePolicy(this, 'CachePolicyWithQueryStrings', {
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.all()
        })
       }
    });

    // webDistribution.addBehavior('/assets/*', new origins.S3Origin(websiteBucket), {
    //   allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
    //   viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
    //   cachePolicy: new cloudfront.CachePolicy(this, 'AssetsCachePolicyWithQueryStrings', {
    //     queryStringBehavior: cloudfront.CacheQueryStringBehavior.all()
    //   })
    // });

    const musicBucketDeployment = new s3deploy.BucketDeployment(this, 'DeployMusic', {
      sources: [s3deploy.Source.asset('./assets')],
      destinationBucket: websiteBucket,
      // i can't get these to work to save my life
      // exclude: ['*.wav'],
      // include: ["*.mp3"],
      memoryLimit: 512,
      destinationKeyPrefix: "assets/",

      // invalidate cloudfront cache
      distribution: webDistribution,
      distributionPaths: ['/*'],

      prune: false // we delete everything from the other deployments if we prune
    });

    const websiteBucketDeployment = new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./src', {exclude: ["test_assets/*"]})],
      destinationBucket: websiteBucket,

      // invalidate cloudfront cache
      distribution: webDistribution,
      distributionPaths: ['/*'],
      prune: false // we delete everything from the other deployments if we prune
    });
  }      
}
