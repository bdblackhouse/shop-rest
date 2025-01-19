export function PayWithBkash() {
  const initiateBkashPayment = () => {
    // Make a request to the backend to create a payment
    fetch('/bkash/create-payment', {
      method: 'GET', // or POST if you need to send data
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Redirect to bKash payment page
        window.location.href = data.bkashURL;
      })
      .catch((error) => console.error('Error:', error));
  };

  return <button onClick={initiateBkashPayment}>Pay with bKash</button>;
}
