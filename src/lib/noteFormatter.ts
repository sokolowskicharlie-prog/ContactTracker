export function formatNoteContent(content: string): string {
  if (!content) return '';

  const lines = content.split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Check if line is a bullet point (starts with -, *, or •)
    const bulletMatch = trimmedLine.match(/^[-*•]\s+(.+)$/);

    if (bulletMatch) {
      if (!inList) {
        html += '<ul class="list-disc list-inside space-y-1 my-2">';
        inList = true;
      }
      html += `<li class="ml-2">${escapeHtml(bulletMatch[1])}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }

      if (trimmedLine) {
        html += `<p class="my-1">${escapeHtml(line)}</p>`;
      } else {
        html += '<br/>';
      }
    }
  }

  if (inList) {
    html += '</ul>';
  }

  return html;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
