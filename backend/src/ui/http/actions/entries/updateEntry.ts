import { Context } from 'koa';
import { z } from 'zod';
import { UpdateEntryCommand } from '../../../../application/commands/entries/UpdateEntryCommand';
import { UpdateEntryCommandHandler } from '../../../../application/commands/entries/UpdateEntryCommandHandler';
import { HandlerRegistry } from '../../../../application/HandlerRegistry';

const UpdateEntryRequestSchema = z
  .object({
    title: z.string().min(1).optional(),
    mediaType: z.enum(['film', 'series']).optional(),
    platformId: z.string().uuid().optional().nullable(),
    tagIds: z.array(z.string().uuid()).min(1).max(3).optional(),
  })
  .refine(
    (data) => data.title || data.mediaType || data.platformId !== undefined || data.tagIds,
    {
      message: 'At least one field must be provided for update',
    },
  );

type UpdateEntryRequest = z.infer<typeof UpdateEntryRequestSchema>;

export async function updateEntry(ctx: Context): Promise<void> {
  const { entryId } = ctx.params;

  if (!entryId) {
    ctx.status = 400;
    ctx.body = {
      error: 'Entry ID is required',
    };
    return;
  }

  const validation = UpdateEntryRequestSchema.safeParse(ctx.request.body);

  if (!validation.success) {
    ctx.status = 400;
    ctx.body = {
      error: 'Validation failed',
      details: validation.error.errors,
    };
    return;
  }

  const data: UpdateEntryRequest = validation.data;

  try {
    const command = new UpdateEntryCommand({
      entryId,
      title: data.title,
      mediaType: data.mediaType,
      platformId: data.platformId === null ? undefined : data.platformId,
      tagIds: data.tagIds,
    });

    const handler = HandlerRegistry.getCommandHandler<UpdateEntryCommandHandler>('UpdateEntryCommand');
    await handler.handle(command);

    ctx.status = 200;
    ctx.body = {
      message: 'Entry updated successfully',
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Entry not found') {
        ctx.status = 404;
        ctx.body = {
          error: 'Entry not found',
        };
        return;
      }

      if (error.message === 'Title already exists') {
        ctx.status = 409;
        ctx.body = {
          error: 'An entry with this title already exists',
        };
        return;
      }

      if (error.message === 'One or more tags not found') {
        ctx.status = 400;
        ctx.body = {
          error: 'One or more specified tags do not exist',
        };
        return;
      }
    }

    ctx.status = 500;
    ctx.body = {
      error: 'An error occurred while updating the entry',
    };
  }
}
