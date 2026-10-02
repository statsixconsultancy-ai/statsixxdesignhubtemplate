/*
  Google Form connection for STAT6 × Design Template Hub enquiries.
  Both the /enquiry page and the contact form on the home page send their
  answers here, so every lead lands in one Google Form (and its linked Sheet).

  ── One time setup ──────────────────────────────────────────────────────────
  1. Create a Google Form with these questions, in any order:
       Full name ............ Short answer
       Work email ........... Short answer   (leave response validation off)
       Phone ................ Short answer
       Company .............. Short answer
       Website .............. Short answer
       Services ............. Checkboxes with exactly these options:
                              Brand identity, Website, AI engine optimisation,
                              Custom AI software, Business launch
       Budget ............... Short answer
       Timeline ............. Short answer
       Project details ...... Paragraph
       How did you hear ..... Short answer
       Submitted from ....... Short answer
  2. Settings → Responses: turn OFF "Collect email addresses" and OFF
     "Restrict to users in your organisation". Otherwise Google rejects
     submissions that come from the website.
  3. In the form editor open ⋮ (top right) → "Get pre-filled link".
     In every Short answer / Paragraph question type the KEY word shown
     below as the answer, and tick ALL options under Services:
       Full name → name          Work email → email     Phone → phone
       Company → company         Website → website      Budget → budget
       Timeline → timeline       Project details → message
       How did you hear → source Submitted from → page
  4. Click "Get link" → "Copy link" and paste it between the quotes below.
  That's it. The script reads the form ID and every question ID from the link.
  ────────────────────────────────────────────────────────────────────────────
*/
window.GOOGLE_FORM_PREFILLED_LINK = '';

/* Optional: set IDs by hand instead of using the pre-filled link above.
   formId is the long code between /d/e/ and /viewform in the form's link.  */
window.GOOGLE_FORM_MANUAL = {
  formId: '',
  fields: { name: '', email: '', phone: '', company: '', website: '', services: '', budget: '', timeline: '', message: '', source: '', page: '' }
};

(function () {
  const KEYS = ['name', 'email', 'phone', 'company', 'website', 'services', 'budget', 'timeline', 'message', 'source', 'page'];

  function fromPrefilled(link) {
    try {
      const url = new URL(link);
      const m = url.pathname.match(/\/forms\/d\/e\/([^/]+)\//);
      if (!m) return null;
      const fields = {}, seen = {};
      url.searchParams.forEach((_, key) => { if (key.startsWith('entry.')) seen[key] = (seen[key] || 0) + 1; });
      url.searchParams.forEach((value, key) => {
        if (!key.startsWith('entry.')) return;
        const v = value.trim();
        // The checkbox question repeats once per ticked option; key words are typed in lowercase.
        if (seen[key] > 1 || !KEYS.includes(v)) fields.services = key;
        else fields[v] = key;
      });
      return { formId: m[1], fields };
    } catch (_) { return null; }
  }

  function config() {
    const manual = window.GOOGLE_FORM_MANUAL || {};
    if (manual.formId) return manual;
    if (window.GOOGLE_FORM_PREFILLED_LINK) return fromPrefilled(window.GOOGLE_FORM_PREFILLED_LINK);
    return null;
  }

  /* data: { name, email, ..., services: [..] }  →  { ok, demo } */
  window.submitToGoogleForm = async function (data) {
    const cfg = config();
    if (!cfg || !cfg.formId) {
      console.warn('[enquiry] Google Form is not connected yet. See assets/google-form.js. Submission data:', data);
      return { ok: true, demo: true };
    }
    const body = new URLSearchParams();
    Object.entries(data).forEach(([key, val]) => {
      const id = cfg.fields[key];
      if (!id || val == null || val === '') return;
      (Array.isArray(val) ? val : [val]).forEach(v => body.append(id, v));
    });
    try {
      // Google Forms does not send CORS headers, so the response is opaque.
      // A resolved request means Google received it.
      await fetch(`https://docs.google.com/forms/d/e/${cfg.formId}/formResponse`, { method: 'POST', mode: 'no-cors', body });
      return { ok: true, demo: false };
    } catch (err) {
      console.error('[enquiry] Submission failed', err);
      return { ok: false, demo: false };
    }
  };
})();
