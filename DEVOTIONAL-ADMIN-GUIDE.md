# Devotional Admin Feature - Implementation Guide

## ✅ Completed
1. Created database migration: `supabase/add-devotionals-admin.sql`
2. Updated AppContext.tsx with devotional state and functions
3. Added DailyDevotional type import

## 📋 Steps to Complete

### 1. Run Database Migration
```bash
# In Supabase SQL Editor, run:
supabase/add-devotionals-admin.sql
```

### 2. Verify AppContext.tsx
Check that these functions exist (lines ~703-723):
- `addDevotional`
- `updateDevotional`
- `deleteDevotional`

**If duplicates exist**, remove them manually.

### 3. Update AdminDashboard.tsx

Add devotional tile to the `tiles` array (line ~17):
```typescript
{ key: 'devotionals' as const, icon: BookOpen, label: 'Manage Devotionals', desc: 'Create and edit daily devotional content.', color: 'var(--color-sage)' },
```

Add devotional state variables (line ~82):
```typescript
// Devotional creation/editing
const [devId, setDevId] = useState<string | null>(null);
const [devDate, setDevDate] = useState('');
const [devTheme, setDevTheme] = useState('');
const [devScriptureRef, setDevScriptureRef] = useState('');
const [devScriptureText, setDevScriptureText] = useState('');
const [devReflection, setDevReflection] = useState('');
const [devAffirmation, setDevAffirmation] = useState('');
const [devPrayer, setDevPrayer] = useState('');
const [devSaving, setDevSaving] = useState(false);
```

Update AppContext destructuring (line ~32):
```typescript
const {
  // ... existing
  dailyDevotionals, addDevotional, updateDevotional, deleteDevotional,
  // ... rest
} = useApp();
```

Add devotionals section BEFORE the final return (after line ~731):
```typescript
// ─── Manage Devotionals ─────────────────────────────────────
if (section === 'devotionals') {
  const handleSaveDevotional = async () => {
    setDevSaving(true);
    try {
      if (devId) {
        await updateDevotional(devId, {
          date: devDate,
          theme: devTheme,
          scripture_ref: devScriptureRef,
          scripture_text: devScriptureText,
          reflection: devReflection,
          affirmation: devAffirmation,
          prayer: devPrayer,
        });
      } else {
        await addDevotional({
          date: devDate,
          theme: devTheme,
          scripture_ref: devScriptureRef,
          scripture_text: devScriptureText,
          reflection: devReflection,
          affirmation: devAffirmation,
          prayer: devPrayer,
        });
      }
      // Reset form
      setDevId(null);
      setDevDate('');
      setDevTheme('');
      setDevScriptureRef('');
      setDevScriptureText('');
      setDevReflection('');
      setDevAffirmation('');
      setDevPrayer('');
      addToast('success', devId ? 'Devotional updated!' : 'Devotional created!');
    } catch (err) {
      addToast('error', 'Failed to save devotional');
    } finally {
      setDevSaving(false);
    }
  };

  const handleEditDevotional = (dev: any) => {
    setDevId(dev.id);
    setDevDate(dev.date);
    setDevTheme(dev.theme);
    setDevScriptureRef(dev.scripture_ref);
    setDevScriptureText(dev.scripture_text);
    setDevReflection(dev.reflection);
    setDevAffirmation(dev.affirmation);
    setDevPrayer(dev.prayer);
  };

  return (
    <div className="space-y-5">
      <BackBtn />
      <div>
        <h1 className="font-display text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          {devId ? 'Edit Devotional' : 'Create Devotional'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {devId ? 'Update the devotional content below.' : 'Create a new daily devotional for the community.'}
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Date *</label>
          <input
            type="date"
            className="input"
            value={devDate}
            onChange={(e) => setDevDate(e.target.value)}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            The devotional will be shown on this date
          </p>
        </div>

        <div>
          <label className="label">Theme *</label>
          <input
            className="input"
            placeholder="e.g. Your Identity in Christ"
            value={devTheme}
            onChange={(e) => setDevTheme(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Scripture Reference *</label>
          <input
            className="input"
            placeholder="e.g. Song of Solomon 4:7"
            value={devScriptureRef}
            onChange={(e) => setDevScriptureRef(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Scripture Text *</label>
          <textarea
            className="input"
            rows={3}
            placeholder="You are altogether beautiful, my darling; there is no flaw in you."
            value={devScriptureText}
            onChange={(e) => setDevScriptureText(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Reflection *</label>
          <textarea
            className="input"
            rows={5}
            placeholder="Write a thoughtful reflection on the scripture..."
            value={devReflection}
            onChange={(e) => setDevReflection(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Affirmation *</label>
          <textarea
            className="input"
            rows={2}
            placeholder="I am fearfully and wonderfully made..."
            value={devAffirmation}
            onChange={(e) => setDevAffirmation(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Prayer *</label>
          <textarea
            className="input"
            rows={4}
            placeholder="Lord, help me see myself the way You see me..."
            value={devPrayer}
            onChange={(e) => setDevPrayer(e.target.value)}
          />
        </div>

        <button
          className="btn btn-sage btn-lg w-full"
          disabled={!devDate || !devTheme || !devScriptureRef || !devScriptureText || !devReflection || !devAffirmation || !devPrayer || devSaving}
          onClick={handleSaveDevotional}
        >
          {devSaving ? 'Saving...' : devId ? 'Update Devotional' : 'Create Devotional'}
        </button>

        {devId && (
          <button
            className="btn btn-ghost w-full"
            onClick={() => {
              setDevId(null);
              setDevDate('');
              setDevTheme('');
              setDevScriptureRef('');
              setDevScriptureText('');
              setDevReflection('');
              setDevAffirmation('');
              setDevPrayer('');
            }}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Existing Devotionals */}
      {dailyDevotionals.length > 0 && (
        <div className="space-y-3">
          <h3 className="section-label">Existing Devotionals ({dailyDevotionals.length})</h3>
          {dailyDevotionals.map((dev) => (
            <div key={dev.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="badge badge-sage">{dev.date}</span>
                  <h4 className="font-bold text-sm mt-2" style={{ color: 'var(--color-text)' }}>
                    {dev.theme}
                  </h4>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {dev.scripture_ref}
                  </p>
                </div>
              </div>
              <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                {dev.reflection}
              </p>
              <div className="flex gap-2">
                <button
                  className="btn btn-secondary btn-sm flex-1"
                  onClick={() => handleEditDevotional(dev)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm flex-1"
                  style={{ background: 'rgba(244,63,94,0.08)', color: '#fb7185', border: '1.5px solid rgba(244,63,94,0.2)' }}
                  onClick={async () => {
                    if (confirm('Delete this devotional?')) {
                      await deleteDevotional(dev.id);
                    }
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 4. Update DailyDevotional.tsx

Replace `getTodaysDevotional()` call (line ~10) with database fetch:
```typescript
const { dailyDevotionals } = useApp();
const today = new Date().toISOString().split('T')[0];
const devotional = dailyDevotionals.find(d => d.date === today) || getTodaysDevotional();
```

## Testing Checklist
- [ ] Run database migration
- [ ] Verify no duplicate functions in AppContext
- [ ] Add devotional admin section to AdminDashboard
- [ ] Test creating a devotional
- [ ] Test editing a devotional
- [ ] Test deleting a devotional
- [ ] Verify devotional shows on the correct date in DailyDevotional view
- [ ] Test fallback to hardcoded devotionals when none exist in database

## Summary
This feature allows leaders to:
- Create devotionals for specific dates via admin dashboard
- Edit existing devotionals
- Delete devotionals
- Fallback to hardcoded devotionals if no database entry exists for today
