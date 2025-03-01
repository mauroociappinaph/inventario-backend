 import { Module } from '@nestjs/common';
import { SeedCommand } from './seed.command';

@Module({
  providers: [SeedCommand],
})
export class CommandsModule {}
