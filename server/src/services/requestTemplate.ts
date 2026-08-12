import { Types } from 'mongoose';
import { RequestTemplate } from '../models';
import { HttpError } from '../utils/errors';

export interface RequestTemplateInput {
  title: string;
  intro: string;
  body: string;
  categoryId?: string;
  categoryName?: string;
  isActive?: boolean;
}

function toObjectId(value: string | Types.ObjectId | undefined): Types.ObjectId | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? new Types.ObjectId(value) : value;
}

function serialize(template: Record<string, any>): Record<string, any> {
  return {
    id: template._id,
    title: template.title,
    intro: template.intro,
    body: template.body,
    categoryId: template.categoryId ?? null,
    categoryName: template.categoryName ?? null,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

export async function listTemplates(params: {
  categoryId?: string;
  includeInactive?: boolean;
  admin?: boolean;
}): Promise<{ templates: Record<string, any>[] }> {
  const filter: Record<string, any> = {};
  if (!params.admin) {
    filter.isActive = true;
  } else if (!params.includeInactive) {
    filter.isActive = true;
  }
  if (params.categoryId) {
    filter.categoryId = toObjectId(params.categoryId);
  }

  const templates = await RequestTemplate.find(filter).sort({ createdAt: -1 }).lean();
  return { templates: templates.map(serialize) };
}

export async function getTemplate(id: string) {
  const template = await RequestTemplate.findById(id).lean();
  if (!template) {
    throw new HttpError(404, 'TEMPLATE_NOT_FOUND', 'Request template not found.');
  }
  return serialize(template);
}

export async function createTemplate(creatorId: string, input: RequestTemplateInput) {
  if (!input.title?.trim() || !input.intro?.trim() || !input.body?.trim()) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'title, intro and body are required.');
  }
  const template = await RequestTemplate.create({
    title: input.title.trim().slice(0, 80),
    intro: input.intro.trim().slice(0, 200),
    body: input.body.trim().slice(0, 500),
    categoryId: toObjectId(input.categoryId),
    categoryName: input.categoryName?.trim().slice(0, 80) || undefined,
    isActive: input.isActive ?? true,
    createdBy: toObjectId(creatorId),
  });
  return serialize(template.toObject());
}

export async function updateTemplate(id: string, input: RequestTemplateInput) {
  const template = await RequestTemplate.findById(id);
  if (!template) {
    throw new HttpError(404, 'TEMPLATE_NOT_FOUND', 'Request template not found.');
  }
  if (input.title !== undefined) template.title = input.title.trim().slice(0, 80);
  if (input.intro !== undefined) template.intro = input.intro.trim().slice(0, 200);
  if (input.body !== undefined) template.body = input.body.trim().slice(0, 500);
  if (input.categoryId !== undefined) {
    template.categoryId = toObjectId(input.categoryId);
  }
  if (input.categoryName !== undefined) {
    template.categoryName = input.categoryName.trim().slice(0, 80) || undefined;
  }
  if (input.isActive !== undefined) template.isActive = input.isActive;
  await template.save();
  return serialize(template.toObject());
}

export async function deleteTemplate(id: string) {
  const template = await RequestTemplate.findById(id);
  if (!template) {
    throw new HttpError(404, 'TEMPLATE_NOT_FOUND', 'Request template not found.');
  }
  await template.deleteOne();
}
