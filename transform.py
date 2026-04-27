import re

with open("c:\\laragon\\www\\sigap-frontend\\src\\components\\views\\tickets\\create-ticket.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add states
current_step_state = """  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.title.trim() || !formData.description.trim()) {
        import("sonner").then(module => module.toast.error("Mohon lengkapi judul dan deskripsi"));
        return;
      }
    }
    if (currentStep === 2) {
      if (ticketType === "perbaikan") {
        if (!assetChecked) {
          import("sonner").then(module => module.toast.error("Mohon cek barang terlebih dahulu"));
          return;
        }
        if (!formData.assetLocation) {
          import("sonner").then(module => module.toast.error("Mohon isi lokasi barang"));
          return;
        }
      }
      if (ticketType === "zoom_meeting") {
        if (!formData.meetingDate || !formData.startTime || !formData.endTime || !formData.coHostName) {
           import("sonner").then(module => module.toast.error("Lengkapi detail zoom"));
           return;
        }
      }
    }
    setCurrentStep((prev) => min(prev + 1, totalSteps));
  };
  
  const prevStep = () => setCurrentStep((prev) => max(prev - 1, 1));
"""

# Replace React's import to include AnimatePresence
content = content.replace('import { motion } from "motion/react";', 'import { motion, AnimatePresence } from "motion/react";')

old_useState = "const [attachments, setAttachments] = useState<File[]>([]);"
content = content.replace(old_useState, old_useState + "\\n" + current_step_state.replace("min", "Math.min").replace("max", "Math.max"))

start_tag = '<form onSubmit={handleSubmit} className="space-y-6">'
end_tag = '</form>'

start_idx = content.find(start_tag)
end_idx = content.find(end_tag, start_idx)

original_form_content = content[start_idx + len(start_tag) : end_idx]

parts = original_form_content.split('              {/* Attachments */}')
common_fields = parts[0].split('              {/* Type-specific Fields */}')[0]
type_specific = parts[0].split('              {/* Type-specific Fields */}')[1]
attachments_and_submit = parts[1].split('              {/* Submit */}')[0]

new_form = """
              {/* Stepper Header */}
              <div className="flex items-center justify-between mb-10 relative pt-2 px-4 max-w-lg mx-auto">
                 <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-100 rounded-full z-0"></div>
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500" style={{ width: `calc(${((currentStep - 1) / (totalSteps - 1)) * 100}% - 1.5rem)`}}></div>
                 
                 {[1, 2, 3].map(step => (
                    <div key={step} className={`relative z-10 flex flex-col items-center justify-center w-10 h-10 rounded-full border-2 font-bold transition-all duration-300 ${
                       currentStep >= step ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      {step}
                      <span className={`absolute -bottom-7 text-[11px] whitespace-nowrap font-bold uppercase tracking-wider ${currentStep >= step ? 'text-blue-600' : 'text-gray-400'}`}>
                        {step === 1 ? 'Informasi Dasar' : step === 2 ? 'Detail Khusus' : 'Lampiran'}
                      </span>
                    </div>
                 ))}
              </div>

              <div className="overflow-visible mt-12 min-h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                     key={currentStep}
                     initial={{ x: 20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     exit={{ x: -20, opacity: 0 }}
                     transition={{ duration: 0.2 }}
                  >
                    {currentStep === 1 && (
                      <div className="space-y-6">
""" + common_fields + """                      </div>
                    )}
                    {currentStep === 2 && (
                      <div className="space-y-6">
""" + type_specific + """                      </div>
                    )}
                    {currentStep === 3 && (
                      <div className="space-y-6">
""" + attachments_and_submit + """                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-6 border-t mt-6">
                {currentStep === 1 ? (
                  <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="flex-1 cursor-pointer h-12">Batal</Button>
                ) : (
                  <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting} className="flex-1 cursor-pointer h-12">Kembali</Button>
                )}
                
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={nextStep} className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white h-12">Lanjut</Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting} className="flex-1 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white h-12">
                    {isSubmitting ? "Mengirim..." : "Ajukan Tiket"}
                  </Button>
                )}
              </div>
"""

final_content = content[:start_idx + len(start_tag)] + new_form + content[end_idx:]

with open("c:\\laragon\\www\\sigap-frontend\\src\\components\\views\\tickets\\create-ticket.tsx", "w", encoding="utf-8") as f:
    f.write(final_content)
