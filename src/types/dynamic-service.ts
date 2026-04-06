// src/types/dynamic-service.ts

export type ServiceType = 'booking' | 'service' | 'request' | 'repair';

export interface FormFieldSchema {
  name: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'textarea' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[]; // Jika nanti ada dropdown
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  type: ServiceType;
  handling_role_id?: string;
  handling_role?: Role;
  icon?: string;
  description?: string;
  form_schema: FormFieldSchema[];
  action_schema?: FormFieldSchema[];
  is_active: boolean;
  is_resource_based: boolean;
  target_role?: string; // Legacy support
  assignment_type: 'auto' | 'manual' | 'direct';
  default_assignee_id?: string;
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