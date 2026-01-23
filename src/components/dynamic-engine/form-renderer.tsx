// src/components/dynamic-engine/form-renderer.tsx

import React from 'react';
import { type UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Tipe data schema yang sama dengan yang disimpan di database
export interface FormFieldSchema {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
}

interface DynamicFormRendererProps {
  schema: FormFieldSchema[]; 
  form: UseFormReturn<any>; // Instance dari React Hook Form parent
  prefix?: string;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ schema, form, prefix = 'ticket_data' }) => {
  
  // Jika tidak ada schema, jangan render apa-apa
  if (!schema || schema.length === 0) return null;

  return (
    <div className="grid gap-6 border p-5 rounded-lg bg-slate-50/50 border-slate-200">
      {schema.map((field, index) => (
        <FormField
          key={field.name + index}
          control={form.control}
          // PENTING: Kita simpan data di dalam object 'ticket_data'
          // Contoh hasil: { title: "...", ticket_data: { alasan: "...", jumlah: 5 } }
          name={`${prefix}.${field.name}`}
          rules={{ 
            required: field.type !== 'boolean' && field.required ? `${field.label} wajib diisi` : false 
          }}
          render={({ field: formField }) => (
            <FormItem className="flex flex-col">
              <div className="flex items-center justify-between">
                <FormLabel className="font-semibold text-slate-700">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
              </div>
              
              <FormControl>
                {/* LOGIC RENDER BERDASARKAN TIPE INPUT */}
                {(() => {
                  switch (field.type) {
                    case 'textarea':
                      return (
                        <Textarea 
                          placeholder={field.placeholder || "Isi detail..."} 
                          className="bg-white min-h-[100px]" 
                          {...formField} 
                        />
                      );
                    
                    case 'number':
                      return (
                        <Input 
                          type="number" 
                          placeholder="0" 
                          className="bg-white" 
                          {...formField} 
                          // Konversi string ke number saat input berubah
                          onChange={e => formField.onChange(e.target.valueAsNumber)} 
                        />
                      );
                    
                    case 'select':
                      return (
                        <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Pilih salah satu" />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Render opsi dropdown */}
                            {field.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );

                    case 'date':
                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-white", 
                                !formField.value && "text-muted-foreground"
                              )}
                            >
                              {formField.value ? format(new Date(formField.value), "PPP") : <span>Pilih tanggal</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formField.value ? new Date(formField.value) : undefined}
                              onSelect={formField.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      );

                    case 'boolean':
                      return (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded-md border">
                          <Switch 
                            checked={!!formField.value} 
                            onCheckedChange={formField.onChange} 
                          />
                          <span className="text-sm font-medium text-slate-700">
                            {formField.value ? "Ya / Setuju" : "Tidak"}
                          </span>
                        </div>
                      );

                    case 'text':
                    default:
                      return (
                        <Input 
                          placeholder={field.placeholder || field.label} 
                          className="bg-white" 
                          {...formField} 
                        />
                      );
                  }
                })()}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
};