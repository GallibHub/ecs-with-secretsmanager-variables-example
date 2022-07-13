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

    const secretKeysFromFile = fs.readFileSync(`./env.secret_keys`, 'utf8')

    let listOfSecrets: string[] = []
    secretKeysFromFile.split(/\r?\n/).forEach(line => {
      listOfSecrets.push(line)
    });
    let ecsSecrets: { [key: string]: ecs.Secret } = {}
    listOfSecrets.forEach(secret => {
      let ecsSecret: secretsmanager.ISecret = secretsmanager.Secret.fromSecretNameV2(
        this, 
        `my-example-secret`,
        'this-is-an-example-secret')
      ecsSecrets[secret] = ecs.Secret.fromSecretsManager(ecsSecret, secret);
    })

    new ecsp.ApplicationLoadBalancedFargateService(this, 'MyWebServer', {
      taskImageOptions: {
        secrets: ecsSecrets,
        // image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
        image: ecs.ContainerImage.fromDockerImageAsset(new ecr_assets.DockerImageAsset(this, 'MyContainerImageAsset', {
          directory: './'
        }),
      )},
      publicLoadBalancer: true
    });
  }
}