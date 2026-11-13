import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module.js';
import { AssistantController } from './assistant.controller.js';
import { AssistantService } from './assistant.service.js';

@Module({
  imports: [FinanceModule],
  controllers: [AssistantController],
  providers: [AssistantService],
})
export class AssistantModule {}