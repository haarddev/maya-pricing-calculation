export type CatalogStatus = 'ACTIVE' | 'DISABLED' | 'DRAFT';

export type FieldValues = Record<string, string | number | boolean>;

export type Catalog = {
  id: string;
  name: string;
  description: string;
  status: CatalogStatus;
  customerId: string | null;
  templateId: string;
  fieldValues: FieldValues;
  calculatedPrice: string | number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    status: string;
  } | null;
  template?: {
    id: string;
    name: string;
    pricingMethod: string;
    status: string;
    fields?: import('./template.types').TemplateField[];
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export type CreateCatalogInput = {
  name: string;
  description?: string;
  status?: CatalogStatus;
  customerId: string;
  templateId: string;
  fieldValues: FieldValues;
};

export type UpdateCatalogInput = {
  name?: string;
  description?: string;
  status?: CatalogStatus;
  customerId?: string;
  fieldValues?: FieldValues;
};

export type CatalogPreview = {
  calculatedPrice: number | null;
  fieldValues: FieldValues;
};
