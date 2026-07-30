
export const aiAssistant = {
  async getResponse(prompt: string, productContext?: string) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, productContext }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from AI API');
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("AI Assistant Error:", error);
      return "מצטערת, חלה שגיאה בעיבוד הבקשה. אנא נסה שוב מאוחר יותר.";
    }
  }
};
