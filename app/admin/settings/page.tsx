import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin/auth';
import {
  MULTILINE_SETTING_KEYS,
  SETTING_GROUPS,
  SETTING_KEYS,
  settingDefaults,
  type SettingKey,
} from '@/lib/content/settings';
import { ActionForm, SubmitButton } from '@/components/admin/action-form';
import { saveSettings } from '../actions';

/**
 * The text-and-settings editor, generated from `settingDefaults`.
 *
 * One form per group rather than one for the whole page: there are roughly a hundred
 * keys, and a single save button over all of them means every trip to this page rewrites
 * every row and any concurrent edit is silently clobbered. `saveSettings` only touches
 * the keys actually submitted, which is what makes per-group saving safe.
 */
export default async function SettingsPage() {
  await requireAdmin();

  const stored = new Map<string, string>();
  try {
    for (const row of await prisma.siteSetting.findMany()) stored.set(row.key, row.value);
  } catch (error) {
    console.error('[admin] could not read settings', error);
  }

  const claimed = new Set<SettingKey>();
  const groups = SETTING_GROUPS.map((group) => {
    const keys = SETTING_KEYS.filter(
      (key) => !claimed.has(key) && group.prefixes.some((prefix) => key.startsWith(prefix)),
    );
    for (const key of keys) claimed.add(key);
    return { ...group, keys };
  }).filter((group) => group.keys.length > 0);

  // Anything a new prefix has not claimed still gets an editor rather than vanishing.
  const orphans = SETTING_KEYS.filter((key) => !claimed.has(key));
  if (orphans.length > 0) {
    groups.push({ title: 'Other', note: '', prefixes: [], keys: orphans });
  }

  return (
    <div>
      <header>
        <h1 className="font-serif text-3xl font-light">Text &amp; settings</h1>
        <p className="mt-2 max-w-[62ch] text-[0.875rem] leading-relaxed text-stone">
          Every heading, label, contact detail and SEO field on the site. Each section
          saves on its own. Values shown greyed are still the built-in defaults.
        </p>
      </header>

      <div className="mt-10 space-y-4">
        {groups.map((group) => (
          <details key={group.title} className="adm-card group">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <span className="flex-1 font-serif text-lg">{group.title}</span>
              <span className="text-[0.6875rem] text-stone">
                {group.keys.filter((key) => stored.has(key)).length}/{group.keys.length} edited
              </span>
              <span className="text-[0.6875rem] text-stone group-open:hidden">Open</span>
              <span className="hidden text-[0.6875rem] text-stone group-open:inline">Close</span>
            </summary>

            <div className="border-t border-ink/8 p-5">
              {group.note && (
                <p className="mb-5 text-[0.75rem] leading-relaxed text-stone">{group.note}</p>
              )}
              <ActionForm action={saveSettings} className="grid gap-5">
                {group.keys.map((key) => (
                  <SettingControl
                    key={key}
                    settingKey={key}
                    value={stored.get(key) ?? settingDefaults[key]}
                    isDefault={!stored.has(key)}
                  />
                ))}
                <div>
                  <SubmitButton>Save {group.title.toLowerCase()}</SubmitButton>
                </div>
              </ActionForm>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

function SettingControl({
  settingKey,
  value,
  isDefault,
}: {
  settingKey: SettingKey;
  value: string;
  isDefault: boolean;
}) {
  const id = `s-${settingKey}`;
  const label = humanise(settingKey);
  const isBoolean = value === 'true' || value === 'false';
  const isMultiline = MULTILINE_SETTING_KEYS.has(settingKey);

  return (
    <div>
      <label htmlFor={id} className="adm-label flex items-baseline gap-2">
        <span>{label}</span>
        <code className="text-[0.5625rem] font-normal text-stone">{settingKey}</code>
        {isDefault && (
          <span className="text-[0.5625rem] font-normal text-gold-dim">default</span>
        )}
      </label>

      {isBoolean ? (
        <div className="flex items-center gap-2">
          {/* Paired hidden field so unticking actually posts 'false' — a bare checkbox
              posts nothing at all. The action reads the last value under the name. */}
          <input type="hidden" name={settingKey} value="false" />
          <input
            id={id}
            type="checkbox"
            name={settingKey}
            value="true"
            defaultChecked={value === 'true'}
            className="h-4 w-4 accent-[#b08d57]"
          />
          <span className="text-[0.75rem] text-stone">
            {settingKey.endsWith('Confirmed')
              ? 'Tick once these values are real and checked.'
              : 'Tick to enable.'}
          </span>
        </div>
      ) : isMultiline ? (
        <textarea
          id={id}
          name={settingKey}
          defaultValue={value}
          rows={value.length > 240 ? 6 : 3}
          className={`adm-textarea ${isDefault ? 'text-ink/55' : ''}`}
        />
      ) : (
        <input
          id={id}
          type="text"
          name={settingKey}
          defaultValue={value}
          className={`adm-input ${isDefault ? 'text-ink/55' : ''}`}
        />
      )}
    </div>
  );
}

/** 'hero.primaryCta' → 'Hero · Primary cta'. Good enough, and never out of date. */
function humanise(key: string): string {
  return key
    .split('.')
    .map((part) =>
      part
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^./, (char) => char.toUpperCase()),
    )
    .join(' · ');
}
