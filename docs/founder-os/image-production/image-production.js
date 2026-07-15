(() => {
  const jobs = [
    {
      id: 'IMG-WEB-R03-001',
      title: 'Brand Hero Image',
      region: 'R03 Brand Hero',
      assetType: 'Responsive website background',
      purpose: 'Create the primary emotional first impression for the Natural Nation branding website.',
      visualDirection: 'Premium holistic wellness, colorful healthy whole foods, natural stone texture, rich botanical greens, warm morning light, high-end commercial editorial photography.',
      composition: 'Preserve clean negative space on the left-center for live heading and CTA. Keep essential subjects inside a responsive safe zone for desktop, tablet, and mobile crops.',
      prohibited: 'Text, logos, buttons, interface elements, watermarks, people, medical imagery.',
      status: 'Ready'
    },
    {
      id: 'IMG-WEB-R05-001',
      title: 'About Natural Nation',
      region: 'R05 About Natural Nation',
      assetType: 'Editorial supporting image',
      purpose: 'Show the Natural Nation balance of nature, intelligence, and everyday wellness.',
      visualDirection: 'Warm, credible, modern wellness editorial scene with natural ingredients, subtle technology cues, premium lighting, and calm composition.',
      composition: 'Subject emphasis on the right with copy-safe space on the left. Maintain useful crops at 16:9, 4:3, and 3:4.',
      prohibited: 'Embedded typography, visible brands, exaggerated medical claims, clinical hospital styling.',
      status: 'Ready'
    },
    {
      id: 'IMG-WEB-R09-001',
      title: 'Meet Duey Environment',
      region: 'R09 Meet Duey',
      assetType: 'Duey character environment',
      purpose: 'Introduce Duey as the friendly AI wellness mentor in a trustworthy natural setting.',
      visualDirection: 'Friendly premium AI wellness robot, soft green and gold accents, botanical environment, warm natural light, approachable but intelligent.',
      composition: 'Duey centered-right with breathing room for live interface copy. Preserve the approved robot identity and silhouette.',
      prohibited: 'Human face, human skin, humanoid realism, medical uniform, text, logos, weapons, dark dystopian styling.',
      status: 'In Review'
    },
    {
      id: 'IMG-WEB-R11-001',
      title: 'Final Call to Action',
      region: 'R11 Final CTA',
      assetType: 'Wide atmospheric background',
      purpose: 'Create a confident closing image that supports the final invitation to begin the Natural Nation experience.',
      visualDirection: 'Sunlit botanical wellness atmosphere, refined natural textures, subtle gold highlights, optimistic and premium.',
      composition: 'Broad central safe area for live text and CTA. Avoid essential details near outer crop edges.',
      prohibited: 'Text, logos, buttons, people, clutter, excessive contrast.',
      status: 'Approved'
    }
  ];

  let selectedJob = jobs[0];
  let selectedCandidate = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  function renderMetrics() {
    $('[data-metric-jobs]').textContent = jobs.length;
    $('[data-metric-ready]').textContent = jobs.filter((job) => job.status === 'Ready').length;
    $('[data-metric-review]').textContent = jobs.filter((job) => job.status === 'In Review').length;
    $('[data-metric-approved]').textContent = jobs.filter((job) => job.status === 'Approved').length;
  }

  function renderQueue() {
    $('[data-job-list]').innerHTML = jobs.map((job) => `
      <button class="job-button${job.id === selectedJob.id ? ' active' : ''}" type="button" data-job-id="${job.id}">
        <strong>${job.title}</strong>
        <span>${job.id}</span>
        <div class="job-meta"><span>${job.region}</span><span>${job.status}</span></div>
      </button>
    `).join('');
  }

  function renderJob() {
    $('[data-job-title]').textContent = selectedJob.title;
    $('[data-job-id]').textContent = selectedJob.id;
    $('[data-job-status]').textContent = selectedJob.status;
    $$('[data-field]').forEach((field) => {
      field.value = selectedJob[field.dataset.field] || '';
    });
    selectedCandidate = null;
    $('[data-approve-asset]').disabled = true;
    renderCandidates();
    renderQueue();
  }

  function saveBrief() {
    $$('[data-field]').forEach((field) => {
      selectedJob[field.dataset.field] = field.value.trim();
    });
    $('[data-center-status]').textContent = `${selectedJob.id} brief saved locally`;
    renderQueue();
  }

  function generatePrompt() {
    saveBrief();
    const prompt = `Create four distinct production-ready image candidates for Natural Nation.\n\nASSET JOB\n${selectedJob.id} — ${selectedJob.title}\n\nPLACEMENT\n${selectedJob.region}\n\nASSET TYPE\n${selectedJob.assetType}\n\nPURPOSE\n${selectedJob.purpose}\n\nVISUAL DIRECTION\n${selectedJob.visualDirection}\n\nCOMPOSITION AND RESPONSIVE SAFE AREA\n${selectedJob.composition}\n\nDO NOT INCLUDE\n${selectedJob.prohibited}\n\nOUTPUT REQUIREMENTS\n- Produce four separate candidates labeled A, B, C, and D.\n- Do not embed interface text or controls into the image.\n- Keep the visual suitable for responsive desktop, tablet, and mobile crops.\n- Preserve the approved Natural Nation premium holistic wellness visual language.\n- Return candidates for Founder review before production approval.`;
    $('[data-prompt-output]').textContent = prompt;
    selectedJob.status = 'In Review';
    $('[data-job-status]').textContent = selectedJob.status;
    $('[data-center-status]').textContent = `${selectedJob.id} prompt ready for Founder review`;
    renderMetrics();
    renderQueue();
  }

  function renderCandidates() {
    const notes = ['Balanced composition', 'Strongest lighting', 'Best responsive crop', 'Boldest brand mood'];
    $('[data-candidate-grid]').innerHTML = ['A', 'B', 'C', 'D'].map((label, index) => `
      <button class="candidate${selectedCandidate === label ? ' selected' : ''}" type="button" data-candidate="${label}">
        <div class="candidate-art">${label}</div>
        <div class="candidate-copy"><strong>Candidate ${label}</strong><span>${notes[index]}</span></div>
      </button>
    `).join('');
  }

  function approveAsset() {
    if (!selectedCandidate) return;
    selectedJob.status = 'Approved';
    const assetId = `NN-AL-${selectedJob.id.replace('IMG-', '')}`;
    const record = {
      assetId,
      sourceJob: selectedJob.id,
      title: selectedJob.title,
      selectedCandidate,
      status: 'Founder Approved — Pilot',
      usage: selectedJob.region,
      version: '1.0-pilot',
      storageStatus: 'Pending production storage',
      implementationStatus: 'Ready for integration package'
    };
    $('[data-asset-record]').textContent = JSON.stringify(record, null, 2);
    $('[data-job-status]').textContent = selectedJob.status;
    $('[data-center-status]').textContent = `${assetId} approved in pilot session`;
    renderMetrics();
    renderQueue();
  }

  document.addEventListener('click', async (event) => {
    const jobButton = event.target.closest('[data-job-id]');
    if (jobButton) {
      selectedJob = jobs.find((job) => job.id === jobButton.dataset.jobId) || selectedJob;
      renderJob();
      return;
    }

    const candidate = event.target.closest('[data-candidate]');
    if (candidate) {
      selectedCandidate = candidate.dataset.candidate;
      $('[data-approve-asset]').disabled = false;
      renderCandidates();
      return;
    }

    if (event.target.closest('[data-save-brief]')) saveBrief();
    if (event.target.closest('[data-generate-prompt]')) generatePrompt();
    if (event.target.closest('[data-approve-asset]')) approveAsset();

    if (event.target.closest('[data-copy-prompt]')) {
      const prompt = $('[data-prompt-output]').textContent;
      try {
        await navigator.clipboard.writeText(prompt);
        $('[data-center-status]').textContent = 'Production prompt copied';
      } catch {
        $('[data-center-status]').textContent = 'Copy unavailable — select the prompt manually';
      }
    }

    if (event.target.closest('[data-request-revision]')) {
      $('[data-center-status]').textContent = selectedCandidate
        ? `Revision requested using Candidate ${selectedCandidate} as reference`
        : 'Select a candidate before requesting a revision';
    }

    if (event.target.closest('[data-new-job]')) {
      $('[data-center-status]').textContent = 'Pilot note: new-job persistence will be added with the repository-backed release';
    }
  });

  renderMetrics();
  renderJob();
})();
