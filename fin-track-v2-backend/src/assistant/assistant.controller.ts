import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AppUser } from '../users/app-user.js';
import { AccessPolicy } from '../users/access.policy.js';
import { AssistantService } from './assistant.service.js';

@ApiTags('asistente')
@ApiBearerAuth()
@Controller()
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('asistente/chat')
  @HttpCode(200)
  @Can(AccessPolicy, 'readFinance')
  async chat(@CurrentUser() user: AppUser, @Body() body: { messages?: unknown }) {
    const result = await this.assistant.chat(user.id, body?.messages);

    if ('fallback' in result) {
      return { fallback: true };
    }

    return { respuesta: result.respuesta };
  }
}
