// src/types/dynamic-service.ts

export type ServiceType = 'booking' | 'service' | 'request';

export interface FormFieldSchema {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: string[]; // Jika nanti ada dropdown
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  type: ServiceType;
  icon?: string;
  description?: string;
  form_schema: FormFieldSchema[]; // Ini JSON schema dari DB
  is_active: boolean;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  meta_data?: Record<string, any>;
  is_active: boolean;
}

export interface DynamicTicketPayload {
  service_category_id: string;
  resource_id?: string;
  title: string;
  description: string;
  start_date?: string; // Format ISO string
  end_date?: string;   // Format ISO string
  dynamic_form_data: Record<string, any>; // Jawaban user
}