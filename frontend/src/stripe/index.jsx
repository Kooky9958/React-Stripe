import React, { useEffect, useState } from 'react'
import axios from "axios";

const Stripe = () => {
  const [data, setData] = useState('')

  useEffect(() => {
    axios.get("http://localhost:5000/api/data")
      .then(response => setData(response.data.message))
      .catch(error => console.error("Error fetching data:", error));
  },[])

  const plans = [
    { id: "price_1Qx5W34SsMf0AuzyTYpp6f6S", name: "Basic", price: "$10/month" },
    { id: "price_1Qx5kR4SsMf0AuzycsmSGmTL", name: "Pro", price: "$50/month" }
  ];

  // create subscription
  const handleSubscribe = async (priceId, planName) => {
    const email = prompt("Enter your email:");

    if (!email) {
      alert("Email is required to proceed!");
      return;
    }

    const res = await fetch("http://localhost:5000/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, planName }),
    });

    const data = await res.json();
    console.log("data",data)
    if (data.alreadySubscribed) {
      alert(`You are already subscribed to the ${data.plan} plan.`);
      return;
    }
    window.location.href = data.url;
  };

  // upgrade subscription
  const handleUpgrade = async (newPriceId) => {
    const email = prompt("Enter your email to upgrade:");
  
    if (!email) {
      alert("Email is required to proceed!");
      return;
    }
  
    const res = await fetch("http://localhost:5000/api/upgrade-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, newPriceId }),
    });
  
    const data = await res.json();
  
    if (data.error) {
      alert(data.error);
    } else {
      alert("Your subscription has been upgraded!");
      console.log(data.subscription);
    }
  };

  return (
    <div>
      Stripe Integration
      Data from backend : {data}
      <br></br>
      {plans.map((plan) => (
        <button key={plan.id} onClick={() => handleSubscribe(plan.id, plan.name)}>
          Subscribe to {plan.name} Plan ({plan.price})
        </button>
      ))}
      <br></br>
      {plans.map((plan) => (
        <button key={plan.id} onClick={() => handleUpgrade(plan.id)}>
          Upgrade to {plan.name} Plan ({plan.price})
        </button>
      ))}
    </div>
  )
}

export default Stripe