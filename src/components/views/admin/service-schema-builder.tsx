import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, GripVertical } from 'lucide-react';

// Tipe data untuk satu field dalam form
export interface FormFieldSchema {
  name: string;   // key database (misal: alasan_peminjaman)
  label: string;  // Label tampilan (misal: Alasan Peminjaman)
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  options?: string[]; // Untuk tipe 'select' (opsi dipisah koma)
  placeholder?: string;
}

interface SchemaBuilderProps {
  value: FormFieldSchema[];
  onChange: (fields: FormFieldSchema[]) => void;
}

export function SchemaBuilder({ value = [], onChange }: SchemaBuilderProps) {
  
  // Tambah field baru
  const addField = () => {
    const newField: FormFieldSchema = {
      name: '',
      label: '',
      type: 'text',
      required: true,
    };
    onChange([...value, newField]);
  };

  // Hapus field
  const removeField = (index: number) => {
    const newFields = [...value];
    newFields.splice(index, 1);
    onChange(newFields);
  };

  // Update properti field
  const updateField = (index: number, key: keyof FormFieldSchema, val: any) => {
    const newFields = [...value];
    
    // Auto-generate 'name' (slug) saat label diketik, jika name masih kosong
    if (key === 'label' && !newFields[index].name) {
      newFields[index].name = val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }

    // Khusus options (convert string comma-separated ke array)
    if (key === 'options' && typeof val === 'string') {
       // @ts-ignore - kita simpan sementara sebagai string di UI, nanti diparse saat render form
       newFields[index].options = val.split(',').map(s => s.trim()); 
    } else {
       newFields[index] = { ...newFields[index], [key]: val };
    }

    onChange(newFields);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Rancangan Formulir (Input Dinamis)</Label>
        <Button type="button" variant="outline" size="sm" onClick={addField}>
          <Plus className="mr-2 h-4 w-4" /> Tambah Input
        </Button>
      </div>

      {value.length === 0 && (
        <div className="text-center p-6 border-2 border-dashed rounded-md text-muted-foreground text-sm">
          Belum ada input form yang didefinisikan. Klik "Tambah Input" untuk mulai.
        </div>
      )}

      <div className="space-y-3 mb-6">
        {value.map((field, index) => (
          <Card key={index} className="relative group border-l-4 border-l-blue-500">
            <CardContent className="p-4 grid gap-4 md:grid-cols-12 items-start">
              
              {/* Kolom 1: Label & Name */}
              <div className="md:col-span-4 space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Label Pertanyaan</Label>
                  <Input 
                    placeholder="Contoh: Jumlah Penumpang" 
                    value={field.label}
                    onChange={(e) => updateField(index, 'label', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Key Data (Auto)</Label>
                  <Input 
                    className="font-mono text-xs bg-slate-50"
                    placeholder="jumlah_penumpang" 
                    value={field.name}
                    onChange={(e) => updateField(index, 'name', e.target.value)}
                  />
                </div>
              </div>

              {/* Kolom 2: Tipe & Required */}
              <div className="md:col-span-3 space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Tipe Input</Label>
                  <Select 
                    value={field.type} 
                    onValueChange={(val) => updateField(index, 'type', val)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Teks Singkat</SelectItem>
                      <SelectItem value="textarea">Teks Panjang</SelectItem>
                      <SelectItem value="number">Angka</SelectItem>
                      <SelectItem value="date">Tanggal</SelectItem>
                      <SelectItem value="select">Pilihan (Dropdown)</SelectItem>
                      <SelectItem value="boolean">Ya/Tidak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-4">
                  <Switch 
                    id={`req-${index}`}
                    checked={field.required}
                    onCheckedChange={(checked) => updateField(index, 'required', checked)}
                  />
                  <Label htmlFor={`req-${index}`} className="text-sm cursor-pointer">Wajib Diisi?</Label>
                </div>
              </div>

              {/* Kolom 3: Opsi Tambahan (Khusus Select) */}
              <div className="md:col-span-4">
                {field.type === 'select' && (
                  <div>
                     <Label className="text-xs text-muted-foreground">Opsi Pilihan (Pisahkan koma)</Label>
                     <Input 
                        placeholder="Merah, Kuning, Hijau"
                        // Join array back to string for editing
                        defaultValue={Array.isArray(field.options) ? field.options.join(', ') : ''}
                        onBlur={(e) => updateField(index, 'options', e.target.value)}
                     />
                  </div>
                )}
                {field.type !== 'select' && (
                   <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic">
                      Tidak ada pengaturan tambahan
                   </div>
                )}
              </div>

              {/* Kolom 4: Hapus */}
              <div className="md:col-span-1 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => removeField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}