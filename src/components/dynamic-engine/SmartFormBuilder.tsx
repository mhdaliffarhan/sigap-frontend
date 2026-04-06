// src/components/dynamic-engine/SmartFormBuilder.tsx

import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { FormFieldSchema } from '@/types/dynamic-service';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Info } from 'lucide-react';

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
    <div className="space-y-6 p-8 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <Info className="h-4 w-4 text-blue-600" />
        </div>
        <h3 className="font-bold text-slate-800 tracking-tight">
          Informasi Tambahan Layanan
        </h3>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
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
                          value={formField.value || ''}
                          type={field.type} 
                          placeholder={field.placeholder}
                          className="bg-slate-50 border-slate-200 focus:ring-blue-500 h-11"
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
                          value={formField.value || ''}
                          placeholder={field.placeholder} 
                          className="resize-none h-32 bg-slate-50 border-slate-200 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }

                // --- CASE 3: BOOLEAN / CHECKBOX ---
                if (field.type === 'boolean') {
                  return (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-100 p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <FormControl>
                        <Checkbox 
                          checked={formField.value}
                          onCheckedChange={formField.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer font-medium text-slate-700">
                          {field.label}
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }

                // --- CASE 4: DATE ---
                if (field.type === 'date') {
                  return (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            {...formField} 
                            type="date" 
                            className="bg-slate-50 border-slate-200 focus:ring-blue-500 pl-10 h-11"
                          />
                          <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }

                // --- CASE 5: SELECT / DROPDOWN ---
                if (field.type === 'select') {
                  const options = Array.isArray(field.options) ? field.options : [];
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </FormLabel>
                      <Select 
                        onValueChange={formField.onChange} 
                        defaultValue={formField.value}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-blue-500 h-11">
                            <SelectValue placeholder={field.placeholder || "Pilih opsi..."} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {options.map((opt, i) => (
                            <SelectItem key={i} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }

                return <></>;
              }}
            />
          );
        })}
      </div>
    </div>
  );
};