export type CatalogStatus = 'ACTIVE' | 'DISABLED' | 'DRAFT';

export type FieldValues = Record<string, string | number | boolean>;

export type Catalog = {
  id: string;
  name: string;
  description: string;
  status: CatalogStatus;
  templateId: string;
  fieldValues: FieldValues;
  calculatedPrice: string | number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
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
  templateId: string;
  fieldValues: FieldValues;
};

export type UpdateCatalogInput = {
  name?: string;
  description?: string;
  status?: CatalogStatus;
  fieldValues?: FieldValues;
};

export type CatalogPreview = {
  calculatedPrice: number | null;
  fieldValues: FieldValues;
};
