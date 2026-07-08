export type TemplateStatus = 'ACTIVE' | 'DISABLED' | 'DRAFT' | 'EXPIRED';

export type PricingMethod =
  | 'PRICE_BY_DESTINATION'
  | 'PRICE_BY_HOURS'
  | 'PRICE_BY_ROUTE'
  | 'PRICE_BY_DISTANCE'
  | 'PRICE_BY_AREA'
  | 'PRICE_BY_PASSENGERS'
  | 'PRICE_BY_SKU'
  | 'PRICE_BY_MINUTES'
  | 'PRICE_BY_KM_AND_HOURS';

export type FieldType = 'TEXT' | 'NUMBER' | 'DROPDOWN' | 'BOOLEAN' | 'DATE' | 'TIME';

export type User = {
  id: string;
  email: string;
  name: string;
  role?: 'ADMIN' | 'USER';
  status?: 'ACTIVE' | 'DISABLED';
};

export type TemplateField = {
  id: string;
  templateId: string;
  fieldKey: string;
  labelEn: string;
  labelHe: string;
  fieldType: FieldType;
  options: string[] | null;
  required: boolean;
  sortOrder: number;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  supplementsAdditions: string;
  status: TemplateStatus;
  pricingMethod: PricingMethod;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  fieldCount?: number;
  fields?: TemplateField[];
  createdBy?: User;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type CreateTemplateInput = {
  name: string;
  description?: string;
  supplementsAdditions?: string;
  status?: TemplateStatus;
  pricingMethod: PricingMethod;
};

export type UpdateTemplateInput = {
  name?: string;
  description?: string;
  supplementsAdditions?: string;
  status?: TemplateStatus;
};

export type CreateFieldInput = {
  fieldKey: string;
  labelEn: string;
  labelHe: string;
  fieldType: FieldType;
  options?: string[];
  required?: boolean;
  sortOrder?: number;
};
