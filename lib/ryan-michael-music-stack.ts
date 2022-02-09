import { Duration, Stack, StackProps } from 'aws-cdk-lib';

import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cert from 'aws-cdk-lib/aws-certificatemanager';

import { Construct } from 'constructs';
import { AllowedMethods, OriginAccessIdentity, OriginSslPolicy } from 'aws-cdk-lib/aws-cloudfront';

export class RyanMichaelMusicStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const basePath: string = this.node.tryGetContext("base_directory");
    const songFiles: [string] = this.node.tryGetContext("music_files");
    const fullSongPaths  = songFiles.map((songName) => {
      `${basePath}${songName}`
    });

    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
    });

    const oai = new OriginAccessIdentity(this, 'OAI', {
      comment: "Created by cdk"
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
      principals: [oai.grantPrincipal]
    }));

    websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject'
      ],
      resources: [websiteBucket.arnForObjects("*")],
      principals: [oai.grantPrincipal]
    }));

    websiteBucket.grantRead(oai);

    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'ryanmichaelmusic.live'
    });

    const dnsCert = new cert.Certificate(this, 'WebsiteCert', {
      domainName: 'ryanmichaelmusic.live',
      validation: cert.CertificateValidation.fromDns(hostedZone)
    });

    const cloudFrontRedirect = new cloudfront.Function(this, 'Redirect', {
      code: cloudfront.FunctionCode.fromFile({filePath: './src/cloudfront-redirect.js'})
    });

    // Add a cloudfront endpoint to cache/proxy/throttle s3 requests
    // TODO: ADD THROTTLING/RATE LIMITING WITH WAF
    const webDistribution = new cloudfront.Distribution(this, 'cdnDistribution', {
      defaultBehavior: { 
        origin: new origins.S3Origin(websiteBucket, {originAccessIdentity: oai}),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        // TODO: use lambda@edge to enable HSTS
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: new cloudfront.CachePolicy(this, 'CachePolicyWithQueryStrings', {
          queryStringBehavior: cloudfront.CacheQueryStringBehavior.all()
        }),
        functionAssociations: [{
          function: cloudFrontRedirect,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
        }]
      },
      domainNames: ['ryanmichaelmusic.live'],
      certificate: dnsCert,
      },
    );

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
      sources: [s3deploy.Source.asset('./src', {exclude: ["test_assets/*", "cloudfront-redirect.js"]})],
      destinationBucket: websiteBucket,

      // invalidate cloudfront cache
      distribution: webDistribution,
      distributionPaths: ['/*'],

      prune: false // we delete everything from the other deployments if we prune
    });

    new route53.ARecord(this, "SiteAliasRecord", {
          //recordName: siteDomain,
          target: route53.RecordTarget.fromAlias(
            new targets.CloudFrontTarget(webDistribution)
          ),
          zone: hostedZone,
        });
  }      
}
