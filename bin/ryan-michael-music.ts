#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { RyanMichaelMusicStack } from '../lib/ryan-michael-music-stack';

const app = new cdk.App();
new RyanMichaelMusicStack(app, 'RyanMichaelMusicStack');
