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
import { CalendarIcon, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

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
  const [isCheckingAsset, setIsCheckingAsset] = React.useState(false);
  const [assetInfo, setAssetInfo] = React.useState<any>(null);
  const [assetChecked, setAssetChecked] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Jika tidak ada schema, jangan render apa-apa
  if (!schema || schema.length === 0) return null;

  // Cek apakah ada field BMN (kode_barang & nup)
  const hasBmnFields = schema.some(f => f.name === 'kode_barang') && schema.some(f => f.name === 'nup');

  const handleAssetCheck = async () => {
    const kodeBarang = form.getValues(`${prefix}.kode_barang`);
    const nup = form.getValues(`${prefix}.nup`);

    if (!kodeBarang || !nup) return;

    setIsCheckingAsset(true);
    setErrorMsg(null);
    setAssetChecked(false);
    
    try {
      const res: any = await api.get(`assets/search/by-code-nup?asset_code=${kodeBarang}&asset_nup=${nup}`);
      if (res && res.asset) {
        setAssetInfo(res.asset);
        setAssetChecked(true);
        // Auto-fill lokasi jika field asset_location ada di form
        if (res.asset.location && schema.some(f => f.name === 'asset_location')) {
           form.setValue(`${prefix}.asset_location`, res.asset.location);
        }
      } else {
        setErrorMsg("Barang tidak ditemukan.");
      }
    } catch (err) {
      setErrorMsg("Error saat mencari data barang.");
    } finally {
      setIsCheckingAsset(false);
    }
  };

  return (
    <div className="grid gap-6">
      {schema.map((field, index) => {
        const isBmnCheckField = field.name === 'nup' && hasBmnFields;

        return (
          <React.Fragment key={field.name + index}>
            <FormField
              control={form.control}
              name={`${prefix}.${field.name}`}
              rules={{ 
                required: field.type !== 'boolean' && field.required ? `${field.label} wajib diisi` : false 
              }}
              render={({ field: formField }) => (
                <FormItem className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-bold text-slate-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </FormLabel>
                  </div>
                  
                  <FormControl>
                    {(() => {
                      switch (field.type) {
                        case 'textarea':
                          return (
                            <Textarea 
                              {...formField} 
                              value={formField.value || ''}
                              placeholder={field.placeholder || "Isi detail..."} 
                              className="bg-white min-h-[100px]" 
                            />
                          );
                        
                        case 'number':
                          return (
                            <Input 
                              {...formField} 
                              value={formField.value || ''}
                              type="number" 
                              placeholder="0" 
                              className="bg-white" 
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
                                {field.options?.map((opt: any) => {
                                  // Support both string array and object array for options
                                  const val = typeof opt === 'object' ? opt.value : opt;
                                  const label = typeof opt === 'object' ? opt.label : opt;
                                  return <SelectItem key={val} value={val}>{label}</SelectItem>;
                                })}
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
                              {...formField} 
                              value={formField.value || ''}
                              placeholder={field.placeholder || field.label} 
                              className="bg-white" 
                              onChange={(e) => {
                                formField.onChange(e);
                                if (field.name === 'kode_barang' || field.name === 'nup') {
                                  setAssetChecked(false);
                                  setAssetInfo(null);
                                }
                              }}
                            />
                          );
                      }
                    })()}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Render Tombol Cek Barang tepat setelah NUP */}
            {isBmnCheckField && (
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAssetCheck}
                  disabled={isCheckingAsset}
                  className="w-full flex items-center gap-2 border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Search className="w-4 h-4" />
                  {isCheckingAsset ? "Memeriksa Database..." : "Cek Barang BMN"}
                </Button>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                    <AlertCircle className="w-4 h-4" />
                    {errorMsg}
                  </div>
                )}

                {assetChecked && assetInfo && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-1">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      Barang Terverifikasi
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      <div>
                        <span className="text-emerald-700/70 block text-xs uppercase tracking-wider font-bold">Nama Barang</span>
                        <p className="font-semibold text-emerald-900">{assetInfo.nama_barang || assetInfo.asset_name || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-emerald-700/70 block text-xs uppercase tracking-wider font-bold">Merk/Tipe</span>
                        <p className="font-semibold text-emerald-900">{assetInfo.merek || assetInfo.merk_tipe || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-emerald-700/70 block text-xs uppercase tracking-wider font-bold">Kondisi</span>
                        <p className="font-semibold text-emerald-900 capitalize italic">{assetInfo.kondisi || assetInfo.condition || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-emerald-700/70 block text-xs uppercase tracking-wider font-bold">Lokasi Terdaftar</span>
                        <p className="font-semibold text-emerald-900">{assetInfo.ruangan || assetInfo.location || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};