import express from "express";

const app = express();
app.use(express.json());

app.post(['/chat', '/api/chat'], async (req, res) => {
  try {
    const { message, messages } = req.body;
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat",
        messages: messages || [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || "No response";

    res.json({ message: replyText });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ error: err.message });
  }
});
app.post('/create-checkout-session', async (req, res) => {
  try {
    res.json({ url: "https://checkout.stripe.com/pay/test" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default app;