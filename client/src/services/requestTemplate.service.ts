import api from './api';
import type {
  RequestTemplate,
  RequestTemplateListResult,
  RequestTemplateInput,
} from '../types/requestTemplate.types';

export async function listRequestTemplates(
  params: { categoryId?: string; includeInactive?: boolean } = {}
): Promise<RequestTemplateListResult> {
  const { data } = await api.get('/request-templates', { params });
  return data.data;
}

export async function getRequestTemplate(id: string): Promise<RequestTemplate> {
  const { data } = await api.get(`/request-templates/${id}`);
  return data.data.template;
}

export async function createRequestTemplate(input: RequestTemplateInput): Promise<RequestTemplate> {
  const { data } = await api.post('/request-templates', input);
  return data.data.template;
}

export async function updateRequestTemplate(id: string, input: RequestTemplateInput): Promise<RequestTemplate> {
  const { data } = await api.put(`/request-templates/${id}`, input);
  return data.data.template;
}

export async function deleteRequestTemplate(id: string): Promise<void> {
  await api.delete(`/request-templates/${id}`);
}
