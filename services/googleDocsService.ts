export const fetchGoogleDocText = async (docId: string, accessToken: string): Promise<{title: string, text: string}> => {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Permission denied. Ensure you are signed in and have access to this document.');
    }
    throw new Error('Failed to fetch Google Doc. Check if the Document ID is correct.');
  }

  const data = await res.json();
  
  let text = '';
  if (data.body && data.body.content) {
    for (const element of data.body.content) {
      if (element.paragraph && element.paragraph.elements) {
        for (const el of element.paragraph.elements) {
          if (el.textRun && el.textRun.content) {
            text += el.textRun.content;
          }
        }
      }
    }
  }

  return { title: data.title || 'Google Doc', text };
};

export const extractDocIdFromUrl = (url: string): string | null => {
  const match = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};
