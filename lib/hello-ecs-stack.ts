import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsp from 'aws-cdk-lib/aws-ecs-patterns';

import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as fs from 'fs';

export class HelloEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Read the shadow list
    const secretKeysFromFile = fs.readFileSync(`./env.secret_keys`, 'utf8')
    // Create a list of the keys
    let listOfKeys: string[] = []
    secretKeysFromFile.split(/\r?\n/).forEach(line => {
      listOfKeys.push(line)
    });
    // Get the key-value pairs from the secrets manager and add them to an ecsSecrets class
    let ecsSecrets: { [key: string]: ecs.Secret } = {}
    listOfKeys.forEach(secret => {
      let ecsSecret: secretsmanager.ISecret = secretsmanager.Secret.fromSecretCompleteArn(
        this, 
        `my-example-secret-${secret}`,
        `arn:aws:secretsmanager:${process.env.CDK_DEFAULT_REGION}:${process.env.CDK_DEFAULT_ACCOUNT}:secret:this-is-an-example-secret-cwUGjW`)
      ecsSecrets[secret] = ecs.Secret.fromSecretsManager(ecsSecret, secret);
    })
    // The Fargate application based on the Dockerfile in the root of the repo
    // ecsSecrets are referenced here to be used in the containers environment variables.
    new ecsp.ApplicationLoadBalancedFargateService(this, 'MyWebServer', {
      enableExecuteCommand: true,
      taskImageOptions: {
        secrets: ecsSecrets,
        image: ecs.ContainerImage.fromDockerImageAsset(new ecr_assets.DockerImageAsset(this, 'MyContainerImageAsset', {
          directory: './'
        }),
      )},
      publicLoadBalancer: true
    });
}
}