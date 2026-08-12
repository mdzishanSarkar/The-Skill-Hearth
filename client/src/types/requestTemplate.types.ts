export interface RequestTemplate {
  id: string;
  title: string;
  intro: string;
  body: string;
  categoryId: string | null;
  categoryName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RequestTemplateListResult {
  templates: RequestTemplate[];
}

export interface RequestTemplateInput {
  title: string;
  intro: string;
  body: string;
  categoryId?: string;
  categoryName?: string;
  isActive?: boolean;
}
