export function bindRuntimeIssueControls(): void {
  document.getElementById('btn-runtime-reload')?.addEventListener('click', () => {
    window.location.reload();
  });
}

export function showRuntimeIssue(title: string, message: string, retry = true): void {
  document.getElementById('model-loading')?.classList.add('hidden');
  const box = document.getElementById('runtime-issue');
  const heading = document.getElementById('runtime-issue-title');
  const body = document.getElementById('runtime-issue-body');
  const button = document.getElementById('btn-runtime-reload');
  if (heading) heading.textContent = title;
  if (body) body.textContent = message;
  button?.classList.toggle('hidden', !retry);
  box?.classList.remove('hidden');
}

export function hideRuntimeIssue(): void {
  document.getElementById('runtime-issue')?.classList.add('hidden');
}
