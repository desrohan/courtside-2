import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, User, Users, Camera, MapPin } from 'lucide-react';
import { organizations } from '@/data/organizations';

type SignupStep = 1 | 2 | 3 | 4;

interface AthleteForm {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianRelationship: string;
  countryOfResidence: string;
}

export default function AthleteSignup() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const org = organizations.find(o => o.slug === orgSlug) || organizations[0];
  const [step, setStep] = useState<SignupStep>(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<AthleteForm>({
    firstName: '', lastName: '', dateOfBirth: '', gender: '', nationality: '',
    guardianName: '', guardianEmail: '', guardianPhone: '', guardianRelationship: 'parent',
    countryOfResidence: '',
  });

  const update = (field: keyof AthleteForm, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const canNext = () => {
    if (step === 1) return form.firstName && form.lastName && form.dateOfBirth && form.gender && form.nationality;
    if (step === 2) return form.guardianName && form.guardianEmail && form.guardianPhone;
    return true;
  };

  const next = () => { if (step < 4) setStep((step + 1) as SignupStep); };
  const prev = () => { if (step > 1) setStep((step - 1) as SignupStep); };
  const submit = () => setSubmitted(true);

  const stepLabels = ['Athlete Info', 'Parent / Guardian', 'Optional Details', 'Review'];

  if (submitted) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl border border-dark-100 p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: org.primaryColor + '15' }}>
            <Check size={28} style={{ color: org.primaryColor }} />
          </div>
          <h1 className="text-xl font-extrabold text-dark-900">Athlete Profile Created</h1>
          <p className="text-sm text-dark-500">
            <strong>{form.firstName} {form.lastName}</strong> has been enrolled at <strong>{org.name}</strong>.
          </p>
          <div className="bg-dark-50 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider">Courtside Athlete ID</p>
            <p className="text-sm font-mono font-bold text-dark-800 mt-1">ATH-{Math.random().toString(36).substring(2, 8).toUpperCase()}</p>
          </div>
          <p className="text-xs text-dark-400">You can complete sport registration details later inside the app.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Org Branding */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center text-white text-lg font-bold"
            style={{ background: `linear-gradient(135deg, ${org.primaryColor}, ${org.primaryColor}bb)` }}>
            {org.logo}
          </div>
          <h1 className="text-lg font-extrabold text-dark-900 mt-3">{org.name}</h1>
          <p className="text-xs text-dark-400">Athlete Registration</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-1">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i + 1 <= step ? 'bg-court-500' : 'bg-dark-200'}`} style={i + 1 <= step ? { backgroundColor: org.primaryColor } : {}} />
              <p className={`text-[10px] mt-1 text-center ${i + 1 === step ? 'font-bold text-dark-700' : 'text-dark-400'}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-dark-100 p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <User size={16} style={{ color: org.primaryColor }} />
                  <h2 className="text-sm font-bold text-dark-900">Athlete Information</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name *" value={form.firstName} onChange={v => update('firstName', v)} placeholder="First name" />
                  <Field label="Last Name *" value={form.lastName} onChange={v => update('lastName', v)} placeholder="Last name" />
                </div>
                <Field label="Date of Birth *" type="date" value={form.dateOfBirth} onChange={v => update('dateOfBirth', v)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Gender *</label>
                    <select value={form.gender} onChange={e => update('gender', e.target.value)}
                      className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Field label="Nationality *" value={form.nationality} onChange={v => update('nationality', v)} placeholder="e.g. British" />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={16} style={{ color: org.primaryColor }} />
                  <h2 className="text-sm font-bold text-dark-900">Parent / Guardian</h2>
                </div>
                <Field label="Full Name *" value={form.guardianName} onChange={v => update('guardianName', v)} placeholder="Parent or guardian name" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Email *" type="email" value={form.guardianEmail} onChange={v => update('guardianEmail', v)} placeholder="email@example.com" />
                  <Field label="Phone *" value={form.guardianPhone} onChange={v => update('guardianPhone', v)} placeholder="+44 7700 000000" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Relationship *</label>
                  <select value={form.guardianRelationship} onChange={e => update('guardianRelationship', e.target.value)}
                    className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20">
                    <option value="parent">Parent</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin size={16} style={{ color: org.primaryColor }} />
                  <h2 className="text-sm font-bold text-dark-900">Optional Details</h2>
                </div>
                <Field label="Country of Residence" value={form.countryOfResidence} onChange={v => update('countryOfResidence', v)} placeholder="e.g. United Kingdom" />
                <div>
                  <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Photo (Optional)</label>
                  <div className="mt-1 border-2 border-dashed border-dark-200 rounded-xl p-6 text-center hover:border-dark-300 transition-colors cursor-pointer">
                    <Camera size={24} className="mx-auto text-dark-300 mb-2" />
                    <p className="text-xs text-dark-400">Click to upload a photo</p>
                    <p className="text-[10px] text-dark-300 mt-1">JPG or PNG, max 5MB</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-sm font-bold text-dark-900">Review & Submit</h2>
                <div className="space-y-3">
                  <ReviewSection title="Athlete" items={[
                    ['Name', `${form.firstName} ${form.lastName}`],
                    ['Date of Birth', form.dateOfBirth],
                    ['Gender', form.gender],
                    ['Nationality', form.nationality],
                    ...(form.countryOfResidence ? [['Country of Residence', form.countryOfResidence] as [string, string]] : []),
                  ]} />
                  <ReviewSection title="Parent / Guardian" items={[
                    ['Name', form.guardianName],
                    ['Email', form.guardianEmail],
                    ['Phone', form.guardianPhone],
                    ['Relationship', form.guardianRelationship],
                  ]} />
                </div>
                <div className="bg-court-50 rounded-lg px-3 py-2 text-xs text-court-700" style={{ backgroundColor: org.primaryColor + '10', color: org.primaryColor }}>
                  You can complete sport registration details later inside the app.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-100">
            <button onClick={prev} disabled={step === 1}
              className={`h-9 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${step === 1 ? 'text-dark-300 cursor-not-allowed' : 'text-dark-600 hover:bg-dark-50'}`}>
              <ArrowLeft size={15} /> Back
            </button>
            {step < 4 ? (
              <button onClick={next} disabled={!canNext()}
                className="h-9 px-5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-40"
                style={{ backgroundColor: org.primaryColor }}>
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button onClick={submit}
                className="h-9 px-5 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
                style={{ backgroundColor: org.primaryColor }}>
                <Check size={15} /> Create Athlete Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full h-9 px-3 rounded-xl border border-dark-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-court-500/20" />
    </div>
  );
}

function ReviewSection({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="bg-dark-50 rounded-xl p-3">
      <p className="text-[10px] font-bold text-dark-400 uppercase tracking-wider mb-2">{title}</p>
      <div className="space-y-1.5">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-xs text-dark-500">{k}</span>
            <span className="text-xs font-semibold text-dark-800 capitalize">{v || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
