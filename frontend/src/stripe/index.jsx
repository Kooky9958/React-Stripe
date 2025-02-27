import React, { useEffect, useState } from 'react'
import axios from "axios";

const Stripe = () => {
  const [data, setData] = useState('')

  useEffect(() => {
    axios.get("http://localhost:5000/api/data")
      .then(response => setData(response.data.message))
      .catch(error => console.error("Error fetching data:", error));
  },[])

  return (
    <div>
        Stripe Integration
        Data from backend : {data}
    </div>
  )
}

export default Stripe