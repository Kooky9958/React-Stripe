import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Stripe from "stripe";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.get("/api/data", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { email, priceId, planName } = req.body;

    const customers = await stripe.customers.list({ email });
    let customer = customers.data.length ? customers.data[0] : null;
    if (customer) {
      // Get the customer's subscriptions
      const subscriptions = await stripe.subscriptions.list({ customer: customer.id });
      const activeSubscription = subscriptions.data.find(sub => sub.status === "active");

      if (activeSubscription) {
        return res.json({ alreadySubscribed: true, plan: subscriptions });
      }
    }

    let session;
    if(planName == "Basic") {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: 5,
        },
        success_url: "http://localhost:3000/",
        cancel_url: "http://localhost:3000/?error={session.error}",
      });
    } else {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: "http://localhost:3000/?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/?error={session.error}",
      });
    }
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post("/api/upgrade-subscription", async (req, res) => {
  try {
    const { email, newPriceId } = req.body;
    
    const customers = await stripe.customers.list({ email });
    if (!customers.data.length) {
      return res.status(400).json({ error: "Customer not found" });
    }
    const customer = customers.data[0];

    const subscriptions = await stripe.subscriptions.list({ customer: customer.id, status: "active" });
    if (!subscriptions.data.length) {
      return res.status(400).json({ error: "No active subscription found" });
    }
    const subscription = subscriptions.data[0];

    const currentPriceId = subscription.items.data[0].price.id;
    if (currentPriceId === newPriceId) {
      return res.status(400).json({ error: "You're already on this plan!" });
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{ id: subscription.items.data[0].id, price: newPriceId }],
      proration_behavior: "create_prorations", // immediately attempt charge to user 
      payment_behavior: "error_if_incomplete", // ensure subscription is only update if payment is successful
    });

    res.json({ success: true, message: "Subscription upgraded successfully!", subscription: updatedSubscription });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
