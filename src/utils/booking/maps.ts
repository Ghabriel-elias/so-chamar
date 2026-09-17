export function mapLinks(address: string) {
  const query = encodeURIComponent(address);

  return {
    geo: `geo:0,0?q=${query}`,
    google: `https://www.google.com/maps/search/?api=1&query=${query}`,
    apple: `https://maps.apple.com/?q=${query}`,
    waze: `https://waze.com/ul?q=${query}&navigate=yes`,
  };
}
