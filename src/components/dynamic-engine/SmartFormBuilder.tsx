// src/components/dynamic-engine/SmartFormBuilder.tsx

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormFieldSchema } from '@/types/dynamic-service';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface SmartFormBuilderProps {
  form: UseFormReturn<any>;
  schema: FormFieldSchema[];
  prefix?: string;
}

export const SmartFormBuilder: React.FC<SmartFormBuilderProps> = ({ 
  form, 
  schema, 
  prefix = "dynamic_form_data" 
}) => {
  
  if (!schema || schema.length === 0) return null;

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
      <h3 className="font-semibold text-sm text-muted-foreground mb-2 uppercase tracking-wider">
        Detail Informasi Layanan
      </h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        {schema.map((field, index) => {
          const fieldName = `${prefix}.${field.name}`;

          return (
            <FormField
              key={index}
              control={form.control}
              name={fieldName}
              rules={{ required: field.required ? `${field.label} wajib diisi` : false }}
              render={({ field: formField }) => {
                
                // --- CASE 1: INPUT TEXT & NUMBER ---
                if (field.type === 'text' || field.type === 'number') {
                  return (
                    <FormItem>
                      <FormLabel>
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          {...formField} 
                          type={field.type} 
                          placeholder={field.placeholder}
                          onChange={(e) => {
                            const val = field.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value;
                            formField.onChange(val);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }

                // --- CASE 2: TEXTAREA ---
                if (field.type === 'textarea') {
                  return (
                    <FormItem className="md:col-span-2">
                      <FormLabel>
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          {...formField} 
                          placeholder={field.placeholder} 
                          className="resize-none h-24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }

                // --- CASE 3: BOOLEAN / CHECKBOX ---
                if (field.type === 'boolean') {
                  return (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white dark:bg-slate-950">
                      <FormControl>
                        <Checkbox 
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-normal">
                          {field.label}
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }

                return null;
              }}
            />
          );
        })}
      </div>
    </div>
  );
};